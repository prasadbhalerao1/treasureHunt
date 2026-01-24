# 🏴‍☠️ BERLIN HEIST

> A **MERN-based** real-world treasure hunt platform for collegiate events.
> Designed to orchestrate **400+ concurrent players** on Vercel Free Tier.

---

## ✨ Core Features

| Feature                     | Description                                                             |
| :-------------------------- | :---------------------------------------------------------------------- |
| **📱 Mobile-First UI**      | Brutalist design optimized for handheld play. No app download required. |
| **🔒 QR Code Progression**  | Players scan QR codes at physical locations to advance levels.          |
| **📧 Webhook Dispatch**     | Teams receive activation emails via Make.com webhook.                   |
| **📊 Live Admin Dashboard** | Real-time leaderboard and team distribution charts.                     |
| **⚡ Campus Wi-Fi Ready**   | Relaxed rate limits (300k/15min) to handle shared NAT IPs.              |
| **☁️ Vercel Optimized**     | Serverless-ready MongoDB connection pooling (`maxPoolSize: 1`).         |

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
| `node-fetch`         | Webhook Trigger    |

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

## 📂 File Structure

```
TreasureHunt/
├── Backend/
│   ├── config/          # Database connection (Singleton)
│   ├── controllers/     # Business Logic (Auth, Game, Admin)
│   ├── services/        # Logic Layer (TeamService)
│   ├── middleware/      # Auth Guard (authMiddleware.js)
│   ├── models/          # Mongoose Schemas (Team, Location)
│   ├── routes/          # API Endpoints
│   ├── utils/           # Helpers (Crypto)
│   ├── index.js         # Express Entry Point
│   └── vercel.json      # Serverless Config
│
├── Frontend/
│   ├── src/
│   │   ├── components/  # UI Primitives & Admin Components
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # Route Views (Login, Dashboard, Admin)
│   │   └── utils/       # API Client
│   └── public/          # Static Assets
│
├── credentials.md       # Login Reference for Admins
├── simulation_guide.md  # How to run a mock event
└── ARCHITECTURE.md      # Detailed System Design
```

---

## ⚙️ Environment Variables

### Backend (`Backend/.env`)

```ini
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/treasurehunt

# Security
JWT_SECRET=your_super_secret_key

# Webhook (Make.com)
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your_webhook_id
```

### Frontend (`Frontend/.env`)

```ini
# API URL
VITE_API_URL=http://localhost:5000/api
```

> **Tip (Mobile Testing)**: Replace `localhost` with your PC's local IP (e.g., `192.168.1.5`) to test on your phone.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/TreasureHunt.git
cd TreasureHunt

# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Configure Environment

Create `.env` files in both `Backend/` and `Frontend/` directories using the variables above.

### 3. Run Development Servers

**Terminal 1 (API)**

```bash
cd Backend
npm run dev
```

**Terminal 2 (Client)**

```bash
cd Frontend
npm run dev
```

Access at `http://localhost:5173`.

---

## 🌐 Production Deployment

**Frontend**: [https://treasurehunt-gotham-ai.vercel.app](https://treasurehunt-gotham-ai.vercel.app)  
**Backend API**: [https://treasure-hunt-gothamai-backend.vercel.app](https://treasure-hunt-gothamai-backend.vercel.app)

Both deployed on Vercel with automatic CI/CD from GitHub.

---

## 🎮 Game Flow

1. **Admin Creates Team** → Webhook sends email with Team ID
2. **Team Logs In** → Dashboard shows current level and hint
3. **Team Finds Location** → Scans QR code at physical location
4. **Level Complete** → Keyword collected, next hint unlocked
5. **Repeat** → Until all 6 levels completed
6. **Finale** → Submit sorted keywords to win

---

## 📚 Additional Docs

- **[Backend Details](./Backend/README.md)**: API Endpoints, Security Config.
- **[Architecture](./ARCHITECTURE.md)**: System Design & Scalability.
- **[Simulation Guide](./simulation_guide.md)**: Step-by-step mock event.
- **[Deployment Guide](./DEPLOYMENT.md)**: Production deployment & monitoring.
- **[API Documentation](./openapi.yaml)**: OpenAPI/Swagger specification.

---

## 🏆 Credits

**Built by**: Gotham AI  
**License**: MIT
