# bodanban-brain — War Room & système de mémoire

**Statut** : Actif
**Dernière session** : Avril 2026
**Repo GitHub** : Bodanban/bodanban-brain (public)
**URL** : https://bodanban.github.io/bodanban-brain/

---

## Vision finale
Un cerveau partagé entre toutes les machines (Windows PC → Mac → n'importe où).
- **War Room** : page GitHub Pages qui liste tous les projets actifs avec état, filtres, boutons Reprendre
- **Brain Sync** : extension VS Code qui sauvegarde automatiquement le contexte de chaque session
- **Decoder** : extension Chrome AES-256-GCM qui déchiffre les infos sensibles sur le War Room public
- **projects/** : un fichier .md par projet avec la mémoire complète du raisonnement

---

## Décisions prises

- **GitHub Pages public** + chiffrement AES-256 → accessible partout, infos sensibles illisibles sans la clé
- **Decoder v3 AES-256-GCM** → clé maître locale, PBKDF2 100k itérations, format `⟦iv:cipher:tag⟧`
- **encode-tool.html gitignored** → outil local pour chiffrer, jamais pushé
- **Extension VS Code Brain Sync** → 3 onglets FR, token masqué, push GitHub auto
- **Slash command `/save-session`** → Claude analyse et push sans intervention manuelle
- **projects/_TEMPLATE.md** → modèle standardisé

---

## Chemins abandonnés

- **Tokens `§TOKEN§` simples** → remplacé par AES-256 réel
- **Extension Chrome v1** (find/replace) → upgradé en Decoder v3 AES-256-GCM
- **Interface VS Code anglaise** → refaite en français avec UI dark

---

## État actuel (Avril 2026)

Déployé et fonctionnel. War Room live, Decoder v3 opérationnel, Brain Sync v1.0 installé.
Prompts de reprise dans projects/ encore en clair — à chiffrer via encode-tool.html.
Fiches manquantes : auto-pari, crm-letto-cake, tools, x-twitter-growth-bot.

---

## Historique des sessions

### Avril 2026 — Session fondatrice
- Grand triage THE WAR : 35 projets supprimés
- Création bodanban-brain (privé → public)
- War Room HTML + Decoder v1→v3 (AES-256-GCM)
- Brain Sync VS Code v1→v2 (français, dark, tabs)
- Slash command /save-session créé
- PLAYGROUND.md + ITERATIONS.md + projects/ créés
- Brand Wizard (Zoliais) perdu définitivement — leçon : commit immédiat

---

## Prompt de reprise
Tu es Claude, mon assistant dev. Je reprends bodanban-brain — mon système de mémoire partagée. Repo public : Bodanban/bodanban-brain. War Room : https://bodanban.github.io/bodanban-brain/ Stack : HTML statique, Chrome Extension MV3 AES-256-GCM, VS Code Extension, GitHub API. Tout est déployé. Prochaine étape : chiffrer les prompts dans projects/ via encode-tool.html et ajouter les fiches manquantes. Lis CLAUDE.md, PLAYGROUND.md et ITERATIONS.md pour le contexte complet.
<!-- À CHIFFRER via encode-tool.html -->
