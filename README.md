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
- Active le produit **Vercel Blob** et génère un `BLOB_READ_WRITE_TOKEN` avec accès en lecture/écriture.
- Ajoute ce token dans les variables d'environnement du projet Vercel (onglet *Settings → Environment Variables*).

### Déploiement

1. Pousse la branche sur GitHub puis lance un déploiement Vercel ou utilise `vercel --prod`.
2. L'API serverless persiste désormais les contributions dans un blob `contributions.json`, partagé par tous les visiteurs.

## Fonctionnalités clés

- Mise en page animée et messages personnalisés pour Eva et Noah.
- Section spéciale dédiée au crew "Oups la boulette" et à leurs missions secrètes.
- Mur des souvenirs collaboratif (messages, photos, vidéos, liens YouTube) partagé entre tous les amis.
- Stockage persistant des contributions côté serveur : fichier JSON en local, blob Vercel partagé en production.

## Structure du projet

- `JNFGKML/` : ressources front-end (HTML, CSS, JavaScript).
- `server.js` : serveur Express servant le site et l'API REST pour le développement local.
- `api/contributions.js` : fonction serverless compatible Vercel pour le mur des souvenirs.
- `data/contributions.json` : stockage JSON local des souvenirs partagés.
- `vercel.json` : configuration de déploiement (static front + API).

N'hésite pas à adapter le contenu pour continuer à surprendre Eva !
