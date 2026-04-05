# Brain Sync — Extension VS Code

Sauvegarde le contexte et l'historique de tes projets dans `bodanban-brain`.

## Installation

1. Copie ce dossier `vscode-extension/` sur ta machine
2. Ouvre VS Code → Extensions → `...` → **Install from VSIX** OU
3. Lance en mode dev : ouvre le dossier dans VS Code → `F5`

## Utilisation

### Configurer le token GitHub
1. Ouvre la sidebar Brain Sync (icône hexagone dans l'activity bar)
2. Colle ton GitHub Personal Access Token (scope: `repo`)
3. Clique OK — le token est stocké dans le keystore VS Code

### Sauvegarder une session
- Raccourci : `Cmd+Shift+B` (Mac) / `Ctrl+Shift+B` (Windows)
- Ou : sidebar → bouton **+ Save Project & History**

### Formulaire de sauvegarde
- **Nom du projet** : nom exact (ex: Faso Code)
- **Ce qu'on a accompli** : notes de la session
- **État actuel** : où en est le projet
- **Prompt de reprise** : le contexte complet pour reprendre — sera chiffré AES-256

## Sécurité
- Le prompt de reprise est chiffré avec la même clé que le Decoder Chrome
- Le token GitHub est stocké dans `vscode.globalState` (jamais en clair sur disque)
- Aucune donnée ne transite par un serveur tiers
