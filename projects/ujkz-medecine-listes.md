# UJKZ Médecine Listes — Corrections collaboratives

**Statut** : Actif (Live)
**Dernière session** : Mars-Avril 2026
**Dossier local** : `THE WAR/Brouillon/UJKZ bail`
**Repo GitHub** : Bodanban/ujkz-medecine-listes (public)
**URL** : https://bodanban.github.io/ujkz-medecine-listes/

---

## Vision finale
App web collaborative pour étudiants médecine UJKZ (Burkina Faso).
Corrections des listes officielles L1/L2/L3/L4 en temps réel. Export Word pour les profs.

---

## Décisions prises

- **Firebase Realtime Database** Spark gratuit → temps réel, 100 connexions simultanées
- **GitHub Pages** → hébergement gratuit
- **HTML/JS pur** → léger, accessible mobile
- **INITIAL_DATA vide** `{ l1:[], l2:[], l3:[], l4:[] }` → données uniquement via Firebase

---

## Chemins abandonnés

- **Seed initial hardcodé** → supprimé car boucle infinie (Pages cachait l'ancien JS qui re-seedait après suppression Firebase)

---

## État actuel (Avril 2026)

Live et fonctionnel. Firebase credentials réelles configurées. Export Word opérationnel.
Commit actif : `54d0cf9` — INITIAL_DATA complètement vidé, logique de seed supprimée.

---

## Historique des sessions

### Mars-Avril 2026
- Firebase credentials réelles intégrées
- Bouton Export Word ajouté
- INITIAL_DATA vidé, logique auto-seed supprimée
- Fix boucle re-seed causée par cache GitHub Pages

---

## Prompt de reprise
Tu es Claude, mon assistant dev. Je reprends UJKZ Médecine Listes — app web collaborative Firebase + GitHub Pages pour étudiants médecine UJKZ au Burkina Faso. Repo : Bodanban/ujkz-medecine-listes. Live : https://bodanban.github.io/ujkz-medecine-listes/ Fichier principal : THE WAR/Brouillon/UJKZ bail/listes_medecine_ujkz.html. Stack : Firebase Realtime Database Spark, GitHub Pages, HTML/JS pur. INITIAL_DATA vide, export Word fonctionnel. Lis le fichier HTML et propose les améliorations.
<!-- À CHIFFRER via encode-tool.html -->
