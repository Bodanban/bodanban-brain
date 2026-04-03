# BODANBAN BRAIN — Contexte Claude

Ce repo est le cerveau partagé entre Windows PC et Mac.
Quand tu lis ce fichier, tu as le contexte complet de l'environnement et des projets actifs.

---

## Identité

- **GitHub:** Bodanban
- **Profil:** Développeur/créateur, basé au Burkina Faso
- **Stack principal:** React, TypeScript, React Native (Expo), Node.js, Python
- **Transition en cours:** Windows PC → Mac (OrbStack remplace Docker)

---

## Projets actifs (avril 2026)

| Projet | Description | Repo GitHub |
|--------|-------------|-------------|
| **Application de permis** (= Faso Code) | App mobile permis de conduire Burkina Faso — React Native Expo, quiz, gamification, freemium | privé |
| **auto pari** | Système IA paris hippiques automatisé | privé |
| **Be simple** | SaaS formation + MLM affiliation — React+Supabase, domaine besimple.levychristian.com | privé |
| **Brouillon** | Expériences actives : X-Twitter-Growth-Bot (@ayanakoshi), UJKZ listes médecine | — |
| **Content manager 2026** | Gestionnaire contenu IA — en refonte pour OrbStack (abandonne Docker) | privé |
| **crm 2 test** | CRM pâtisserie Letto Cake v2 | [letto-cake-crm](https://github.com/Bodanban/letto-cake-crm) |
| **Levy christian le site 2** | Site portfolio client Levy Christian — Astro + Tailwind + GSAP | [levychristian-site](https://github.com/Bodanban/levychristian-site) |
| **No reflection** | Mode Switch — tableau de bord 7 modes opérationnels | [mode-switch](https://github.com/Bodanban/mode-switch) |
| **Tablette android sur le bureau** | Life Command Center — dashboard cyberpunk War Room | [life-command-center](https://github.com/Bodanban/life-command-center) |
| **tools** | Agrégat mini-jeux et outils pour Levy Christian | — |
| **Vps tool** | Scripts VPN WireGuard — VPS actif | — |
| **X-Twitter-Growth-Bot** | Chrome extension automation @ayanakoshi 0→1000 followers | — |
| **UJKZ médecine listes** | Listes collaboratives médecine Firebase + GitHub Pages | [ujkz-medecine-listes](https://github.com/Bodanban/ujkz-medecine-listes) |

---

## Repos GitHub actifs

- [bodanban-brain](https://github.com/Bodanban/bodanban-brain) — ce repo (privé)
- [ujkz-medecine-listes](https://github.com/Bodanban/ujkz-medecine-listes) — public
- [mode-switch](https://github.com/Bodanban/mode-switch) — public
- [life-command-center](https://github.com/Bodanban/life-command-center) — public
- [ne-moublie-pas](https://github.com/Bodanban/ne-moublie-pas) — public
- [cardio-revision](https://github.com/Bodanban/cardio-revision) — public
- [letto-cake-crm](https://github.com/Bodanban/letto-cake-crm) — privé
- [levy-brand-wizard](https://github.com/Bodanban/levy-brand-wizard) — public
- [levychristian-site](https://github.com/Bodanban/levychristian-site) — privé

---

## Config Claude Code

### Comportement
- `defaultMode: bypassPermissions` — auto-accept tout
- Hook auto-accept activé (PowerShell)
- `effortLevel: medium`

### MCPs installés (via marketplace Claude Code)
- **chrome-devtools** — contrôle Chrome, screenshots, navigation
- **github** — GitHub API complète
- **canva** — Canva Apps SDK
- **iconify** — recherche d'icônes

### Pour Mac : réinstaller les MCPs
```bash
# Dans Claude Code, ouvrir le marketplace et installer :
# 1. chrome-devtools (Anthropic)
# 2. github (avec GITHUB_PERSONAL_ACCESS_TOKEN)
# 3. canva
# 4. iconify
```

---

## VS Code settings (à copier sur Mac)

```json
{
  "workbench.colorTheme": "Dark Modern",
  "claudeCode.preferredLocation": "panel",
  "claudeCode.initialPermissionMode": "bypassPermissions",
  "claudeCode.allowDangerouslySkipPermissions": true,
  "chat.tools.global.autoApprove": true,
  "chat.tools.terminal.autoApprove": true,
  "workbench.editor.enablePreview": false,
  "autoAccept.enabled": true
}
```

---

## Notes migration Mac

- **Docker → OrbStack** : Content manager 2026 en refonte pour OrbStack
- **VPS actif** : Scripts WireGuard dans `Vps tool/vpn-wireguard/` — fonctionnent aussi sur Mac
- **Faso Code** : React Native Expo — fonctionne nativement sur Mac sans modification
- **Be simple** : React + Vite — identique sur Mac
- **Node.js, Python, Git** : à réinstaller via Homebrew sur Mac

---

## Extensions VS Code essentielles

- Claude Code (Anthropic)
- Kilo Code
- Live Server
- GitHub Copilot
- Prettier
- ESLint
