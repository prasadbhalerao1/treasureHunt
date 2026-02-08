# 🏴‍☠️ BERLIN HEIST

> A **MERN-based** real-world treasure hunt platform for collegiate events.

---

## ✨ Core Features

| Feature                     | Description                                                             |
| :-------------------------- | :---------------------------------------------------------------------- |
| **📱 Mobile-First UI**      | Brutalist design optimized for handheld play. No app download required. |
| **🔒 QR Code Progression**  | Players scan QR codes at physical locations to advance levels.          |
| **📧 Webhook Dispatch**     | Teams receive activation emails via Make.com webhook (optional).        |
| **📊 Live Admin Dashboard** | Real-time leaderboard and team distribution charts.                     |
| **⚡ Campus Wi-Fi Ready**   | Relaxed rate limits (300k/15min) to handle shared NAT IPs.              |
| **☁️ Vercel Optimized**     | Serverless-ready MongoDB connection pooling (`maxPoolSize: 1`).         |

---

## 🚀 Quick Start (Clone & Run)

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/TreasureHunt.git
cd TreasureHunt

# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Configure Environment

**Backend** (`Backend/.env`):

```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/treasurehunt
JWT_SECRET=your_super_secret_key_change_this

# Optional: Make.com webhook for team emails
# MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your_webhook_id
```

**Frontend** (`Frontend/.env`):

```ini
VITE_API_URL=http://localhost:5000/api
```

### 3. Setup Database (One Command!)

```bash
cd Backend

# Full setup: Locations + Admin + 20 Teams + QR Codes + Printable
npm run setup:all

# OR minimal setup: Just Locations + Admin
npm run setup:quick
```

> 📋 **Save the admin credentials** shown in the console!

### 4. Run Development Servers

**Terminal 1 (API)**:

```bash
cd Backend
npm run dev
```

**Terminal 2 (Client)**:

```bash
cd Frontend
npm run dev
```

Access at `http://localhost:5173`

---

## 🕹️ Deep Dive: Game Logic & Features

### 1. The "Phygital" Gameplay Loop

The system bridges the physical and digital worlds using a strict State Machine:

1.  **Level 0 (Start)**:
    - **Action**: Team scans the "Start QR" at the base.
    - **Result**: Timer Starts. Level 1 Hint is revealed.
2.  **Levels 1-6 (The Hunt)**:
    - **Dynamic Pathing**: Each team follows a unique, consistent sequence of 6 randomized locations (out of 12) to prevent overcrowding.
    - **Riddle System**: Players only see the riddle for their _next_ specific location.
    - **Validation**: Scanning a QR checks `CurrentLocation == TargetLocation`.
      - _Success_: Awards a unique "City Keyword" (e.g., "TOKYO") and unlocks next level.
      - _Failure_: "Wrong Location" error prevents skipping.

3.  **Level 7 (The Finale)**:
    - **Condition**: All 6 keywords collected.
    - **Challenge**: A randomized sorting puzzle (e.g., "Sort keywords by Length" or "Alphabetical").
    - **Victory**: Submitting correct order verifies the win and stops the clock.

### 2. Admin & Organization Flow

#### ⚡ Team Onboarding (The "AI" Email Workflow)

1.  **Admin Input**: Admin uses the dashboard to add Team Name & Leader Email.
2.  **System Generation**: Backend creates a unique `TeamID` (e.g., `TITAN-X99`) and strong password.
3.  **Webhook Trigger**: System fires a payload to **Make.com**.
4.  **Instant Delivery**: An automated email acts as the "Mission Brief" containing credentials, sent instantly to the team leader.

#### 📊 Admin Dashboard

- **Live Leaderboard**: Ranked by **Chip Time** (Duration), not just finish order.
  - _Fairness_: A team starting 30 mins late can still win if they complete the course faster.
- **Distribution Charts**: Real-time bar charts showing how many teams are stuck at each level/location.
- **Intervention**: Admins can force-complete levels for teams if a physical QR goes missing.

### 3. Security & Fairness Architecture

- **Session Locking**: Max **4 concurrent devices** per team to prevent account sharing across campus.
- **Anti-Bruteforce**: API rate-limiting prevents teams from guessing QR codes.
- **Offline Resilience**: Game state is persistent in MongoDB; if a phone dies, progress is safe.

---

## 🛠️ Available Scripts

### Backend (`cd Backend`)

| Script             | Command                      | Description                              |
| :----------------- | :--------------------------- | :--------------------------------------- |
| **Full Setup**     | `npm run setup:all`          | Seeds everything + generates QRs         |
| **Quick Setup**    | `npm run setup:quick`        | Only locations + admin                   |
| **Seed Locations** | `npm run seed:locations`     | 13 locations with riddles                |
| **Seed Admin**     | `npm run seed:admin`         | Creates admin account                    |
| **Seed Teams**     | `npm run seed:teams`         | Creates 20 test teams (password: 123456) |
| **Generate QRs**   | `npm run generate:qr`        | Creates QR code images                   |
| **Generate Print** | `npm run generate:printable` | Creates printable HTML                   |
| **Wipe DB**        | `npm run db:wipe`            | Clears teams (keeps admin)               |
| **Dev Server**     | `npm run dev`                | Starts with hot reload                   |

### Utility Scripts (run with `node scripts/...`)

| Script                  | Command                             | Description                          |
| :---------------------- | :---------------------------------- | :----------------------------------- |
| **List All Teams**      | `node scripts/listAll.js`           | Lists all teams in console           |
| **List Admins**         | `node scripts/listAdmins.js`        | Lists admin accounts                 |
| **Generate Team Flows** | `node scripts/generateTeamFlows.js` | Generates markdown doc of team paths |

---

## 🛠️ Tech Stack

### Backend

| Package              | Purpose            |
| :------------------- | :----------------- |
| `express`            | REST API Framework |
| `mongoose`           | MongoDB ODM        |
| `jsonwebtoken`       | JWT Authentication |
| `helmet`             | Security Headers   |
| `express-rate-limit` | API Throttling     |
| `qrcode`             | QR Code Generation |

### Frontend

| Package            | Purpose                |
| :----------------- | :--------------------- |
| `react` + `vite`   | UI Framework & Bundler |
| `tailwindcss`      | Utility-First CSS      |
| `react-router-dom` | Client-side Routing    |
| `axios`            | HTTP Client            |
| `html5-qrcode`     | In-Browser QR Scanner  |
| `lucide-react`     | Icon Library           |
| `recharts`         | Admin Dashboard Charts |

---

## 📂 Project Structure

```
TreasureHunt/
├── Backend/
│   ├── config/          # Database, Express, & Constants
│   ├── controllers/     # Business Logic (Auth, Game, Admin)
│   ├── scripts/         # Setup & Seeding Scripts
│   ├── middleware/      # Auth Guard
│   ├── models/          # Mongoose Schemas (Team, Location)
│   ├── routes/          # API Endpoints
│   └── utils/           # Helpers (Crypto, Logger)
│
├── Frontend/
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # Route Views
│   │   └── utils/       # API Client
│   └── public/          # Static Assets & QR Codes
│
├── docs/                # Documentation
│   ├── ARCHITECTURE.md      # System Design
│   ├── DOCUMENTATION.md     # Game Logic & Webhooks
│   ├── RIDDLES_MASTER_LIST.md # Location Hints Reference
│   ├── state_machine_diagram.md # Game State Diagrams
│   └── openapi.yaml         # API Specification
│
├── simulation_guide.md  # Step-by-step Mock Event Guide
└── LICENSE              # MIT License
```

---

## 📚 Documentation

- **[Architecture](./docs/ARCHITECTURE.md)**: System Design & Scalability
- **[Documentation](./docs/DOCUMENTATION.md)**: Game Logic & Webhook Setup
- **[Simulation Guide](./simulation_guide.md)**: Step-by-step mock event
- **[API Specification](./docs/openapi.yaml)**: OpenAPI/Swagger spec
- **[Riddles](./docs/RIDDLES_MASTER_LIST.md)**: Location hints reference
- **[State Machine](./docs/state_machine_diagram.md)**: Game state diagrams

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🏆 Credits

**Author**: [Prasad Bhalerao](https://www.linkedin.com/in/prasadbhalerao)

**Created for**: JSPM's Abhyudaya 3.0 - CSBS Department

---

<p align="center">
  <sub>Made with ❤️ for treasure hunters everywhere</sub>
</p>
