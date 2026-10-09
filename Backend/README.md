# ⚙️ TraceRoute API (Backend)

Express 4 + Mongoose 8 API for the TraceRoute challenge hunt. See the [root README](../README.md) for the full setup and [docs/](../docs/) for design and API details.

## Run

```bash
npm install --legacy-peer-deps
cp .env.example .env        # MONGODB_URI (with a database name), JWT_SECRET
npm run setup:all           # seed everything + QR codes
npm run dev                 # http://localhost:5000
```

## Environment

| Variable | Required | Purpose |
| :-- | :-- | :-- |
| `MONGODB_URI` | yes | Atlas connection string. Include a database name (`/traceroute`) |
| `JWT_SECRET` | yes | Signs session tokens |
| `PORT` | no | Defaults to 5000 |
| `CORS_ORIGINS` | production | Comma-separated frontend URLs (localhost is always allowed) |
| `ADMIN_PASSWORD`, `ADMIN_EMAIL` | no | Used by `npm run seed:admin` (random password if unset) |
| `DEMO_TEAM_PASSWORD` | no | Password for `seed:teams` demo teams (default `123456`) |
| `MAKE_WEBHOOK_URL` | no | POSTs new team credentials for emailing (see docs/EMAIL_TEMPLATE.md) |
| `FRONTEND_URL` | no | Public web app URL, used as the login link in the email |

## Routes

| Method | Path | Notes |
| :-- | :-- | :-- |
| GET | `/api/health` | Liveness |
| POST | `/api/auth/login` | Team or admin |
| GET | `/api/settings/public` | Branding, no auth |
| GET | `/api/game/state` | Resumable state |
| POST | `/api/game/scan` | Start QR, or open a level's challenge |
| POST | `/api/game/answer` | Answer the MCQ |
| POST | `/api/game/submit` | Mega Puzzle |
| `*` | `/api/admin/*` | Stats, settings, teams, locations, questions (ADMIN only) |

Full spec: [docs/openapi.yaml](../docs/openapi.yaml).

## Tests

```bash
npm test
```

`node --test` runs the unit tests (question parser, picker, Mega Puzzle rules, answer-leak check) and an end-to-end game played through the real Express app against an in-memory MongoDB (`mongodb-memory-server`, downloaded on first run).

## Seed scripts

See the table in the [root README](../README.md#-npm-scripts-backend). `restore`-style scripts that depend on private data (`seedMyAdmin.js`, `seedEventAccounts.js`) are gitignored.
