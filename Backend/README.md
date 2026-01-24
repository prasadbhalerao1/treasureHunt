# ⚙️ BERLIN HEIST API (Backend)

> The core game engine handling authentication, game state, and QR verification logic.

---

## ✨ Core Features

| Feature                 | Description                                                        |
| :---------------------- | :----------------------------------------------------------------- |
| **🔐 Scrypt Auth**      | Native Node.js crypto for password hashing (no bcrypt dependency). |
| **🎫 JWT Sessions**     | Stateless auth with max 3 concurrent devices per team.             |
| **📧 Webhook Dispatch** | Make.com integration for instant team emails.                      |
| **🎯 QR Validation**    | Sequential QR scanning with location-based progression.            |
| **📊 Admin Analytics**  | Aggregated stats: leaderboard, team distribution per level.        |

---

## 📂 File Structure

```
Backend/
├── config/
│   └── dbConnect.js       # MongoDB Singleton (Serverless-safe)
│
├── controllers/
│   ├── authController.js  # Login
│   ├── gameController.js  # Game State & QR Scanning
│   └── adminController.js # Dashboard & Team Mgmt
│
├── services/
│   └── teamService.js     # Team Creation & Webhook
│
├── middleware/
│   └── authMiddleware.js  # JWT Verification Guard
│
├── models/
│   ├── Team.js            # User/Team Schema
│   └── Location.js        # Level hints, QR secrets
│
├── routes/
│   ├── authRoutes.js      # /api/auth/*
│   ├── gameRoutes.js      # /api/game/*
│   └── adminRoutes.js     # /api/admin/*
│
├── index.js               # Express app entry
└── vercel.json            # Serverless routing config
```

---

## 🔌 API Endpoints

### Auth (`/api/auth`)

| Method | Route    | Description                      |
| :----- | :------- | :------------------------------- |
| `POST` | `/login` | Returns JWT token + team object. |

### Game (`/api/game`)

| Method | Route     | Auth | Description                                  |
| :----- | :-------- | :--- | :------------------------------------------- |
| `GET`  | `/state`  | ✅   | Current level, hint, collected keywords.     |
| `POST` | `/scan`   | ✅   | Submit QR string. Advances level on success. |
| `POST` | `/submit` | ✅   | Final level answer submission.               |

### Admin (`/api/admin`)

| Method   | Route             | Auth     | Description                         |
| :------- | :---------------- | :------- | :---------------------------------- |
| `GET`    | `/stats`          | ✅ Admin | Team distribution + leaderboard.    |
| `GET`    | `/teams`          | ✅ Admin | List all teams.                     |
| `POST`   | `/teams`          | ✅ Admin | Create new team (triggers webhook). |
| `DELETE` | `/teams/:id`      | ✅ Admin | Delete team.                        |
| `PUT`    | `/teams/:id/path` | ✅ Admin | Update team's location path.        |
| `GET`    | `/locations`      | ✅ Admin | List all locations.                 |
| `PUT`    | `/locations/:id`  | ✅ Admin | Update location hint/QR secret.     |

---

## 🛠️ Scripts

| Script         | Command       | Description                           |
| :------------- | :------------ | :------------------------------------ |
| **Dev Server** | `npm run dev` | Starts with `--watch` for hot reload. |

---

## ⚠️ Vercel Notes

- Set `MONGODB_URI` whitelist to `0.0.0.0/0` (Vercel uses dynamic IPs).
- Connection pooling is set to `maxPoolSize: 1` to prevent storms.
- Webhook is fire-and-forget (non-blocking) for instant responses.
