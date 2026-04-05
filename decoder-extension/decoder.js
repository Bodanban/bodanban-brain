// BRAIN DECODER — Dictionnaire local privé
// Ce fichier ne quitte jamais ta machine

const DICT = {
  // GitHub
  "§GH_USER§":        "Bodanban",
  "§GH_BRAIN§":       "Bodanban/bodanban-brain",
  "§GH_CRM§":         "Bodanban/letto-cake-crm",
  "§GH_LEVY§":        "Bodanban/levychristian-site",
  "§GH_MODE§":        "Bodanban/mode-switch",
  "§GH_WIZARD§":      "Bodanban/levy-brand-wizard",
  "§GH_UJKZ§":        "bodanban.github.io/ujkz-medecine-listes",

  // Domaines & URLs
  "§DOM_BS§":         "besimple.levychristian.com",
  "§DOM_UJKZ§":       "bodanban.github.io/ujkz-medecine-listes",

  // Clients & noms
  "§CLIENT_CAKE§":    "Pâtisserie Arlette",
  "§CLIENT_LEVY§":    "Levy Christian",
  "§ACCOUNT_X§":      "@ayanakoshi",

  // Clés & IDs sensibles
  "§ADSENSE§":        "pub-7632568438658075",
  "§HOST§":           "Hostinger",

  // Projets
  "§PROJ_ZOLIA§":     "Zoliais (Brand Wizard)",
  "§DATE_LOST§":      "05/04/2026",
};

function decode(text) {
  let result = text;
  for (const [token, value] of Object.entries(DICT)) {
    result = result.split(token).join(value);
  }
  return result;
}

function decodeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const decoded = decode(node.textContent);
    if (decoded !== node.textContent) {
      node.textContent = decoded;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Décoder les attributs href et title aussi
    if (node.hasAttribute('href')) {
      node.setAttribute('href', decode(node.getAttribute('href')));
    }
    if (node.hasAttribute('title')) {
      node.setAttribute('title', decode(node.getAttribute('title')));
    }
    node.childNodes.forEach(decodeNode);
  }
}

// Décoder tout le body
decodeNode(document.body);

// Badge discret pour confirmer que le décodeur est actif
const badge = document.createElement('div');
badge.style.cssText = `
  position: fixed; bottom: 1rem; right: 1rem;
  background: #22c55e22; border: 1px solid #22c55e44;
  color: #22c55e; font-size: 0.65rem; font-family: monospace;
  padding: 4px 10px; border-radius: 20px; z-index: 9999;
  letter-spacing: 0.05em; font-weight: 600;
`;
badge.textContent = '⬡ DECODED';
document.body.appendChild(badge);
