# Cypher API reference

Base URL: `http://localhost:8000/api/`

- Requests and responses are JSON. Send `Content-Type: application/json` with every request that has a body.
- No authentication: the API is open (`AllowAny`).
- Lists are not paginated: a list endpoint returns a plain JSON array.
- Foreign keys are written as ids (`"artist": 1`). Reads return the id plus a readable name next to it (`"artist_name": "Kendrick Lamar"`).
- Every object has read-only `id`, `created_at` and `updated_at`.
- Interactive docs: Swagger UI at `/api/docs/`, OpenAPI 3 schema at `/api/schema/`.

Examples below are real responses from a freshly seeded database (`docker compose down -v && docker compose up --build`). Timestamps are shortened.

## Status codes

| Code | When |
|---|---|
| `200 OK` | Successful GET, PUT or PATCH |
| `201 Created` | Successful POST. The body is the created object |
| `204 No Content` | Successful DELETE. Empty body |
| `400 Bad Request` | Validation failed: missing or invalid field, timestamp out of range, duplicate, unknown foreign-key id, or invalid filter value. The body maps each field to its error messages |
| `404 Not Found` | No object with that id |

## Endpoints at a glance

Every resource has the same six operations.

| Method | URL | Action | Success | Errors |
|---|---|---|---|---|
| GET | `/api/{resource}/` | List all (supports filters) | 200 | 400 (bad filter value) |
| POST | `/api/{resource}/` | Create | 201 | 400 |
| GET | `/api/{resource}/{id}/` | Retrieve one | 200 | 404 |
| PUT | `/api/{resource}/{id}/` | Replace (send all required fields) | 200 | 400, 404 |
| PATCH | `/api/{resource}/{id}/` | Partial update (send only changed fields) | 200 | 400, 404 |
| DELETE | `/api/{resource}/{id}/` | Delete | 204 | 404 |

`{resource}` is one of `artists`, `albums`, `tracks`, `terms` or `references`.

| Resource | Query params on the list endpoint |
|---|---|
| `/api/artists/` | none |
| `/api/albums/` | `artist` (artist id) |
| `/api/tracks/` | `album` (album id) |
| `/api/terms/` | `type`, `status` (can be combined) |
| `/api/references/` | `track` (track id), `term` (term id) |

Deleting cascades: deleting an artist deletes its albums, deleting an album deletes its tracks, and deleting a track or a term deletes its references.

---

## Artists: `/api/artists/`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string (max 200) | yes | unique |
| `city_region` | string (max 200) | no | |
| `active_since` | integer (year) | yes | |
| `bio` | string | no | |

**GET `/api/artists/1/`** → `200`

```json
{
  "id": 1,
  "name": "Kendrick Lamar",
  "city_region": "Compton, California",
  "active_since": 2003,
  "bio": "Rapper from Compton, California, signed to Top Dawg Entertainment. Studio albums include Section.80 (2011), good kid, m.A.A.d city (2012), To Pimp a Butterfly (2015) and DAMN. (2017).",
  "created_at": "2026-10-30T15:30:18Z",
  "updated_at": "2026-10-30T15:30:18Z"
}
```

**POST `/api/artists/`** → `201` (response is the created object, same shape as above)

```json
{
  "name": "SZA",
  "city_region": "St. Louis, Missouri",
  "active_since": 2012,
  "bio": "Singer signed to Top Dawg Entertainment."
}
```

**PUT `/api/artists/1/`** → `200`. Send every required field (`name`, `active_since`). Optional fields you leave out keep their stored value.

```json
{ "name": "Kendrick Lamar", "city_region": "Compton, CA", "active_since": 2003, "bio": "Updated bio." }
```

**PATCH `/api/artists/1/`** → `200`

```json
{ "bio": "Only this field changes." }
```

**DELETE `/api/artists/1/`** → `204`, empty body.

---

## Albums: `/api/albums/`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string (max 200) | yes | unique per artist |
| `release_year` | integer | yes | |
| `artist` | integer (artist id) | yes | |
| `artist_name` | string | read-only | |
| `overview` | string | no | album briefing for non-native listeners |
| `overview_status` | `draft` \| `verified` | no | default `draft` |

Query params: `?artist=<id>`

**GET `/api/albums/?artist=1`** → `200`

```json
[
  {
    "id": 1,
    "title": "DAMN.",
    "release_year": 2017,
    "artist": 1,
    "artist_name": "Kendrick Lamar",
    "overview": "DAMN. is Kendrick Lamar's fourth studio album, released on April 14, 2017 by Top...",
    "overview_status": "draft",
    "created_at": "2026-10-30T15:30:18Z",
    "updated_at": "2026-10-30T15:30:18Z"
  }
]
```

**POST `/api/albums/`** → `201`

```json
{ "title": "To Pimp a Butterfly", "release_year": 2015, "artist": 1, "overview": "", "overview_status": "draft" }
```

**PUT `/api/albums/1/`** → `200`

```json
{ "title": "DAMN.", "release_year": 2017, "artist": 1, "overview": "Rewritten briefing.", "overview_status": "draft" }
```

**PATCH `/api/albums/1/`** → `200`

```json
{ "overview_status": "verified" }
```

**DELETE `/api/albums/1/`** → `204` (also deletes its tracks and their references).

---

## Tracks: `/api/tracks/`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string (max 200) | yes | |
| `album` | integer (album id) | yes | |
| `album_title` | string | read-only | |
| `track_number` | integer ≥ 0 | yes | unique per album |
| `duration_seconds` | integer ≥ 0 | yes | upper limit for reference timestamps |

Query params: `?album=<id>`

**GET `/api/tracks/12/`** → `200`

```json
{
  "id": 12,
  "title": "FEAR.",
  "album": 1,
  "album_title": "DAMN.",
  "track_number": 12,
  "duration_seconds": 460,
  "created_at": "2026-10-30T15:30:18Z",
  "updated_at": "2026-10-30T15:30:18Z"
}
```

**POST `/api/tracks/`** → `201`

```json
{ "title": "Bonus Track", "album": 1, "track_number": 15, "duration_seconds": 200 }
```

**PUT `/api/tracks/12/`** → `200`

```json
{ "title": "FEAR.", "album": 1, "track_number": 12, "duration_seconds": 461 }
```

**PATCH `/api/tracks/12/`** → `200`

```json
{ "duration_seconds": 461 }
```

**DELETE `/api/tracks/12/`** → `204` (also deletes its references).

---

## Terms: `/api/terms/`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string (max 200) | yes | unique |
| `type` | `slang` \| `person` \| `place` \| `event` \| `brand` \| `religion` \| `other` | yes | |
| `explanation` | string | yes | plain English, B2 level |
| `explanation_ru` | string | no | Russian explanation |
| `sources` | string | yes | one or more URLs, one per line |
| `status` | `draft` \| `verified` | no | default `draft` |
| `notes` | string | no | e.g. "regional usage, disputed meaning" |

Query params: `?type=<type>`, `?status=<status>`, or both. An unknown value returns `400`.

**GET `/api/terms/14/`** → `200`

```json
{
  "id": 14,
  "name": "Book of Deuteronomy",
  "type": "religion",
  "explanation": "The fifth book of the Torah and of the Christian Old Testament. Chapter 28 lists blessings for obeying God and curses for disobeying. Carl Duckworth reads from it in his voicemail on FEAR.",
  "explanation_ru": "",
  "sources": "https://en.wikipedia.org/wiki/Book_of_Deuteronomy\nhttps://en.wikipedia.org/wiki/Fear_(Kendrick_Lamar_song)",
  "status": "draft",
  "notes": "Fear article cites Deuteronomy 28:28.",
  "created_at": "2026-10-30T15:30:18Z",
  "updated_at": "2026-10-30T15:30:18Z"
}
```

**GET `/api/terms/?type=religion&status=draft`** → `200`. Returns ids 13 (Black Hebrew Israelites), 14 (Book of Deuteronomy) and 15 (Yahweh), each with the shape above.

**POST `/api/terms/`** → `201`. `status` defaults to `draft` if omitted.

```json
{
  "name": "Watts",
  "type": "place",
  "explanation": "A neighbourhood in South Los Angeles.",
  "sources": "https://en.wikipedia.org/wiki/Watts,_Los_Angeles"
}
```

**PUT `/api/terms/14/`** → `200`. Send `name`, `type`, `explanation` and `sources`.

```json
{
  "name": "Book of Deuteronomy",
  "type": "religion",
  "explanation": "Rewritten explanation.",
  "explanation_ru": "Пятая книга Торы.",
  "sources": "https://en.wikipedia.org/wiki/Book_of_Deuteronomy",
  "status": "draft",
  "notes": ""
}
```

**PATCH `/api/terms/14/`** → `200`

```json
{ "status": "verified" }
```

**DELETE `/api/terms/14/`** → `204` (also deletes its references).

---

## References: `/api/references/`

A reference links a term to a moment in a track.

| Field | Type | Required | Notes |
|---|---|---|---|
| `track` | integer (track id) | yes | |
| `track_title` | string | read-only | |
| `term` | integer (term id) | yes | |
| `term_name` | string | read-only | |
| `term_type` | string | read-only | |
| `timestamp_seconds` | integer | yes | `0` ≤ value ≤ the track's `duration_seconds` |
| `timestamp` | string `m:ss` | read-only | formatted `timestamp_seconds` |
| `context_note` | string (max 300) | yes | short note, no lyrics |

`(track, term, timestamp_seconds)` must be unique.

Query params: `?track=<id>`, `?term=<id>`

**GET `/api/references/?track=12`** → `200` (first 2 of 6 shown)

```json
[
  {
    "id": 19,
    "track": 12,
    "track_title": "FEAR.",
    "term": 16,
    "term_name": "Carl Duckworth",
    "term_type": "person",
    "timestamp_seconds": 0,
    "timestamp": "0:00",
    "context_note": "The song opens with a voicemail from Lamar's cousin Carl.",
    "created_at": "2026-10-30T15:30:18Z",
    "updated_at": "2026-10-30T15:30:18Z"
  },
  {
    "id": 20,
    "track": 12,
    "track_title": "FEAR.",
    "term": 14,
    "term_name": "Book of Deuteronomy",
    "term_type": "religion",
    "timestamp_seconds": 10,
    "timestamp": "0:10",
    "context_note": "In the voicemail Carl reads from Deuteronomy (cited as 28:28).",
    "created_at": "2026-10-30T15:30:18Z",
    "updated_at": "2026-10-30T15:30:18Z"
  }
]
```

**POST `/api/references/`** → `201`

```json
{ "track": 12, "term": 1, "timestamp_seconds": 200, "context_note": "Compton again in the second section." }
```

**PUT `/api/references/19/`** → `200`

```json
{ "track": 12, "term": 16, "timestamp_seconds": 2, "context_note": "Voicemail starts after a short pause." }
```

**PATCH `/api/references/19/`** → `200`. The timestamp is checked against the track even when only the timestamp is sent.

```json
{ "context_note": "Opening voicemail from cousin Carl." }
```

**DELETE `/api/references/19/`** → `204`.

---

## Validation errors

All of these return `400 Bad Request`. The body maps each field (or `non_field_errors`) to a list of messages.

Timestamp past the end of the track (FEAR. lasts 460 seconds):

```json
// POST /api/references/  {"track": 12, "term": 16, "timestamp_seconds": 9999, "context_note": "x"}
{ "timestamp_seconds": ["Timestamp must be between 0 and the track duration (460 seconds) for 'FEAR.'."] }
```

Negative timestamp:

```json
{ "timestamp_seconds": ["Ensure this value is greater than or equal to 0."] }
```

Duplicate reference (same track, term and timestamp):

```json
{ "non_field_errors": ["The fields track, term, timestamp_seconds must make a unique set."] }
```

Missing required fields:

```json
// POST /api/terms/  {"name": "Incomplete"}
{
  "type": ["This field is required."],
  "explanation": ["This field is required."],
  "sources": ["This field is required."]
}
```

Unknown foreign-key id:

```json
{ "track": ["Invalid pk \"999999\" - object does not exist."] }
```

Invalid filter value (`GET /api/terms/?type=bogus`):

```json
{ "type": ["Select a valid choice. bogus is not one of the available choices."] }
```

Unknown id (`GET /api/artists/999999/`) → `404`:

```json
{ "detail": "No Artist matches the given query." }
```
