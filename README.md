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

## 🎮 Game Flow

1. **Admin Creates Team** → Webhook sends email with Team ID (if configured)
2. **Team Logs In** → Dashboard shows current level
3. **Team Scans Start QR** → Timer Starts! Hint for Location 1 appears.
4. **Team Finds Location** → Scans QR code at physical location
5. **Level Complete** → Keyword collected, next hint unlocked
6. **Repeat** → Until all 6 levels completed
7. **Finale (BitLocker)** → Submit sorted keywords to win

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

### Frontend

| Package          | Purpose                |
| :--------------- | :--------------------- |
| `react` + `vite` | UI Framework & Bundler |
| `tailwindcss`    | Utility-First CSS      |
| `axios`          | HTTP Client            |
| `html5-qrcode`   | In-Browser QR Scanner  |
| `lucide-react`   | Icon Library           |
| `recharts`       | Admin Dashboard Charts |

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
├── ARCHITECTURE.md      # System Design
├── DOCUMENTATION.md     # Detailed Documentation
├── openapi.yaml         # API Specification
└── LICENSE              # MIT License
```

---

## 📚 Documentation

- **[Architecture](./ARCHITECTURE.md)**: System Design & Scalability
- **[Documentation](./DOCUMENTATION.md)**: Game Logic & Webhook Setup
- **[Simulation Guide](./simulation_guide.md)**: Step-by-step mock event
- **[API Specification](./openapi.yaml)**: OpenAPI/Swagger spec
- **[Riddles](./RIDDLES_MASTER_LIST.md)**: Location hints reference

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

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
