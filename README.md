# MS-END — Compte à rebours de jours de travail

Webapp Next.js (App Router) affichant en plein écran, sans scroll, le temps de travail
restant (`JJ:HH:MM:SS`), la progression globale et du jour J, un calendrier des jours
sélectionnés, un bloc notes partagé en direct et un pop-up d'information.

- **Site public** : `/` (https://clock.fnacdarty.events)
- **Espace admin** : `/admin` (protégé par mot de passe)

## Fonctionnalités

### Page principale
- **Grand décompte « Temps de travail restants »** en `JJ:HH:MM:SS` en direct (jusqu'à la
  fin du dernier jour de travail sélectionné, heure de sortie configurable), en haut à
  gauche sur 2 colonnes, dans une carte agrandie.
- **Grande carte « Avancement global »** (2 colonnes, sous le décompte) : pourcentage en
  `XX.XXXX%` affiché en très gros, barre de progression, ligne `X/Y jours effectués`,
  plus les tuiles **Total / Passés / Restants**.
- **Horloge temps réel + date du jour**, affichée sous la carte Avancement global.
- **Barre « Progression du jour J »** en haut à droite (1 colonne) : heure courante dans
  la fenêtre de travail.

  Les deux pourcentages sont affichés en `XX.XXXX%` (4 décimales) et évoluent en temps
  réel, sans recharger la page.
- **Calendrier mensuel navigable** : les jours sélectionnés sont colorés selon leur position
  relative au jour J (aujourd'hui) :
  - **Bleu clair** pour les jours de travail **passés** (avant le jour J).
  - **Bleu foncé** pour les jours de travail **à venir** (après le jour J).
  - **Jaune** pour le **jour J** (aujourd'hui).
- **Bloc notes collaboratif** : synchronisé en direct (sauvegarde auto-débouncée +
  rafraîchissement ~3 s), indicateur d'enregistrement au lieu de l'édition.
- **Pop-up** ("Flash info") : message affiché sur le site quand il est activé depuis l'admin.
- Page 100 % plein écran (`100dvh`), non scrollable, tout est visible à l'arrivée, sans
  en-tête de marque.

### Espace admin (`/admin`)
- Connexion par mot de passe (`ADMIN_PASSWORD`).
- **Calendrier cliquable** : sélection jour par jour (pas de plages), cliquez pour
  ajouter/retirer un jour.
- Bouton **"Tout effacer"** (avec confirmation).
- Activation + contenu du message pop-up (toggle + textarea, enregistrable à tout moment).

## Stack

- Next.js 16 (App Router, Route Handlers, Turbopack)
- React 19, TypeScript, Tailwind CSS v4
- MySQL (driver `mysql2`), pool connecté aux tables auto-créées au premier appel

## Configuration

Copier `.env.example` vers `.env` et renseigner :

```
DB_HOST=51.83.49.97
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=s111_MS-END

ADMIN_PASSWORD=poipoipoi
SESSION_COOKIE_SECURE=false   # "true" si le site est servi en HTTPS

WORK_DAY_START=8              # début de la journée de travail (heure)
WORK_DAY_END=18               # fin de la journée de travail (heure)
```

> Le flag `Secure` du cookie de session est forcé en production par défaut. S'il est servi
> **en HTTP uniquement**, mettre `SESSION_COOKIE_SECURE=false`.
>
> ⚠️ Tout changement dépendant d'une variable d'environnement dans `src/lib/auth.ts` exige un
> `npm run build` (`process.env.NODE_ENV === "production"` est inliné au build).

Les tables `working_days`, `app_settings` et `app_note` sont créées automatiquement lors de
la première requête API (initialisation paresseuse dans `src/lib/db.ts`). Aucune migration
manuelle nécessaire.

## Développement

```bash
npm install
npm run dev      # http://localhost:3000
```

Production :

```bash
npm run build
npm start        # http://localhost:3000
```

Vérifications :

```bash
npm run lint
npm run build
```

## Architecture

```
src/
  app/
    page.tsx                     → page publique
    admin/page.tsx               → espace admin
    api/
      state/route.ts             → GET  état complet (workingDays, note, settings, workHours)
      note/route.ts              → GET/PUT  bloc notes
      auth/login, logout, session→ POST/GET  authentification admin (cookie HttpOnly)
      admin/working-days/        → GET / POST (toggle jour) / DELETE (tout effacer)
      admin/settings/            → GET / PUT  (pop-up)
  components/
    CalendarGrid.tsx             → calendrier partagé (lecture + sélection)
    home/  HomeClient, Clock, ProgressBar, NotePanel, PopupBanner
    admin/ AdminApp
  lib/
    dates.ts                     → helpers date (fuseau local), calendrier mensuel
    db.ts                        → pool MySQL + schéma auto-créé
    store.ts                     → accès données (jours, note, réglages)
    auth.ts                      → session signée (HMAC) + cookie
    http.ts                      → helpers réponse JSON / parsing
    types.ts                     → types partagés
```

## Authentification admin

- Mot de passe stocké en `ADMIN_PASSWORD` (comparaison à temps constant).
- Session : cookie `admin_session` HttpOnly, HMAC-SHA256 du mot de passe, 7 jours.
- Toutes les routes admin (`/api/admin/*`) refusent les accès non authentifiés (401).

## API

| Méthode | Route                      | Auth | Rôle                                        |
|---------|----------------------------|:----:|---------------------------------------------|
| GET     | `/api/state`                |  –   | État public complet (pollué ~3 s)           |
| GET/PUT | `/api/note`                 |  –   | Lecture / écriture du bloc notes            |
| POST    | `/api/auth/login`           |  –   | Connexion admin (set cookie de session)     |
| POST    | `/api/auth/logout`          |  –   | Déconnexion                                 |
| GET     | `/api/auth/session`         |  –   | État de la session (`authenticated`)        |
| GET     | `/api/admin/working-days`   |  ✅   | Liste des jours sélectionnés                |
| POST    | `/api/admin/working-days`   |  ✅   | Toggle d'un jour (`{ date: "YYYY-MM-DD" }`) |
| DELETE  | `/api/admin/working-days`   |  ✅   | « Tout effacer »                            |
| GET/PUT | `/api/admin/settings`       |  ✅   | Lecture / écriture du pop-up                |

## Déploiement

1. Pousser le dépôt sur le serveur, `npm ci && npm run build`.
2. `npm start` (prévoir PM2/systemd pour la persistance).
3. Reverse proxy vers le port du process pour servir `https://clock.fnacdarty.events`.

## Schema MySQL

```sql
working_days(work_date DATE PK, created_at TIMESTAMP)
app_settings(id = 1, popup_enabled BOOLEAN, popup_message VARCHAR(1000), updated_at)
app_note(id = 1, content TEXT, updated_at)
```