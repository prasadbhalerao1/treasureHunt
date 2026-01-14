# 🏴‍☠️ Campus Heist

> A **MERN-based** real-world treasure hunt platform for collegiate events.
> Designed to orchestrate **500+ concurrent players** with a "Brutalist" aesthetic.

---

## ✨ Core Features

| Feature                        | Description                                                             |
| :----------------------------- | :---------------------------------------------------------------------- |
| **📱 Mobile-First UI**         | Brutalist design optimized for handheld play. No app download required. |
| **🔒 Two-Factor Verification** | Players must be verified by a Volunteer AND scan a QR code to progress. |
| **📧 Email Delivery**          | Team IDs sent via styled HTML email upon registration.                  |
| **📊 Live Admin Dashboard**    | Real-time leaderboard and team distribution charts.                     |
| **⚡ Campus Wi-Fi Ready**      | Relaxed rate limits (300k/15min) to handle shared NAT IPs.              |
| **☁️ Vercel Optimized**        | Serverless-ready MongoDB connection pooling (`maxPoolSize: 1`).         |

---

## 🛠️ Tech Stack

### Backend

| Package              | Purpose                 |
| :------------------- | :---------------------- |
| `express`            | REST API Framework      |
| `mongoose`           | MongoDB ODM             |
| `jsonwebtoken`       | JWT Authentication      |
| `helmet`             | Security Headers        |
| `express-rate-limit` | API Throttling          |
| `nodemailer`         | Email Dispatch          |
| `qrcode`             | QR Generation (Seeding) |

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
│   ├── middleware/      # Auth Guard (isAuth.js)
│   ├── models/          # Mongoose Schemas (Team, Level)
│   ├── routes/          # API Endpoints
│   ├── scripts/         # Seeding & Testing Utilities
│   ├── utils/           # Helpers (Email, Crypto, Templates)
│   ├── index.js         # Express Entry Point
│   └── vercel.json      # Serverless Config
│
├── Frontend/
│   ├── src/
│   │   ├── components/  # UI Primitives (Scanner, Loader)
│   │   ├── context/     # AuthContext (Global State)
│   │   ├── pages/       # Route Views (Login, Dashboard, Volunteer, Admin)
│   │   └── utils/       # API Client (Axios instance)
│   └── public/
│       └── qr_codes/    # Pre-generated Level QR Images
│
├── credentials.md       # Login Reference for Admins/Volunteers
└── simulation_guide.md  # How to run a mock event
```

---

## ⚙️ Environment Variables

### Backend (`Backend/.env`)

```ini
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/treasurehunt

# Security
JWT_SECRET=your_super_secret_key

# Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
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

### 3. Seed Database

```bash
cd Backend
npm run seed:users
```

> ⚠️ **Warning**: This wipes all users and creates 2 Admins + 10 Volunteers.

### 4. Run Development Servers

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

## 📚 Additional Docs

- **[Backend Details](./Backend/README.md)**: API Endpoints, Security Config.
- **[Frontend Details](./Frontend/README.md)**: Design System, Component Guide.
- **[Credentials](./credentials.md)**: Test Logins (Admins, Volunteers).
- **[Simulation Guide](./simulation_guide.md)**: Step-by-step mock event.

---

## 🏆 Credits

**Built by**: Gotham AI
**License**: MIT
