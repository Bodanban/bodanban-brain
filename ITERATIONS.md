# ITERATIONS — Historique des tentatives, pivots & leçons

> Ce fichier trace le chemin parcouru. Pas pour ressasser, mais pour ne pas refaire les mêmes erreurs
> et comprendre pourquoi certaines décisions ont été prises.

---

## 2026

### Avril 2026 — Grand triage de THE WAR
- **Contexte** : Préparation migration Windows → Mac, besoin de clarté sur les projets actifs
- **Action** : Suppression de ~35 projets obsolètes de `C:/Users/NITRO/Desktop/THE WAR/`
- **Gardés** : Faso Code, auto pari, Be simple, Brouillon, Content manager, crm 2 test, Levy christian le site 2, No reflection, Tablette android, tools, Vps tool
- **Leçon** : Brand Wizard (Zoliais) perdu — jamais pushé sur GitHub. **Règle désormais : commit immédiat sur GitHub pour tout projet.**
- **Projets supprimés notables** : CursorAi (12k+ fichiers), layerhub-test, Editor Test, editeur perso, YouTubeDownloader (x3 versions)

### Mars 2026 — UJKZ Médecine Listes
- **Problème** : Firebase se re-seedait à chaque reload après suppression manuelle des données
- **Cause** : GitHub Pages cachait l'ancien JS qui contenait la logique de seed
- **Fix** : Suppression du code de seed + attente propagation GitHub Pages (~4 min)
- **Leçon** : GitHub Pages cache agressivement — toujours vider le cache ou attendre après un push critique

### Mars 2026 — X-Twitter-Growth-Bot
- **Problème** : Gemini API 429 (quota dépassé) avec gemini-2.0-flash
- **Fix** : Passage à gemini-1.5-flash (free tier plus généreux)
- **Architecture** : Chrome Extension MV3 + Gemini API — contourne l'API Twitter payante

### Janvier 2026 — Google Forms MCP
- **Tentative** : Connecter Google Forms à Claude via MCP + Service Account
- **Problème** : Les Service Accounts ne peuvent pas créer de Google Forms (limitation API)
- **Pivot** : Abandonné
- **Leçon** : Vérifier les limitations des Service Accounts avant de s'engager

### 2025 — Éditeurs personnalisés (layerhub, Editor Test, editeur perso)
- **Tentative** : Construire un éditeur de design custom (concurrent Canva/Layerhub)
- **Résultat** : Abandonné — trop complexe, pas de marché clair
- **Leçon** : Les éditeurs de design from scratch sont des projets de plusieurs années

### 2025 — YouTube Downloaders (3 versions)
- **Tentative** : YouTubeDownloader, KK Youtube dowloader, kk-downloader
- **Résultat** : Aucun n'a abouti, tous abandonnés
- **Leçon** : Problème légal + technique constant, pas un bon terrain

---

## Projets transformés

| Projet original | Transformé en | Raison |
|----------------|---------------|--------|
| Fasocode | Application de permis | Même projet, nom confus |
| letto-cake-crm | crm 2 test | V2 du même CRM |
| Final be simple theory Post (NMO) | Be simple | Prototype absorbé dans le vrai projet |
| Levy christian le site v1 | Levy christian le site 2 | V2 remplace V1 |
