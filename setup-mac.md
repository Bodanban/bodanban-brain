# Setup Mac — Checklist

## 1. Homebrew + outils de base
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git node python3 pnpm
```

## 2. OrbStack (remplace Docker)
```bash
brew install --cask orbstack
```

## 3. VS Code
```bash
brew install --cask visual-studio-code
```
Puis copier les settings depuis `vscode-settings.json` dans ce repo.

## 4. Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```
Puis dans VS Code : installer l'extension Claude Code (Anthropic).

## 5. MCPs à réinstaller
Dans Claude Code → marketplace :
- chrome-devtools
- github (token: voir `.credentials.json` sur ancien PC)
- canva
- iconify

## 6. Cloner les projets actifs
```bash
git clone https://github.com/Bodanban/bodanban-brain ~/projects/bodanban-brain
git clone https://github.com/Bodanban/letto-cake-crm ~/projects/crm
git clone https://github.com/Bodanban/levychristian-site ~/projects/levy-site
git clone https://github.com/Bodanban/mode-switch ~/projects/mode-switch
git clone https://github.com/Bodanban/life-command-center ~/projects/life-command-center
```

## 7. Projets sans repo GitHub (à transférer manuellement)
- `Application de permis` (Faso Code) — React Native Expo
- `auto pari` — copier depuis ancien PC
- `Be simple` — React + Supabase
- `Content manager 2026` — en refonte OrbStack
- `tools` — agrégat Levy Christian
- `Vps tool` — scripts WireGuard

## 8. Config Claude settings
Copier dans `~/.claude/settings.json` :
```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  }
}
```
