const vscode = require('vscode');
const https = require('https');
const crypto = require('crypto');

// ─── Config ────────────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'Bodanban';
const GITHUB_REPO  = 'bodanban-brain';
const WAR_ROOM_URL = 'https://bodanban.github.io/bodanban-brain/';

// ─── Chiffrement AES-256-GCM (même logique que decoder-core.js) ───────────────
const SALT = 'bodanban-brain-salt-v3';
const ITERATIONS = 100000;

function deriveKey(passphrase) {
  return crypto.pbkdf2Sync(passphrase, SALT, ITERATIONS, 32, 'sha256');
}

function encrypt(plaintext, passphrase) {
  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const toB64 = b => b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return `⟦${toB64(iv)}:${toB64(encrypted)}:${toB64(tag)}⟧`;
}

function decrypt(encoded, passphrase) {
  const match = encoded.match(/^⟦(.+):(.+):(.+)⟧$/);
  if (!match) return null;
  const fromB64 = s => Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'), 'base64');
  const [, ivB64, cipherB64, tagB64] = match;
  try {
    const key = deriveKey(passphrase);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, fromB64(ivB64));
    decipher.setAuthTag(fromB64(tagB64));
    return Buffer.concat([decipher.update(fromB64(cipherB64)), decipher.final()]).toString('utf8');
  } catch { return null; }
}

// ─── GitHub API ───────────────────────────────────────────────────────────────
async function githubRequest(token, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'BrainSync-VSCode/1.0',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d || '{}')));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getFileSha(token, filePath) {
  const res = await githubRequest(token, 'GET', `/contents/${filePath}`);
  return res.sha || null;
}

async function pushFile(token, filePath, content, message) {
  const sha = await getFileSha(token, filePath);
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    ...(sha ? { sha } : {})
  };
  return githubRequest(token, 'PUT', `/contents/${filePath}`, body);
}

async function getFile(token, filePath) {
  const res = await githubRequest(token, 'GET', `/contents/${filePath}`);
  if (!res.content) return null;
  return Buffer.from(res.content.replace(/\n/g,''), 'base64').toString('utf8');
}

// ─── Extension principale ─────────────────────────────────────────────────────
function activate(context) {

  // Sidebar WebView
  const provider = new BrainSyncViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('brain-projects', provider)
  );

  // Commande : Save Session
  context.subscriptions.push(
    vscode.commands.registerCommand('brain-sync.saveSession', () => {
      provider.openSaveDialog();
    })
  );

  // Commande : Ouvrir War Room
  context.subscriptions.push(
    vscode.commands.registerCommand('brain-sync.openWarRoom', () => {
      vscode.env.openExternal(vscode.Uri.parse(WAR_ROOM_URL));
    })
  );
}

// ─── WebView Provider ─────────────────────────────────────────────────────────
class BrainSyncViewProvider {
  constructor(context) {
    this._context = context;
    this._view = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage(async msg => {
      switch (msg.type) {
        case 'save':    await this._handleSave(msg.data); break;
        case 'load':    await this._handleLoad(); break;
        case 'warroom': vscode.env.openExternal(vscode.Uri.parse(WAR_ROOM_URL)); break;
        case 'getToken': this._sendToken(); break;
      }
    });
  }

  openSaveDialog() {
    if (this._view) {
      this._view.show(true);
      this._view.webview.postMessage({ type: 'openSave' });
    }
  }

  _sendToken() {
    const token = this._context.globalState.get('githubToken') || '';
    const passphrase = this._context.globalState.get('passphrase') || '';
    this._view?.webview.postMessage({ type: 'config', token, passphrase });
  }

  async _handleSave(data) {
    const token = this._context.globalState.get('githubToken');
    const passphrase = this._context.globalState.get('passphrase') || 'BODANBAN::WAR-ROOM::2026::§∆Ω';

    if (!token) {
      this._view?.webview.postMessage({ type: 'error', msg: 'Token GitHub manquant. Configure-le dans les paramètres.' });
      return;
    }

    // Chiffrer le prompt de reprise
    const encryptedPrompt = data.prompt ? encrypt(data.prompt, passphrase) : '';

    const slug = data.projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const date = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const filePath = `projects/${slug}.md`;

    // Lire le fichier existant si il existe
    let existing = await getFile(token, filePath);

    const content = existing
      ? this._updateExisting(existing, data, encryptedPrompt, date)
      : this._createNew(data, encryptedPrompt, date, slug);

    try {
      await pushFile(token, filePath, content, `Update ${data.projectName} — ${new Date().toLocaleDateString('fr-FR')}`);
      this._view?.webview.postMessage({ type: 'success', msg: `✓ ${data.projectName} sauvegardé dans bodanban-brain` });
    } catch (e) {
      this._view?.webview.postMessage({ type: 'error', msg: `Erreur GitHub: ${e.message}` });
    }
  }

  _createNew(data, encryptedPrompt, date, slug) {
    return `# ${data.projectName}${data.tagline ? ' — ' + data.tagline : ''}

**Statut** : ${data.status || 'En build'}
**Dernière session** : ${date}
**Dossier local** : \`THE WAR/${data.localFolder || data.projectName}\`

---

## Vision finale
${data.vision || '[À compléter]'}

---

## Décisions prises

${data.decisions || '- [À documenter au fil des sessions]'}

---

## Chemins abandonnés

${data.abandoned || '- [À documenter quand pertinent]'}

---

## État actuel (${date})
${data.currentState || '[À compléter]'}

---

## Historique des sessions

### ${date}
${data.sessionNotes || '[Notes de cette session]'}

---

## Prompt de reprise
${encryptedPrompt || '[À générer avec encode-tool.html]'}
`;
  }

  _updateExisting(existing, data, encryptedPrompt, date) {
    // Mettre à jour la date de dernière session
    let updated = existing.replace(
      /\*\*Dernière session\*\* : .+/,
      `**Dernière session** : ${date}`
    );

    // Mettre à jour l'état actuel
    if (data.currentState) {
      updated = updated.replace(
        /## État actuel \(.+?\)\n[\s\S]*?(?=\n---)/,
        `## État actuel (${date})\n${data.currentState}\n`
      );
    }

    // Ajouter la session dans l'historique
    const sessionEntry = `### ${date}\n${data.sessionNotes || '[Notes de cette session]'}\n\n`;
    updated = updated.replace(
      /## Historique des sessions\n\n/,
      `## Historique des sessions\n\n${sessionEntry}`
    );

    // Mettre à jour le prompt de reprise
    if (encryptedPrompt) {
      updated = updated.replace(
        /## Prompt de reprise\n[\s\S]*?$/,
        `## Prompt de reprise\n${encryptedPrompt}\n`
      );
    }

    return updated;
  }

  async _handleLoad() {
    const token = this._context.globalState.get('githubToken');
    if (!token) {
      this._view?.webview.postMessage({ type: 'projects', data: [] });
      return;
    }
    try {
      const res = await githubRequest(token, 'GET', '/contents/projects');
      const projects = Array.isArray(res)
        ? res.filter(f => f.name.endsWith('.md') && !f.name.startsWith('_'))
             .map(f => ({ name: f.name.replace('.md',''), path: f.path }))
        : [];
      this._view?.webview.postMessage({ type: 'projects', data: projects });
    } catch {
      this._view?.webview.postMessage({ type: 'projects', data: [] });
    }
  }

  _getHtml() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  :root {
    --accent: #7c3aed;
    --accent-hover: #6d28d9;
    --accent-dim: #7c3aed22;
    --green: #22c55e;
    --red: #ef4444;
    --yellow: #eab308;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: var(--vscode-sideBar-background);
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family);
    font-size: 12px;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .header {
    padding: 12px 12px 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .logo {
    display: flex; align-items: center; gap: 7px;
    font-weight: 700; font-size: 12px; letter-spacing: 0.02em;
  }
  .logo-hex {
    width: 22px; height: 22px;
    background: var(--accent); border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: white;
  }
  .header-actions { display: flex; gap: 4px; }
  .icon-btn {
    background: transparent; border: none; cursor: pointer;
    color: var(--vscode-descriptionForeground);
    padding: 3px 5px; border-radius: 4px; font-size: 14px;
    transition: background 0.15s, color 0.15s;
  }
  .icon-btn:hover { background: var(--vscode-list-hoverBackground); color: var(--vscode-foreground); }

  /* ── TABS ── */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
  }
  .tab {
    flex: 1; padding: 7px 4px; text-align: center;
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; cursor: pointer;
    color: var(--vscode-descriptionForeground);
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }
  .tab:hover { color: var(--vscode-foreground); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  /* ── CONTENU ── */
  .tab-content { display: none; flex: 1; overflow-y: auto; padding: 10px; }
  .tab-content.active { display: flex; flex-direction: column; gap: 6px; }

  /* ── PROJETS ── */
  .project-card {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 7px; padding: 8px 10px; cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .project-card:hover { border-color: var(--accent); background: var(--accent-dim); }
  .project-name { font-size: 11px; font-weight: 600; }
  .project-date { font-size: 9px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
  .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .dot.active { background: var(--green); }
  .dot.building { background: var(--yellow); }
  .dot.lost { background: var(--red); }
  .empty-state {
    text-align: center; color: var(--vscode-descriptionForeground);
    font-size: 11px; padding: 20px 0; opacity: 0.7;
  }

  /* ── BOUTONS ── */
  .btn-primary {
    background: var(--accent); color: white; border: none;
    padding: 8px 12px; border-radius: 7px; cursor: pointer;
    font-size: 11px; font-weight: 700; width: 100%;
    letter-spacing: 0.03em; transition: background 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-secondary {
    background: transparent; border: 1px solid var(--vscode-panel-border);
    color: var(--vscode-foreground); padding: 7px 12px; border-radius: 7px;
    cursor: pointer; font-size: 11px; width: 100%;
    transition: background 0.15s; display: flex; align-items: center;
    justify-content: center; gap: 6px;
  }
  .btn-secondary:hover { background: var(--vscode-list-hoverBackground); }

  /* ── FORMULAIRE ── */
  .form-group { display: flex; flex-direction: column; gap: 3px; }
  .form-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: var(--vscode-descriptionForeground);
  }
  .form-input {
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    padding: 6px 8px; border-radius: 5px; font-size: 11px;
    font-family: inherit; width: 100%;
    transition: border-color 0.15s;
  }
  .form-input:focus { outline: none; border-color: var(--accent); }
  textarea.form-input { resize: vertical; min-height: 60px; }
  select.form-input { cursor: pointer; }
  .form-hint { font-size: 9px; color: var(--vscode-descriptionForeground); opacity: 0.7; }

  /* ── CONFIG ── */
  .token-row { display: flex; gap: 5px; }
  .token-row .form-input { flex: 1; font-family: monospace; letter-spacing: 0.05em; }
  .token-status {
    font-size: 10px; padding: 4px 8px; border-radius: 4px; margin-top: 4px;
    display: none;
  }
  .token-status.ok { display: block; background: #22c55e15; color: var(--green); border: 1px solid #22c55e33; }
  .token-status.missing { display: block; background: #ef444415; color: var(--red); border: 1px solid #ef444433; }

  /* ── SÉPARATEUR ── */
  .sep { height: 1px; background: var(--vscode-panel-border); margin: 4px 0; flex-shrink: 0; }
  .section-label {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--vscode-descriptionForeground);
    padding: 4px 0 2px; flex-shrink: 0;
  }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 10px; left: 8px; right: 8px;
    padding: 8px 12px; border-radius: 7px; font-size: 11px;
    font-weight: 600; opacity: 0; transition: opacity 0.25s;
    pointer-events: none; z-index: 999; text-align: center;
  }
  .toast.success { background: #22c55e18; border: 1px solid #22c55e44; color: var(--green); }
  .toast.error { background: #ef444418; border: 1px solid #ef444444; color: var(--red); }
  .toast.show { opacity: 1; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--vscode-panel-border); border-radius: 4px; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="logo">
    <div class="logo-hex">⬡</div>
    <span>Brain Sync</span>
  </div>
  <div class="header-actions">
    <button class="icon-btn" onclick="openWarRoom()" title="Ouvrir War Room">🌐</button>
    <button class="icon-btn" onclick="refreshProjects()" title="Actualiser">↻</button>
  </div>
</div>

<!-- TABS -->
<div class="tabs">
  <div class="tab active" onclick="switchTab('projets')">Projets</div>
  <div class="tab" onclick="switchTab('sauvegarder')">Sauvegarder</div>
  <div class="tab" onclick="switchTab('config')">Config</div>
</div>

<!-- TAB : PROJETS -->
<div class="tab-content active" id="tab-projets">
  <div class="section-label">Mes projets</div>
  <div id="projects-list">
    <div class="empty-state">Chargement...</div>
  </div>
  <div class="sep"></div>
  <button class="btn-primary" onclick="switchTab('sauvegarder')">
    <span>＋</span> Nouvelle sauvegarde
  </button>
</div>

<!-- TAB : SAUVEGARDER -->
<div class="tab-content" id="tab-sauvegarder">

  <div class="form-group">
    <div class="form-label">Nom du projet *</div>
    <input class="form-input" id="s-name" placeholder="ex : Faso Code" />
  </div>

  <div class="form-group">
    <div class="form-label">Phrase courte</div>
    <input class="form-input" id="s-tagline" placeholder="ex : App permis de conduire BF" />
  </div>

  <div class="form-group">
    <div class="form-label">Statut</div>
    <select class="form-input" id="s-status">
      <option value="En build">🟡 En build</option>
      <option value="Actif">🟢 Actif</option>
      <option value="À reconstruire">🔴 À reconstruire</option>
      <option value="Planifié">⚪ Planifié</option>
      <option value="Abandonné">⛔ Abandonné</option>
    </select>
  </div>

  <div class="form-group">
    <div class="form-label">Dossier local</div>
    <input class="form-input" id="s-folder" placeholder="ex : Application de permis" />
    <div class="form-hint">Nom du dossier dans THE WAR/</div>
  </div>

  <div class="form-group">
    <div class="form-label">Ce qu'on a fait cette session</div>
    <textarea class="form-input" id="s-notes" placeholder="- Implémenté le système XP&#10;- Corrigé le bug de navigation..."></textarea>
  </div>

  <div class="form-group">
    <div class="form-label">Où en est le projet</div>
    <textarea class="form-input" id="s-state" placeholder="Décris l'état exact du projet aujourd'hui"></textarea>
  </div>

  <div class="form-group">
    <div class="form-label">🔐 Prompt de reprise</div>
    <textarea class="form-input" id="s-prompt" style="min-height:80px" placeholder="Tu es Claude, je reprends [projet]...&#10;Contexte complet pour repartir de zéro.&#10;&#10;Ce texte sera chiffré AES-256 avant d'être sauvegardé."></textarea>
    <div class="form-hint">⟦ Sera chiffré automatiquement ⟧</div>
  </div>

  <button class="btn-primary" onclick="saveSession()">
    <span>💾</span> Sauvegarder dans bodanban-brain
  </button>
  <button class="btn-secondary" onclick="resetForm()">
    Vider le formulaire
  </button>
</div>

<!-- TAB : CONFIG -->
<div class="tab-content" id="tab-config">

  <div class="form-group">
    <div class="form-label">Token GitHub</div>
    <div class="token-row">
      <input class="form-input" type="password" id="gh-token" placeholder="ghp_••••••••••••••••" autocomplete="off" />
      <button class="btn-primary" style="width:auto;padding:6px 12px" onclick="saveToken()">OK</button>
    </div>
    <div class="form-hint">Scope requis : <strong>repo</strong></div>
    <div class="token-status" id="token-status"></div>
  </div>

  <div class="sep"></div>

  <div class="section-label">À propos</div>
  <div style="font-size:10px;color:var(--vscode-descriptionForeground);line-height:1.6">
    <div>Brain Sync v1.0</div>
    <div>Chiffrement : AES-256-GCM</div>
    <div>Repo : Bodanban/bodanban-brain</div>
  </div>

  <div class="sep"></div>
  <button class="btn-secondary" onclick="openWarRoom()">
    <span>🌐</span> Ouvrir le War Room
  </button>
</div>

<div class="toast" id="toast"></div>

<script>
const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'load' });
vscode.postMessage({ type: 'getToken' });

window.addEventListener('message', e => {
  const msg = e.data;
  if (msg.type === 'projects') renderProjects(msg.data);
  if (msg.type === 'config') {
    if (msg.token) {
      document.getElementById('gh-token').value = msg.token;
      showTokenStatus(true);
    } else {
      showTokenStatus(false);
    }
  }
  if (msg.type === 'success') { showToast(msg.msg, 'success'); resetForm(); switchTab('projets'); refreshProjects(); }
  if (msg.type === 'error') showToast(msg.msg, 'error');
  if (msg.type === 'openSave') switchTab('sauvegarder');
});

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t,i) => {
    const names = ['projets','sauvegarder','config'];
    t.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

function renderProjects(projects) {
  const list = document.getElementById('projects-list');
  if (!projects.length) {
    list.innerHTML = '<div class="empty-state">Aucun projet trouvé<br><small>Configure ton token GitHub</small></div>';
    return;
  }
  const dots = { 'faso-code':'building','be-simple':'building','brand-wizard':'lost' };
  list.innerHTML = projects.map(p => {
    const dot = dots[p.name] || 'active';
    const label = p.name.replace(/-/g,' ').replace(/\\b\\w/g, l => l.toUpperCase());
    return \`<div class="project-card" onclick="prefillSave('\${p.name}')">
      <div>
        <div class="project-name">\${label}</div>
        <div class="project-date">Cliquer pour reprendre</div>
      </div>
      <div class="dot \${dot}"></div>
    </div>\`;
  }).join('');
}

function prefillSave(name) {
  document.getElementById('s-name').value = name.replace(/-/g,' ').replace(/\\b\\w/g, l => l.toUpperCase());
  switchTab('sauvegarder');
}

function refreshProjects() { vscode.postMessage({ type: 'load' }); }
function openWarRoom() { vscode.postMessage({ type: 'warroom' }); }

function saveToken() {
  const token = document.getElementById('gh-token').value.trim();
  if (!token) { showToast('Colle ton token GitHub d\\'abord', 'error'); return; }
  vscode.postMessage({ type: 'save', data: { __setToken: token } });
  showTokenStatus(true);
  showToast('Token sauvegardé ✓', 'success');
}

function showTokenStatus(ok) {
  const el = document.getElementById('token-status');
  el.className = 'token-status ' + (ok ? 'ok' : 'missing');
  el.textContent = ok ? '✓ Token configuré' : '✗ Token manquant — ajoute-le ci-dessus';
}

function saveSession() {
  const name = document.getElementById('s-name').value.trim();
  if (!name) { showToast('Le nom du projet est requis', 'error'); return; }
  vscode.postMessage({ type: 'save', data: {
    projectName: name,
    tagline: document.getElementById('s-tagline').value.trim(),
    status: document.getElementById('s-status').value,
    localFolder: document.getElementById('s-folder').value.trim(),
    sessionNotes: document.getElementById('s-notes').value.trim(),
    currentState: document.getElementById('s-state').value.trim(),
    prompt: document.getElementById('s-prompt').value.trim(),
  }});
}

function resetForm() {
  ['s-name','s-tagline','s-folder','s-notes','s-state','s-prompt'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('s-status').value = 'En build';
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = \`toast \${type} show\`;
  setTimeout(() => t.classList.remove('show'), 2800);
}
</script>
</body>
</html>`;
  }
}

// Handle token save from webview
const _origHandleSave = BrainSyncViewProvider.prototype._handleSave;
BrainSyncViewProvider.prototype._handleSave = async function(data) {
  if (data.__setToken !== undefined) {
    await this._context.globalState.update('githubToken', data.__setToken);
    return;
  }
  return _origHandleSave.call(this, data);
};

function deactivate() {}
module.exports = { activate, deactivate };
