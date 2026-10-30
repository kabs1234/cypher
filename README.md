# Cypher

A context layer for hip-hop listeners. Cypher explains the cultural context in hip-hop tracks (people, places, events, brands, religious references, slang) for listeners who did not grow up inside that culture.

Every explanation is anchored to a track and a timestamp, not to a lyric line. Cypher stores no lyrics: only track titles, timestamps and its own explanations.

Backend and REST API (Django + Django REST Framework + PostgreSQL), fully containerized with Docker Compose and demonstrated through Postman and Swagger UI. An optional reading frontend (Vue 3 + TypeScript, served by nginx) runs next to it; see [Frontend](#frontend).

## Data model

| Model | Main fields | Notes |
|---|---|---|
| `Artist` | name, city_region, active_since, bio | |
| `Album` | title, release_year, artist → Artist, overview, overview_status | `overview` is a short briefing a non-native listener reads before listening |
| `Track` | title, album → Album, track_number, duration_seconds | |
| `Term` | name, type, explanation, explanation_ru, sources, status, notes | type: slang / person / place / event / brand / religion / other |
| `TrackReference` | track → Track, term → Term, timestamp_seconds, context_note | links a term to a moment in a track |

Every model has `created_at` / `updated_at`. `status` and `overview_status` are `draft` or `verified` and default to `draft`. A `TrackReference` timestamp must be between 0 and the track's duration, and `(track, term, timestamp_seconds)` is unique.

## Architecture

```
  Host machine (your laptop)
 +---------------------------------------------------------------------------+
 |                                                                           |
 |   Postman / browser                                                       |
 |          |                                                                |
 |          |  http://localhost:8000                                         |
 |          v                                                                |
 |   published port  8000 (host) --> 8000 (container)                        |
 |          |                                                                |
 |  +-------|------------- network: cypher-net (bridge) -------------------+ |
 |  |       v                                                              | |
 |  |  +-------------------------+   host "db", port 5432   +-----------+  | |
 |  |  | backend                 | -----------------------> | db        |  | |
 |  |  | image built from        |    resolved by Docker    | postgres  |  | |
 |  |  | backend/Dockerfile      |    DNS (service name)    | :16       |  | |
 |  |  | Django + DRF on :8000   |                          | port 5432 |  | |
 |  |  | runs entrypoint.sh      |                          | NOT       |  | |
 |  |  +-------------------------+                          | published |  | |
 |  |                                                       +-----+-----+  | |
 |  +-------------------------------------------------------------|--------+ |
 |                                                                |          |
 |                         named volume: pgdata  <----------------+          |
 |                         mounted at /var/lib/postgresql/data               |
 +---------------------------------------------------------------------------+
```

- **backend**: custom image (`backend/Dockerfile`, `python:3.12-slim`, non-root user). On start, `entrypoint.sh` applies migrations, loads seed data if the database is empty, then starts Django on `0.0.0.0:8000`.
- **db**: official `postgres:16` image. It has a `pg_isready` healthcheck, and the backend waits for it with `depends_on: condition: service_healthy`.
- **frontend**: nginx serving the built Vue app on port 8080 and proxying `/api/` to the backend. Optional; see [Frontend](#frontend).
- **cypher-net**: a user-defined bridge network that all three services join. The backend reaches the database at host `db` (the service name), never `localhost`.
- **pgdata**: a named volume, so database files survive `docker compose down`. Only `docker compose down -v` deletes them.
- The database port is not published to the host. Only the backend needs it, and the backend reaches it over the private network.

## Run it

Requirements: Docker Desktop (or Docker Engine) with Compose v2.

```bash
git clone <repo-url> cypher
cd cypher
cp .env.example .env        # then set real values (see table below)
docker compose up --build
```

On the first start the backend applies migrations and seeds Kendrick Lamar's *DAMN.* (14 tracks, 22 terms, 28 references). Wait for `Starting development server at http://0.0.0.0:8000/` in the logs.

| URL | What |
|---|---|
| http://localhost:8080/ | Frontend |
| http://localhost:8000/api/ | API root (links to all 5 resources) |
| http://localhost:8000/api/docs/ | Swagger UI |
| http://localhost:8000/api/schema/ | OpenAPI 3 schema (YAML) |
| http://localhost:8000/admin/ | Django admin |

Useful commands:

```bash
docker compose ps                                            # status + health of every service
docker compose logs -f backend                               # follow backend logs
docker compose exec backend python manage.py createsuperuser # login for /admin/
docker compose exec backend python manage.py test catalog    # run the test suite
docker compose down                                          # stop, keep data
docker compose down -v                                       # stop and delete the database volume
```

## Environment variables

All configuration comes from `.env` in the project root. Compose reads it automatically and passes each value into the containers listed under `environment:` in `docker-compose.yml`. `.env` is not committed; `.env.example` is the template.

| Variable | Used by | Example | Purpose |
|---|---|---|---|
| `POSTGRES_DB` | db, backend | `cypher` | Database name. The postgres image creates it on first start; Django connects to it |
| `POSTGRES_USER` | db, backend | `cypher` | Database user created by the postgres image and used by Django |
| `POSTGRES_PASSWORD` | db, backend | `change-me` | Password for that user |
| `DB_HOST` | backend | `db` | Where Django finds PostgreSQL: the Compose service name, resolved by Docker DNS |
| `DB_PORT` | backend | `5432` | PostgreSQL port inside the network |
| `DJANGO_SECRET_KEY` | backend | long random string | Django's signing key. Required; the API answers 500 if it is empty |
| `DJANGO_DEBUG` | backend | `1` | `1`/`true` turns debug mode on, anything else turns it off |
| `DJANGO_ALLOWED_HOSTS` | backend | `localhost,127.0.0.1` | Comma-separated host names Django will serve |

## Postman

The collection lives in `postman/`:

- `cypher.postman_collection.json`: 42 requests in 7 folders: list / get / create / PUT / PATCH for every resource, filter examples, validation errors (400/404), and a Cleanup folder with every DELETE.
- `cypher.postman_environment.json`: the **Cypher Local** environment with `base_url = http://localhost:8000`.

To import: Postman → **Import** → select both files → choose the **Cypher Local** environment (top right).

Each *Create* request saves the new id to a collection variable (`artist_id`, `album_id`, `track_id`, `term_id`, `reference_id`) and later requests use it. Run the folders top to bottom, or right-click the collection → **Run collection** to run everything in order. The run creates its own records and deletes them at the end, so the seeded data is left untouched and the run can be repeated.

From the command line:

```bash
npx newman run postman/cypher.postman_collection.json -e postman/cypher.postman_environment.json
```

Full endpoint reference: [docs/API.md](docs/API.md).

## Seed data and adding albums

Seed files live in `backend/catalog/seed_data/`, one JSON file per album. Tracks are referenced by `track_number` and terms by `name`, so a file contains no database ids. The `seed` command (`python manage.py seed`) loads every file in that folder, but only when the database is empty. Artists and terms that already exist are reused.

To add *good kid, m.A.A.d city* or *To Pimp a Butterfly*, add a new JSON file with the same shape. No code changes are needed. Run `docker compose down -v && docker compose up --build` to reseed from scratch.

All seeded terms and the album overview have status `draft`, with Wikipedia sources. **Timestamps are approximate** and need to be checked against the audio before anything is marked `verified`.

## Frontend

A reading app for listeners, in `frontend/`. It is optional: the API works the same with or without it.

| URL | What |
|---|---|
| `/` | Albums |
| `/albums/:id` | Album briefing (`overview`) and track list with reference counts |
| `/tracks/:id` | Track timeline: references grouped by timestamp along the track's duration. Selecting a marker or a row shows the term's explanation, sources, notes and every other track it comes up on. Add or delete references here |
| `/terms` | All terms, filtered by type and status (filters are kept in the URL, e.g. `/terms?type=religion&status=draft`) |
| `/terms/:id`, `/terms/new`, `/terms/:id/edit` | Term detail, create and edit |

Forms don't validate in the browser. They show the API's `400` messages under the matching field (`non_field_errors` above the form). Draft content carries a hatched yellow "Unverified draft" badge, verified content a solid one, and every track page says that timestamps are approximate.

Built with Vue 3 (Composition API, `<script setup lang="ts">`), TypeScript, Vite and Vue Router. There is no state library: each screen loads its own data through the `useAsync` composable. Fonts (Archivo, Source Serif 4) are bundled from `@fontsource`, so the page makes no third-party requests.

In Docker, the `frontend` service (`frontend/Dockerfile`: Node builds the app, then `nginx:1.27-alpine` serves `dist/`) proxies `/api/` to `backend:8000` over `cypher-net` and falls back to `index.html` for client-side routes. In development, Vite's dev server proxies `/api` to `localhost:8000`. Either way the browser sees one origin, so Django needs no CORS settings.

```
browser --> :8080 frontend (nginx) --/api/--> backend:8000 --> db:5432
                 \-- everything else: static files from dist/
```

To work on it locally, with the backend running in Docker:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check with vue-tsc, then build to dist/
```

| Path | Role |
|---|---|
| `src/api/` | `types.ts` (API shapes), `client.ts` (fetch wrapper, `ApiError`, field errors), `resources.ts` (list/get/create/update/remove per endpoint) |
| `src/composables/` | `useAsync` (load data with loading/error state), `useElementWidth` (timeline layout) |
| `src/components/` | `TrackTimeline`, `TermDetail`, `ReferenceForm`, `FormField`, `StatusBadge`, `TypeTag`, `LoadState` |
| `src/views/` | one component per route |

## Spotify extension (Spicetify)

`spicetify/` holds an extension for the Spotify desktop app, installed through [Spicetify](https://spicetify.app). While a track plays, it shows Cypher's explanations inside Spotify at the moment they come up, so a listener doesn't need to open the website.

- A Cypher button in the playbar is active when the current track has references. Its tooltip shows how many.
- When playback reaches a reference's timestamp, a card appears at the bottom right with the terms and the context note. It shows from 2 seconds before the timestamp to 12 seconds after, because timestamps are approximate. The × hides it for that moment.
- The button, or "Read the explanation" on the card, opens a panel with every reference on the track: explanation, sources, editor's notes and draft status. Selecting a time plays the track from there.

A Spotify track is matched to a Cypher track by artist name, album title and track number, so the API needs no Spotify ids. The reversed *DAMN.* Collector's Edition has a different album title and does not match.

The extension reads the API through the `frontend` nginx service at `http://localhost:8080/api/`, so the Docker stack has to be running. Spotify loads extensions from `https://xpui.app.spotify.com`, and nginx answers `/api/` with `Access-Control-Allow-Origin` for that origin only. Django is not involved.

Install (needs the Spotify desktop app with Spicetify applied):

```bash
cd spicetify
npm install        # also downloads the Spicetify type definitions into src/types/
npm run deploy     # type-check, build dist/cypher.js, copy it into Spicetify, spicetify apply
```

To remove it: `spicetify config extensions cypher.js-` and then `spicetify apply`.

The extension reuses the API types from `frontend/src/api/types.ts`.

| Path | Role |
|---|---|
| `src/main.ts` | waits for Spicetify, then starts the session |
| `src/session.ts` | loads the matching Cypher track on every song change and shows or hides the card on playback progress |
| `src/matching.ts`, `src/moments.ts` | track matching; grouping references by timestamp and finding the current one |
| `src/ui/` | the card, the panel and their styles, built with DOM APIs and Spotify's theme variables |

Spicetify modifies the Spotify client, which Spotify's terms of use do not allow, so this is for personal use and demos.

## Repository layout

```
cypher/
├── docker-compose.yml        services, network, volume
├── .env.example              configuration template (copy to .env)
├── README.md
├── docs/API.md               endpoint reference
├── postman/                  collection + environment
├── frontend/                 Vue app, Dockerfile, nginx.conf
├── spicetify/                Spotify extension
└── backend/
    ├── Dockerfile
    ├── entrypoint.sh         migrate -> seed if empty -> runserver
    ├── requirements.txt
    ├── manage.py
    ├── config/               settings, root URLs, WSGI
    └── catalog/              models, serializers, views, urls, admin,
                              tests, seed command, seed_data/
```
