# Psst ! 🎁

Application web de listes de cadeaux à partager en famille ou entre amis.
Chacun note ses envies (nom, prix, photo, lien d'achat), les autres consultent
et **réservent en secret** : la réservation est visible par tout le monde…
sauf par la personne concernée. Fini les doublons, et la surprise est préservée.

## Fonctionnalités

- **Groupes** : crée un groupe (« Famille », « Anniversaire Antoine »…) et
  invite tes proches avec un **code à 6 caractères** ou un **lien d'invitation**.
- **Sans compte** : un simple prénom suffit, stocké sur l'appareil.
- **Idées de cadeaux** : nom, prix approximatif, lien d'achat, petite note et
  photo (compressée automatiquement côté navigateur).
- **Réservation secrète** : « Je l'offre 🎁 » marque le cadeau comme pris pour
  tous les membres, mais le propriétaire de la liste ne voit jamais rien.
- **Temps réel** : tout se synchronise instantanément via Firestore.

## Stack

- React 18 + Vite
- Firebase Firestore (base de données temps réel, plan gratuit Spark suffisant)
- Aucun backend à maintenir

## Installation

### 1. Créer le projet Firebase (5 minutes)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et crée un projet (ex. `psst-cadeaux`). Google Analytics inutile.
2. Dans **Build > Firestore Database**, clique **Créer une base de données**, choisis l'emplacement `europe-west` et démarre en **mode production**.
3. Dans l'onglet **Règles** de Firestore, colle le contenu du fichier [`firestore.rules`](./firestore.rules) et publie.
4. Dans **Paramètres du projet ⚙️ > Tes applications**, ajoute une **application Web** (`</>`), donne-lui un nom, et copie l'objet `firebaseConfig` affiché.

### 2. Configurer et lancer en local

```bash
cp .env.example .env
# Remplis .env avec les valeurs de firebaseConfig
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173`.

### 3. Déployer

Le build est 100 % statique, donc n'importe quel hébergeur convient.

**Vercel (recommandé, gratuit)**

1. Pousse le projet sur GitHub.
2. Sur [vercel.com](https://vercel.com), importe le repo (framework détecté : Vite).
3. Ajoute les 6 variables `VITE_FIREBASE_*` dans **Settings > Environment Variables**.
4. Pour que les liens d'invitation `/rejoindre/CODE` fonctionnent, ajoute un fichier `vercel.json` (déjà inclus dans ce projet) qui redirige toutes les routes vers `index.html`.

**Netlify** : même principe, le fichier `public/_redirects` (inclus) gère le routing.

## Modèle de données

```
groups/{groupId}
  name, code, createdBy, createdAt
  members/{userId}
    pseudo, joinedAt
  items/{itemId}
    ownerId, ownerPseudo, name, price, url, photo (base64), note,
    reservedBy, reservedByPseudo, createdAt
```

Les photos sont compressées côté client (JPEG, ~720 px max) et stockées en
base64 directement dans le document Firestore, ce qui évite d'activer Firebase
Storage (payant pour les nouveaux projets).

## À savoir (limites du « sans compte »)

- L'identité repose sur le navigateur (localStorage). Si on vide les données du
  navigateur ou qu'on change d'appareil, on repart avec une nouvelle identité —
  les listes restent dans le groupe, mais on ne peut plus modifier ses anciens
  articles. Pour un usage famille, c'est généralement un compromis acceptable.
- La confidentialité d'un groupe repose sur le secret de son code. Ne partage
  le code qu'avec les personnes concernées.
- Si tu veux plus tard une vraie sécurité (modification réservée au
  propriétaire vérifié, multi-appareils), la piste naturelle est **Firebase
  Anonymous Auth** + règles Firestore basées sur `request.auth.uid` — la
  structure du code est déjà prête pour ça (`profile.id` deviendrait l'uid).

## Scripts

| Commande          | Action                          |
| ----------------- | ------------------------------- |
| `npm run dev`     | Serveur de développement        |
| `npm run build`   | Build de production (`dist/`)   |
| `npm run preview` | Prévisualisation du build       |
