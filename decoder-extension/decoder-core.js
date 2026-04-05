/**
 * BRAIN DECODER v3 — AES-256-GCM
 *
 * Chiffrement réel. Sans la clé maître = bruit pur.
 * La clé ne quitte jamais cette extension.
 *
 * Format d'un bloc chiffré dans le HTML :
 *   ⟦iv:ciphertext:tag⟧
 *
 * Tout est en base64url. Illisible sans la clé.
 */

const DECODER_VERSION = 3;

// ─── Clé maître (à changer si compromis) ──────────────────────────────────────
// Cette valeur est la seule chose vraiment secrète.
// Change-la ici + re-encode le site avec encode-tool.html
const MASTER_PASSPHRASE = "BODANBAN::WAR-ROOM::2026::§∆Ω";

// ─── Dérivation de clé (PBKDF2) ───────────────────────────────────────────────
async function deriveKey(passphrase) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("bodanban-brain-salt-v3"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Encodage base64url ────────────────────────────────────────────────────────
function toB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// ─── Chiffrement ──────────────────────────────────────────────────────────────
async function encrypt(plaintext) {
  const key = await deriveKey(MASTER_PASSPHRASE);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(plaintext)
  );
  // Les 16 derniers bytes = tag GCM
  const cipher = new Uint8Array(cipherBuf, 0, cipherBuf.byteLength - 16);
  const tag = new Uint8Array(cipherBuf, cipherBuf.byteLength - 16);
  return `⟦${toB64(iv)}:${toB64(cipher)}:${toB64(tag)}⟧`;
}

// ─── Déchiffrement ────────────────────────────────────────────────────────────
async function decrypt(encoded) {
  const match = encoded.match(/^⟦(.+):(.+):(.+)⟧$/);
  if (!match) return null;
  const [, ivB64, cipherB64, tagB64] = match;
  const iv = fromB64(ivB64);
  const cipher = fromB64(cipherB64);
  const tag = fromB64(tagB64);

  // Recompose cipher + tag (format AES-GCM de WebCrypto)
  const combined = new Uint8Array(cipher.length + tag.length);
  combined.set(cipher);
  combined.set(tag, cipher.length);

  try {
    const key = await deriveKey(MASTER_PASSPHRASE);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, key, combined
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return "⚠ DÉCHIFFREMENT ÉCHOUÉ";
  }
}

// ─── Décodage de tout le DOM ──────────────────────────────────────────────────
const BLOCK_REGEX = /⟦[A-Za-z0-9\-_]+:[A-Za-z0-9\-_]+:[A-Za-z0-9\-_]+⟧/g;

async function decodeTextNode(node) {
  const matches = node.textContent.match(BLOCK_REGEX);
  if (!matches) return;
  let text = node.textContent;
  for (const block of matches) {
    const plain = await decrypt(block);
    if (plain) text = text.replace(block, plain);
  }
  node.textContent = text;
}

async function decodeAttr(node, attr) {
  const val = node.getAttribute(attr);
  if (!val) return;
  const matches = val.match(BLOCK_REGEX);
  if (!matches) return;
  let decoded = val;
  for (const block of matches) {
    const plain = await decrypt(block);
    if (plain) decoded = decoded.replace(block, plain);
  }
  node.setAttribute(attr, decoded);
}

async function decodeDOM(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  await Promise.all(nodes.map(async node => {
    if (node.nodeType === Node.TEXT_NODE) {
      await decodeTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      await decodeAttr(node, 'href');
      await decodeAttr(node, 'title');
      await decodeAttr(node, 'data-prompt');
    }
  }));
}

// ─── Export pour content script ───────────────────────────────────────────────
window.__BrainDecoder = { encrypt, decrypt, decodeDOM, MASTER_PASSPHRASE };
