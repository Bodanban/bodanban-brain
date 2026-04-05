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
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: var(--vscode-sideBar-background);
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family);
    font-size: 12px;
    padding: 8px;
  }
  .btn {
    display: block; width: 100%;
    background: #7c3aed; color: white; border: none;
    padding: 7px 12px; border-radius: 6px; cursor: pointer;
    font-size: 11px; font-weight: 600; margin-bottom: 6px;
    text-align: left; letter-spacing: 0.02em;
  }
  .btn:hover { background: #6d28d9; }
  .btn.secondary {
    background: transparent;
    border: 1px solid var(--vscode-panel-border);
    color: var(--vscode-foreground);
  }
  .btn.secondary:hover { background: var(--vscode-list-hoverBackground); }
  .section-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--vscode-descriptionForeground);
    margin: 12px 0 6px;
  }
  .project-item {
    padding: 6px 8px; border-radius: 4px; cursor: pointer;
    border: 1px solid transparent; margin-bottom: 3px;
    font-size: 11px;
  }
  .project-item:hover { background: var(--vscode-list-hoverBackground); border-color: var(--vscode-panel-border); }
  .overlay {
    position: fixed; inset: 0;
    background: var(--vscode-sideBar-background);
    padding: 12px; overflow-y: auto;
    display: none; z-index: 100;
  }
  .overlay.active { display: block; }
  label { display: block; font-size: 10px; color: var(--vscode-descriptionForeground); margin-bottom: 3px; margin-top: 8px; }
  input, textarea, select {
    width: 100%; background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    padding: 5px 7px; border-radius: 4px; font-size: 11px;
    font-family: inherit; resize: vertical;
  }
  .toast {
    position: fixed; bottom: 12px; left: 8px; right: 8px;
    padding: 8px 12px; border-radius: 6px; font-size: 11px;
    display: none; z-index: 200;
  }
  .toast.success { background: #22c55e22; border: 1px solid #22c55e44; color: #22c55e; }
  .toast.error { background: #ef444422; border: 1px solid #ef444444; color: #ef4444; }
  .config-row { display: flex; gap: 4px; align-items: flex-end; }
  .config-row input { flex: 1; }
</style>
</head>
<body>

<!-- Vue principale -->
<div id="main">
  <button class="btn" onclick="openSave()">+ Save Project & History</button>
  <button class="btn secondary" onclick="openWarRoom()">⬡ Ouvrir War Room</button>

  <div class="section-title">Projets</div>
  <div id="projects-list"><div style="color:var(--vscode-descriptionForeground);font-size:11px">Chargement...</div></div>

  <div class="section-title">Config</div>
  <label>GitHub Token</label>
  <div class="config-row">
    <input type="password" id="gh-token" placeholder="ghp_..." />
    <button class="btn" style="width:auto;padding:5px 10px;margin:0" onclick="saveToken()">OK</button>
  </div>
</div>

<!-- Overlay Save Session -->
<div class="overlay" id="save-overlay">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <strong style="font-size:12px">Save Project & History</strong>
    <span onclick="closeSave()" style="cursor:pointer;font-size:16px;color:var(--vscode-descriptionForeground)">✕</span>
  </div>

  <label>Nom du projet *</label>
  <input id="s-name" placeholder="Faso Code" />

  <label>Tagline courte</label>
  <input id="s-tagline" placeholder="App permis de conduire BF" />

  <label>Statut</label>
  <select id="s-status">
    <option>En build</option>
    <option>Actif</option>
    <option>À reconstruire</option>
    <option>Planifié</option>
    <option>Abandonné</option>
  </select>

  <label>Dossier local (dans THE WAR/)</label>
  <input id="s-folder" placeholder="Application de permis" />

  <label>Ce qu'on a accompli cette session</label>
  <textarea id="s-notes" rows="3" placeholder="- Implémenté le système XP&#10;- Corrigé le bug de navigation..."></textarea>

  <label>État actuel du projet</label>
  <textarea id="s-state" rows="3" placeholder="Où en est le projet exactement aujourd'hui"></textarea>

  <label>Prompt de reprise (sera chiffré)</label>
  <textarea id="s-prompt" rows="5" placeholder="Tu es Claude, je reprends [projet]... contexte complet pour repartir de zéro"></textarea>

  <button class="btn" style="margin-top:12px" onclick="saveSession()">Sauvegarder dans bodanban-brain</button>
  <button class="btn secondary" onclick="closeSave()">Annuler</button>
</div>

<div class="toast" id="toast"></div>

<script>
  const vscode = acquireVsCodeApi();

  // Charger config et projets au démarrage
  vscode.postMessage({ type: 'load' });
  vscode.postMessage({ type: 'getToken' });

  window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'projects') renderProjects(msg.data);
    if (msg.type === 'config') {
      if (msg.token) document.getElementById('gh-token').value = msg.token;
    }
    if (msg.type === 'success') showToast(msg.msg, 'success');
    if (msg.type === 'error') showToast(msg.msg, 'error');
    if (msg.type === 'openSave') openSave();
  });

  function renderProjects(projects) {
    const list = document.getElementById('projects-list');
    if (!projects.length) {
      list.innerHTML = '<div style="color:var(--vscode-descriptionForeground);font-size:11px">Aucun projet trouvé</div>';
      return;
    }
    list.innerHTML = projects.map(p =>
      \`<div class="project-item" onclick="prefillSave('\${p.name}')">
        \${p.name.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
      </div>\`
    ).join('');
  }

  function prefillSave(name) {
    document.getElementById('s-name').value = name.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
    openSave();
  }

  function openSave() {
    document.getElementById('save-overlay').classList.add('active');
  }

  function closeSave() {
    document.getElementById('save-overlay').classList.remove('active');
  }

  function openWarRoom() {
    vscode.postMessage({ type: 'warroom' });
  }

  function saveToken() {
    // Stocker via extension (pas en localStorage — sécurité)
    const token = document.getElementById('gh-token').value.trim();
    vscode.postMessage({ type: 'save', data: { __setToken: token } });
    showToast('Token sauvegardé', 'success');
  }

  function saveSession() {
    const name = document.getElementById('s-name').value.trim();
    if (!name) { showToast('Nom du projet requis', 'error'); return; }
    vscode.postMessage({ type: 'save', data: {
      projectName: name,
      tagline: document.getElementById('s-tagline').value.trim(),
      status: document.getElementById('s-status').value,
      localFolder: document.getElementById('s-folder').value.trim(),
      sessionNotes: document.getElementById('s-notes').value.trim(),
      currentState: document.getElementById('s-state').value.trim(),
      prompt: document.getElementById('s-prompt').value.trim(),
    }});
    closeSave();
  }

  function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = \`toast \${type}\`;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
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
