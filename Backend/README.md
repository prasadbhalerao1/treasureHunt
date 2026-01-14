# ⚙️ Campus Heist API (Backend)

> The core game engine handling authentication, game state, and verification logic.

---

## ✨ Core Features

| Feature                  | Description                                                        |
| :----------------------- | :----------------------------------------------------------------- |
| **🔐 Scrypt Auth**       | Native Node.js crypto for password hashing (no bcrypt dependency). |
| **🎫 JWT Sessions**      | Stateless auth with max 3 concurrent devices per team.             |
| **📧 Email Dispatch**    | Nodemailer sends styled Team ID emails on registration.            |
| **🛡️ Two-Factor Verify** | Volunteer verify + QR scan required to progress levels.            |
| **📊 Admin Analytics**   | Aggregated stats: leaderboard, team distribution per level.        |

---

## 📂 File Structure

```
Backend/
├── config/
│   └── dbConnect.js       # MongoDB Singleton (Serverless-safe)
│
├── controllers/
│   ├── authController.js  # Register, Login
│   ├── gameController.js  # getState, volunteerVerify, scanQR, submitAnswer
│   └── adminController.js # getDashboardStats
│
├── middleware/
│   └── isAuth.js          # JWT Verification Guard
│
├── models/
│   ├── Team.js            # User/Team Schema (levelStatus Map)
│   └── Level.js           # Level hints, QR secrets, keywords
│
├── routes/
│   ├── authRoutes.js      # /api/auth/*
│   ├── gameRoutes.js      # /api/game/*
│   └── adminRoutes.js     # /api/admin/*
│
├── scripts/
│   ├── seedUsers.js       # Populate Admins & Volunteers
│   ├── seedLevels.js      # Populate Level data & QR codes
│   └── verifyEmailCycle.js# End-to-end registration test
│
├── utils/
│   ├── auth.js            # hashPassword, verifyPassword
│   ├── email.js           # sendTeamIdEmail
│   └── emailTemplates.js  # HTML email template
│
├── index.js               # Express app entry
└── vercel.json            # Serverless routing config
```

---

## 🔌 API Endpoints

### Auth (`/api/auth`)

| Method | Route       | Description                                    |
| :----- | :---------- | :--------------------------------------------- |
| `POST` | `/register` | Create team (max 4 members). Returns `teamId`. |
| `POST` | `/login`    | Returns JWT token + team object.               |

### Game (`/api/game`)

| Method | Route               | Auth         | Description                                  |
| :----- | :------------------ | :----------- | :------------------------------------------- |
| `GET`  | `/state`            | ✅           | Current level, hint, verified status.        |
| `POST` | `/scan`             | ✅           | Submit QR string. Advances level on success. |
| `POST` | `/submit`           | ✅           | Final level (Bitlocker) text answer.         |
| `POST` | `/volunteer/verify` | ✅ Volunteer | Unlock a team's scanner.                     |
| `GET`  | `/lookup`           | ✅ Volunteer | Search team by ID/name.                      |

### Admin (`/api/admin`)

| Method | Route    | Auth     | Description                      |
| :----- | :------- | :------- | :------------------------------- |
| `GET`  | `/stats` | ✅ Admin | Team distribution + leaderboard. |

---

## 🛠️ Scripts

| Script         | Command              | Description                                    |
| :------------- | :------------------- | :--------------------------------------------- |
| **Seed Users** | `npm run seed:users` | ⚠️ Wipes DB. Creates 2 Admins + 10 Volunteers. |
| **Dev Server** | `npm run dev`        | Starts with `--watch` for hot reload.          |

---

## ⚠️ Vercel Notes

- Set `MONGODB_URI` whitelist to `0.0.0.0/0` (Vercel uses dynamic IPs).
- Connection pooling is set to `maxPoolSize: 1` to prevent storms.
