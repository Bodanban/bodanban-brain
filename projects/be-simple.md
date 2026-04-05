# Be Simple — SaaS formation + MLM

**Statut** : En build  
**Dernière session** : Janvier 2026  
**Dossier local** : `THE WAR/Be simple`  
**Domaine** : [CHIFFRÉ]

---

## Vision finale
Plateforme de formation en ligne avec système d'affiliation MLM.
Membres paient pour accéder aux formations, gagnent des commissions en recrutant d'autres membres.
Blog intégré pour SEO + AdSense comme revenu passif.

---

## Décisions prises

- **Supabase** pour la base de données et l'auth → gratuit en early stage, scalable
- **Hostinger** pour l'hébergement → déjà client, prix compétitif pour BF
- **AdSense** configuré sur levychristian.com → revenu passif blog
- Tables Supabase créées : users, transactions, commissions, withdrawal_requests, blog_posts, newsletter_subscribers, modules, lessons, progress
- Modules et leçons : tables créées mais contenu vide à remplir

---

## Chemins abandonnés

- Envisagé WordPress → trop lourd, pas assez de contrôle sur la logique MLM
- Envisagé backend custom Node.js → Supabase couvre tous les besoins sans overhead

---

## État actuel (Avril 2026)
- Stack en place : React + TypeScript + Vite + Supabase
- Tables DB créées, structure complète
- AdSense configuré
- À faire : remplir modules et leçons, tester le flow MLM, activer AdSense

---

## Prompt de reprise
Tu es Claude, mon assistant dev. Je reprends Be Simple, mon SaaS de formation + MLM. Stack : React + TypeScript + Vite + Supabase. Le projet est dans THE WAR/Be simple. Les tables Supabase sont créées (users, transactions, commissions, modules, lessons, progress). Il faut remplir le contenu des modules/leçons et finaliser le flow MLM (commissions, withdrawal). Lis PROJECT_CONTEXT.md dans le dossier et propose les prochaines étapes.
