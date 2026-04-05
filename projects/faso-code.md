# Faso Code — App permis de conduire BF

**Statut** : En build · v2.0.0  
**Dernière session** : Avril 2026  
**Dossier local** : `THE WAR/Application de permis`

---

## Vision finale
Application mobile freemium pour préparer le permis de conduire au Burkina Faso.
Cible : candidats à Ouaga, Bobo, villes secondaires BF.
Modèle : gratuit limité → achat premium (contenu complet + examen blanc illimité).

---

## Décisions prises

- **React Native Expo** et pas Flutter → maîtrise du stack React déjà en place
- **Zustand** et pas Redux → moins de boilerplate, suffisant pour cette app
- **AsyncStorage** pour la persistance locale → offline-first, pas besoin de serveur pour la progression
- **Freemium** et pas payant direct → adoption plus rapide, marché BF sensible au prix
- **Français uniquement** → contenu spécifique BF, pas de ROI à internationaliser
- Les diapositives officielles (PDF) ont été intégrées comme ressource dans `Ressources Permis/diapos_officielles/`

---

## Chemins abandonnés

- **Fasocode** était le nom original → renommé "Application de permis" dans le dossier local, confusion résolue
- Envisagé d'utiliser une API externe pour les questions → abandonné, contenu local plus fiable et offline

---

## État actuel (Avril 2026)
- Stack configuré : Expo SDK 54, RN 0.81.5, TypeScript, React 19
- Navigation : React Navigation v7 (Bottom Tabs + Native Stack)
- Assets branding dans `assets/branding/` (logo, mascotte, icônes)
- PDF diapos officielles intégrés
- Fonctionnalités à compléter : écrans quiz, système XP/badges, mode examen blanc, paywall

---

## Prompt de reprise
<!-- CHIFFRÉ PAR BRAIN DECODER v3 — utilise encode-tool.html pour régénérer -->
Tu es Claude, mon assistant dev. Je reprends Faso Code, mon app mobile React Native Expo pour le permis de conduire au Burkina Faso. Stack : Expo SDK 54, TypeScript, Zustand, AsyncStorage. Le projet est dans THE WAR/Application de permis. Le CLAUDE.md du projet contient tout le détail technique. On en est à v2.0.0. Lis le CLAUDE.md et dis-moi où on en est exactement, puis propose les prochaines étapes pour avancer vers la publication Play Store.
