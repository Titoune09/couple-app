# Eva Birthday Celebration

Un site festif créé pour les 16 ans d'Eva avec la complicité de la team **Oups la boulette**.

## Démarrage en local

1. Installe les dépendances :
   ```bash
   npm install
   ```
2. Lance le serveur Express qui sert le site et l'API du mur des souvenirs :
   ```bash
   npm start
   ```
3. Ouvre ton navigateur sur [http://localhost:3000](http://localhost:3000).

L'API locale écrit les souvenirs dans `data/contributions.json`. Supprime simplement ce fichier si tu veux repartir de zéro.

## Déploiement sur Vercel

Le dépôt contient la configuration nécessaire (`vercel.json`) pour servir le front depuis `JNFGKML/` et exposer l'API `/api/contributions` en fonction serverless.

### Pré-requis

- Crée un projet Vercel et relie-le à ce dépôt.
- Ouvre [https://jsonstorage.net/](https://jsonstorage.net/) (l'interface fonctionne très bien sur iPad).
  1. Clique sur **Create JSON storage**.
  2. Colle `[]` comme contenu initial puis valide.
  3. Copie l'URL fournie (elle ressemble à `https://jsonstorage.net/api/items/<id>`).
  4. Copie aussi la valeur **Secret Key** affichée juste en dessous.
- Ajoute deux variables d'environnement dans Vercel :
  - `JSON_STORAGE_URL` : l'URL récupérée à l'étape 3.
  - `JSON_STORAGE_SECRET` : la secret key de l'étape 4 (obligatoire pour autoriser les mises à jour).

### Déploiement

1. Pousse la branche sur GitHub puis lance un déploiement Vercel ou utilise `vercel --prod`.
2. L'API serverless persiste désormais les contributions dans ton espace JSONStorage. Pas besoin de ligne de commande : tout se fait depuis le navigateur.

## Fonctionnalités clés

- Mise en page animée et messages personnalisés pour Eva et Noah.
- Section spéciale dédiée au crew "Oups la boulette" et à leurs missions secrètes.
- Mur des souvenirs collaboratif (messages, photos, vidéos, liens YouTube) partagé entre tous les amis.
- Stockage persistant des contributions côté serveur : fichier JSON en local, instance JSONStorage partagée en production.

## Structure du projet

- `JNFGKML/` : ressources front-end (HTML, CSS, JavaScript).
- `server.js` : serveur Express servant le site et l'API REST pour le développement local.
- `api/contributions.js` : fonction serverless compatible Vercel pour le mur des souvenirs.
- `data/contributions.json` : stockage JSON local des souvenirs partagés.
- `vercel.json` : configuration de déploiement (static front + API).

N'hésite pas à adapter le contenu pour continuer à surprendre Eva !
