# Cypher

A context layer for hip-hop listeners. Cypher explains the cultural context in hip-hop tracks (people, places, events, brands, religious references, slang) for listeners who did not grow up inside that culture.

Every explanation is anchored to a **track and a timestamp**, not to a lyric line. Cypher stores no lyrics: only track titles, timestamps and its own explanations.

Backend and REST API only (Django + Django REST Framework + PostgreSQL), fully containerized with Docker Compose. Everything is demonstrated through Postman and Swagger UI.

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
- **cypher-net**: a user-defined bridge network that both services join. The backend reaches the database at host `db` (the service name), never `localhost`.
- **pgdata**: a named volume, so database files survive `docker compose down`. Only `docker compose down -v` deletes them.
- The database port is **not** published to the host. Only the backend needs it, and the backend reaches it over the private network.

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
| http://localhost:8000/api/ | API root (links to all 5 resources) |
| http://localhost:8000/api/docs/ | Swagger UI |
| http://localhost:8000/api/schema/ | OpenAPI 3 schema (YAML) |
| http://localhost:8000/admin/ | Django admin |

Useful commands:

```bash
docker compose ps                                            # status + health of both services
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

## Repository layout

```
cypher/
├── docker-compose.yml        services, network, volume
├── .env.example              configuration template (copy to .env)
├── README.md
├── docs/API.md               endpoint reference
├── postman/                  collection + environment
└── backend/
    ├── Dockerfile
    ├── entrypoint.sh         migrate -> seed if empty -> runserver
    ├── requirements.txt
    ├── manage.py
    ├── config/               settings, root URLs, WSGI
    └── catalog/              models, serializers, views, urls, admin,
                              tests, seed command, seed_data/
```
