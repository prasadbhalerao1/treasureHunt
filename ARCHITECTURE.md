# TreasureHunt Architecture

## System Overview

A real-time QR-based treasure hunt game for 400+ concurrent users on Vercel Free Tier.

## Technology Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React + Vite, TailwindCSS         |
| Backend  | Express.js (Serverless on Vercel) |
| Database | MongoDB Atlas                     |
| Auth     | JWT (12h expiry), Scrypt hashing  |
| Email    | Make.com Webhook                  |

---

## Database Schema

### Team

| Field                | Type                     | Description                    |
| -------------------- | ------------------------ | ------------------------------ |
| teamId               | String (unique, indexed) | e.g., "TIT-A3F2"               |
| name                 | String                   | Team name                      |
| email                | String (unique)          | Leader email                   |
| passwordHash         | String                   | Scrypt hash                    |
| salt                 | String                   | Password salt                  |
| members              | [String]                 | Member names                   |
| role                 | Enum                     | "CANDIDATE" or "ADMIN"         |
| finaleChallenge      | Enum                     | One of 6 challenge types       |
| path                 | [Number]                 | Ordered Location IDs (7 items) |
| currentLevelIndex    | Number                   | Current progress (0-7)         |
| lastLevelCompletedAt | Date                     | For leaderboard sorting        |
| levelHistory         | [{level, completedAt}]   | For time calculations          |
| collectedKeywords    | [String]                 | Collected keywords             |
| activeSessions       | [String]                 | JWT session IDs (max 4)        |

### Location

| Field      | Type                  | Description             |
| ---------- | --------------------- | ----------------------- |
| locationId | Number (0-16, unique) | Location identifier     |
| name       | String                | Display name            |
| hint       | String                | Riddle shown to players |
| qrSecret   | String                | QR validation string    |
| keyword    | String                | Awarded on scan         |

---

## API Contracts

### Auth

| Method | Endpoint    | Request              | Response                                     |
| ------ | ----------- | -------------------- | -------------------------------------------- |
| POST   | /auth/login | `{teamId, password}` | `{token, team: {teamId, name, role, level}}` |

### Game

| Method | Endpoint     | Request      | Response                                           |
| ------ | ------------ | ------------ | -------------------------------------------------- |
| GET    | /game/state  | -            | `{teamId, level, status, hint, collectedKeywords}` |
| POST   | /game/scan   | `{qrString}` | `{msg, keyword, nextLevel, nextHint}`              |
| POST   | /game/submit | `{answer}`   | `{msg}` (Finale only)                              |

### Admin

| Method | Endpoint              | Request                            | Response                      |
| ------ | --------------------- | ---------------------------------- | ----------------------------- |
| GET    | /admin/stats          | `?level=Global\|0-6`               | `{distribution, leaderboard}` |
| GET    | /admin/teams          | -                                  | `[Team]`                      |
| POST   | /admin/teams          | `{name, email, members, password}` | `{msg, team}`                 |
| DELETE | /admin/teams/:id      | -                                  | `{msg}`                       |
| PUT    | /admin/teams/:id/path | `{path: [Number]}`                 | `{msg, team}`                 |
| GET    | /admin/locations      | -                                  | `[Location]`                  |
| PUT    | /admin/locations/:id  | `{hint?, qrSecret?}`               | `{msg, location}`             |

---

## Game Logic

### Path Structure

- `path[0]` = Starting location (always 0)
- `path[1-6]` = 6 random locations from 1-12
- Total: 7 locations per team (Start + 6 Levels)

### Progression

1. `currentLevelIndex = 0` → Show hint for `path[1]`
2. Player scans QR at `path[1]` → `currentLevelIndex = 1`
3. Continue until `currentLevelIndex = 6` (Finale)
4. Submit sorted keywords → `currentLevelIndex = 7` (COMPLETED)

### Finale Logic

**Randomized Challenges**: Each team is assigned one of 6 sorting challenges:

| Challenge       | Description            |
| --------------- | ---------------------- |
| `ALPHA_ASC`     | Sort A → Z             |
| `ALPHA_DESC`    | Sort Z → A             |
| `LENGTH_ASC`    | Shortest → Longest     |
| `LENGTH_DESC`   | Longest → Shortest     |
| `SECOND_LETTER` | Sort by 2nd character  |
| `LAST_LETTER`   | Sort by last character |

**Edge Cases**: If two words have the same sort key (e.g., same length), either order is accepted.

**Override**: Submitting `OVERRIDE-VICTORY` bypasses validation (admin use only).

---

## Scalability Design

| Decision       | Reason                                     |
| -------------- | ------------------------------------------ |
| Indexed fields | O(1) lookups for teamId, email, locationId |
| Lean selects   | Only fetch required fields                 |
| No polling     | Frontend only refreshes on user action     |
| Stateless API  | No in-memory state                         |
| Webhook emails | Offload to Make.com                        |
| Session FIFO   | Max 4 concurrent sessions per team         |

---

## File Structure

```
Backend/
├── config/
│   ├── dbConnect.js          # MongoDB Singleton
│   ├── express.js            # Middleware configuration
│   └── constants.js          # Shared constants (ROLES, GAME_STATUS)
├── controllers/
│   ├── adminController.js    # Admin CRUD operations
│   ├── authController.js     # Login only
│   └── gameController.js     # Game state & progression
├── services/
│   └── teamService.js        # Centralized team creation
├── models/
│   ├── Team.js
│   └── Location.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   └── gameRoutes.js
├── utils/
│   ├── auth.js               # Password hashing
│   └── logger.js             # Logging utility
└── middleware/
    └── authMiddleware.js

Frontend/
├── pages/
│   ├── Admin.jsx             # Admin dashboard
│   ├── Dashboard.jsx         # Player interface
│   └── Login.jsx
├── components/
│   ├── Auth/
│   │   └── ProtectedRoute.jsx  # Route guard component
│   ├── admin/
│   │   ├── UserManagement.jsx
│   │   ├── FlowManagement.jsx
│   │   └── LocationManagement.jsx
│   ├── Scanner.jsx
│   └── ui/                   # Reusable UI components
├── utils/
│   ├── api.js                # Axios client
│   └── constants.js          # Shared constants (ROLES, GAME_STATUS)
└── context/
    └── AuthContext.jsx
```

---

## Admin Workflows

### Team Creation

1. Admin fills form → POST /admin/teams
2. Backend: Generate ID, hash password, create path
3. Trigger Make.com webhook → Email sent
4. Team can login immediately

### Flow Management

1. Select team → View 7-step path
2. Edit dropdown → Select different location
3. Save → PUT /admin/teams/:id/path
4. Backend validates no duplicates

### Location Management

1. View all 13 locations
2. Edit hint or QR secret
3. Changes reflect immediately for players

---

## Security

- JWT with session tracking (max 4 concurrent)
- Scrypt password hashing
- Admin routes protected by role check
- Input validation on all endpoints
