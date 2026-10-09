<p align="center"><img src="Frontend/public/title.png" alt="TraceRoute: a networking-themed treasure hunt" width="640"></p>

# TraceRoute

> A **MERN** real-world QR hunt where every checkpoint is a **challenge**. Scan the QR at a location, solve a networking MCQ, and the next location unlocks. After the fifth location comes a rapid-fire round of 5 fresh questions. The fastest team wins.

Everything about the event (name, tagline, number of levels, attempts, cooldowns, penalties, question bank, locations and QR codes) is editable from the admin dashboard.

---

## ✨ How a game works

1. A team logs in with its Team ID and password.
2. **Start:** the team scans the Start QR. The clock starts and the first location hint appears.
3. **Each level (5 by default):** solving the question reveals the riddle for the next location. The team walks there, scans that QR, and the next question opens. A wrong answer costs a time penalty and a short cooldown.
4. **Mega Puzzle:** after the last hop the team gets the hop codes it collected and must put them in the order its personal rule asks for.
5. **Winner:** least total time (elapsed time plus penalties).

Every team gets its own route (7 of the 12 locations, balanced across teams) and its own set of 7 questions from the bank, each with the options shuffled.

| Feature | Description |
| :-- | :-- |
| **Question bank** | 60 networking MCQs seeded from `computer_networks_placement_mcqs.md`. Add, edit, disable, import and export from the admin. |
| **Per-team randomisation** | Distinct questions per level, difficulty ramps up, least-used questions first, option order shuffled per team. |
| **Anti-cheat** | Answers stay on the server. Atomic updates stop double submits. Attempt limits, cooldowns and penalties. |
| **Resumable** | Refresh or log in on a second phone and the team continues exactly where it was. |
| **Live admin** | Leaderboard with penalties, per-level fastest teams, CSV export, unlock / force-complete / reset a team. |
| **Adaptable** | Event name, level count, attempts, cooldown, penalty, event status (DRAFT / LIVE / ENDED). |
| **QR tooling** | Print or download QR codes from the browser, regenerate a secret, add or delete locations. |

---

## 🚀 Quick start

### Prerequisites

- Node.js 18+ (20 recommended)
- A MongoDB Atlas cluster (free tier works)

### 1. Install

```bash
git clone <your-repo-url>
cd <your-repo-folder>

cd Backend && npm install --legacy-peer-deps
cd ../Frontend && npm install --legacy-peer-deps
```

### 2. Configure

```bash
cd Backend
cp .env.example .env     # set MONGODB_URI (use a database name, e.g. /traceroute) and JWT_SECRET
cd ../Frontend
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
```

### 3. Seed everything

```bash
cd Backend
ADMIN_PASSWORD=choose-one npm run setup:all
```

`setup:all` seeds the 13 locations, the settings document, the 60 questions, 20 demo teams (`Team-1`…`Team-20`, password `123456`), the admin account, and generates the QR PNGs plus the printable sheet in `Frontend/public/`.

### 4. Run

```bash
# terminal 1
cd Backend && npm run dev
# terminal 2
cd Frontend && npm run dev
```

Open <http://localhost:5173>.

---

## 🧰 npm scripts (Backend)

| Script | What it does |
| :-- | :-- |
| `npm run setup:all` | Locations, settings, questions, demo teams, admin, QR codes, printable sheet |
| `npm run setup:quick` | Locations, settings, questions, admin (no demo teams) |
| `npm run seed:locations` | Seeds the Start + the configured locations, keeping existing QR secrets (`-- --new-secrets` to rotate) |
| `npm run seed:questions [-- file.md\|file.json]` | Loads the question bank (default: the bundled 60 MCQs) |
| `npm run seed:settings [-- --reset]` | Creates the settings document (or resets it) |
| `npm run seed:teams [-- --count=N]` | Wipes **all** teams and creates N demo teams |
| `npm run seed:admin` | Creates the admin (`ADMIN_PASSWORD` / `ADMIN_EMAIL` env, otherwise random) |
| `npm run generate:qr` | QR PNGs (`00_…png`, `01_…png`, …) |
| `npm run generate:printable` | A4 print sheet: the 12 location QRs, 4 per page (no Start QR) |
| `npm run generate:start` | 16:9 slide with the Start QR in the middle, for the smartboard |
| `npm run db:wipe` | Deletes the teams |
| `npm test` | Unit and end-to-end API tests (in-memory MongoDB) |
| `npm run lint` | ESLint |

Adding more questions: put them in the same Markdown format or a JSON array and run `npm run seed:questions -- path/to/file`, or use **Admin → Question Bank → Import JSON**.

---

## 🗂️ Project layout

```
Backend/
  config/         constants, express middleware, dbConnect
  controllers/    auth, game (scan / answer / Mega Puzzle), admin
  models/         Team, Location, Question, Settings
  routes/         auth, game, admin, settings
  services/       teamService, questionService, settingsService
  utils/          questionLogic (parser, picker), finale (Mega Puzzle rules)
  scripts/        seed + QR generators
  tests/          node:test unit + supertest end-to-end
Frontend/
  src/pages/      Login, Dashboard (team), Admin
  src/components/ Dashboard/ (ChallengeCard, FinalePanel), admin/*, Scanner
docs/             architecture, game logic, runbook, API spec
shared/           documented API contracts
```

---

## 📚 Docs

- [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md): game rules and flow
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel + Atlas setup
- [docs/ADMIN_RUNBOOK.md](docs/ADMIN_RUNBOOK.md): event-day checklist
- [docs/LOCATIONS_AND_REVEALS.md](docs/LOCATIONS_AND_REVEALS.md): the 12 locations and their hints
- [docs/openapi.yaml](docs/openapi.yaml): API spec
- [docs/EMAIL_TEMPLATE.md](docs/EMAIL_TEMPLATE.md): Make.com login email + HTML template
- [simulation_guide.md](simulation_guide.md): dry-run before the event

---

## ☁️ Deployment

Live: **https://traceroute-cn.vercel.app** (web app) and **https://traceroute-api.vercel.app** (API), both on Vercel with MongoDB Atlas. Setup, environment variables and gotchas are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 👤 Author

**Prasad Bhalerao** · [LinkedIn](https://www.linkedin.com/in/prasadbhalerao)

Released under the MIT License (see [LICENSE](LICENSE)).
