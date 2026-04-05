// BRAIN DECODER v3 — Content Script
// Injecte decoder-core.js puis décode tout le DOM

(async () => {
  // Attendre que decoder-core soit chargé
  let attempts = 0;
  while (!window.__BrainDecoder && attempts < 50) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }
  if (!window.__BrainDecoder) {
    console.error('[BrainDecoder] Core non chargé');
    return;
  }

  const { decodeDOM } = window.__BrainDecoder;

  // Décoder le DOM complet
  await decodeDOM(document.body);

  // Décoder les data-prompt sur les cartes (pour les boutons Reprendre)
  document.querySelectorAll('[data-prompt]').forEach(el => {
    el.addEventListener('click', () => {
      const prompt = el.getAttribute('data-prompt');
      if (prompt) {
        navigator.clipboard.writeText(prompt);
        const original = el.textContent;
        el.textContent = '✓ Copié';
        setTimeout(() => el.textContent = original, 2000);
      }
    });
  });

  // Badge
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: fixed; bottom: 1rem; right: 1rem;
    background: #22c55e18; border: 1px solid #22c55e55;
    color: #22c55e; font-size: 0.62rem; font-family: 'SF Mono', monospace;
    padding: 4px 12px; border-radius: 20px; z-index: 9999;
    letter-spacing: 0.08em; font-weight: 700; cursor: default;
    user-select: none;
  `;
  badge.title = 'Brain Decoder v3 — AES-256-GCM actif';
  badge.textContent = '⬡ DECODED v3';
  document.body.appendChild(badge);

  console.log('[BrainDecoder v3] AES-256-GCM — DOM déchiffré');
})();
