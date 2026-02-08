# 🏴‍☠️ BERLIN HEIST: Simulation Guide

> Complete guide to running a treasure hunt event with this platform.

---

## 📋 Pre-Event Setup

### 0. Environment Configuration

Before running the setup scripts, configure your environment variables.

#### **Backend Configuration**

1. Navigate to `Backend/` folder
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```
3. Open `Backend/.env` and fill in the following:

| Variable           | Where to Get It                                                                                                   | Example                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `MONGODB_URI`      | Go to [MongoDB Atlas](https://cloud.mongodb.com) → Create Free Cluster → Click "Connect" → Copy connection string | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/` |
| `JWT_SECRET`       | Generate random string (or keep default for testing)                                                              | `your_super_secret_key`                               |
| `MAKE_WEBHOOK_URL` | _(Optional)_ Go to [Make.com](https://make.com) → Create Scenario → Add Webhook → Copy URL                        | `https://hook.eu1.make.com/xxxxx`                     |

> 💡 **Tip**: Leave `MAKE_WEBHOOK_URL` blank if you don't want automated emails. Teams can still be created manually.

#### **Frontend Configuration**

1. Navigate to `Frontend/` folder
2. Copy the example file:
   ```bash
   cp .env.example .env
   ```
3. Open `Frontend/.env` and set:

| Variable       | Value                       | Note                  |
| -------------- | --------------------------- | --------------------- |
| `VITE_API_URL` | `http://localhost:5000/api` | For local development |

> 📱 **Mobile Testing**: Replace `localhost` with your PC's IP (e.g., `http://192.168.1.5:5000/api`) to test on phones connected to the same Wi-Fi.

---

### 1. Database Setup

```bash
cd Backend
npm install
npm run setup:all
```

This command will:

- ✅ Seed 13 locations with JSPM campus riddles
- ✅ Create admin account (credentials shown in console)
- ✅ Create 20 test teams (Team-1 to Team-20)
- ✅ Generate QR code images
- ✅ Generate printable HTML for QR codes

> 💡 **Save the admin password** shown in the console!

### 2. Print QR Codes

Open `Frontend/public/print_qrs.html` in your browser and print the QR codes. Place them at the corresponding physical locations on campus.

### 3. Start the Servers

**Terminal 1 (Backend):**

```bash
cd Backend
npm run dev
```

**Terminal 2 (Frontend):**

```bash
cd Frontend
npm run dev
```

---

## 🎭 The Player Experience

### 🕵️ The Candidate (The Player)

_The hero of the story. High-stress, fast-paced, mobile-first._

#### 1. The Hook (Pre-Game)

- **Trigger**: Admin creates team via Dashboard (or uses seeded teams)
- **Notification**: If webhook configured, email is sent with Team ID
- **Alternative**: Admin shares Team ID directly with players

#### 2. The Login (Event Start)

- **Action**: Enter Team ID (e.g., `Team-1`) and password (`123456`)
- **Constraint**: **Max 4 Devices** per team. If a 5th tries, oldest session is kicked.

#### 3. The Dashboard (The Compass)

- **Visual**: Giant level number (Current Protocol)
- **Clue**: Cryptic riddle pointing to next location
- **Action**: "INITIATE SCAN" button ready

#### 4. The Hunt (At Location)

- **Action**: Run to the location described in the hint
- **Find**: Locate the QR code posted at the physical location
- **Scan**: Click "INITIATE SCAN" → Point camera at QR code

#### 5. Scan & Reward

- **Success**:
  - **Keyword Found**: City name added to inventory (e.g., "BERLIN")
  - **Next Level**: Screen updates → Next protocol number
  - **Next Clue**: New riddle appears

---

### 👑 The Admin (The Overseer)

_The strategist. God Mode._

#### 1. Command Center

Login with `ADMIN-MAIN` and the password from setup.

- **Views**:
  - **Live Leaderboard**: Sorted by completed levels and time
  - **Level Drill-Down**: Filter by specific level to see who's stuck
  - **Team Management**: Add/Delete teams, view paths
  - **Location Management**: Edit hints and QR secrets

---

## 🧩 The Game Loop (The Engine)

### Security Protocols

1. **Sequential Locking**: Cannot scan QR #4 until QR #3 is scanned
2. **Location Validation**: QR must match the team's current target location
3. **Unique Paths**: Each team has a randomized sequence of 6 locations from pool of 12

---

## 🔐 The Bitlocker Finale (Level 7)

### The Climax

- **Collection**: Teams have collected 6 unique city keywords
- **The Final Hint**: Each team sees a **unique sorting challenge** (randomly assigned at creation)

### Challenge Types

| Type            | Instruction Example                |
| --------------- | ---------------------------------- |
| `ALPHA_ASC`     | "Arrange alphabetically (A → Z)"   |
| `ALPHA_DESC`    | "Arrange reverse (Z → A)"          |
| `LENGTH_ASC`    | "Arrange by length (short → long)" |
| `LENGTH_DESC`   | "Arrange by length (long → short)" |
| `SECOND_LETTER` | "Arrange by 2nd letter"            |
| `LAST_LETTER`   | "Arrange by last letter"           |

### The Final Steps

1. **Gather**: Team collects all their keywords
2. **Sort**: Arrange keywords based on their assigned challenge
3. **Input**: Type the sorted keywords joined with hyphens (e.g., `BERLIN-MOSCOW-RIO-...`)
   - _Ties allowed_: If two words have the same sort key, either order works
4. **Admin Override**: Submit `OVERRIDE-VICTORY` to bypass (for testing)
5. **Victory**: System validates → Mission Complete screen

---

## 🚀 Running a Simulation

### Quick Test Flow

1. **Start servers** (Backend + Frontend)
2. **Login as Admin**: `ADMIN-MAIN` with your saved password
3. **Note a Team ID**: e.g., `Team-1`
4. **Open new browser/incognito**: Login as `Team-1` / `123456`
5. **Play through**:
   - See hint → Find location on campus → Scan QR
   - Repeat for all 6 levels
   - Complete finale challenge

### Creating Custom Teams

Via Admin Dashboard:

1. Login as admin
2. Go to Team Management
3. Click "Add Team"
4. Fill in: Team Name, Email, Members, Password
5. Team can login immediately

---

## 🔑 Default Test Accounts

### Administrator

| Team ID      | Password               |
| ------------ | ---------------------- |
| `ADMIN-MAIN` | _(shown during setup)_ |

### Seeded Teams

| Team IDs              | Password | Status        |
| --------------------- | -------- | ------------- |
| `Team-1` to `Team-20` | `123456` | Ready to play |

> 💡 All seeded teams have randomized paths and finale challenges.

---

## 📍 Location Reference

See [RIDDLES_MASTER_LIST.md](./docs/RIDDLES_MASTER_LIST.md) for all 12 campus locations with their riddles and keywords.

---

## 🛠️ Troubleshooting

| Issue               | Solution                                          |
| ------------------- | ------------------------------------------------- |
| "Invalid QR Code"   | Team is at wrong location for their current level |
| Can't login         | Check Team ID spelling (case-sensitive)           |
| 5th device blocked  | One team member needs to logout                   |
| Finale wrong answer | Check the sorting challenge type carefully        |

---

## 📚 Related Docs

- [Architecture](./docs/ARCHITECTURE.md) - System design
- [API Documentation](./docs/openapi.yaml) - API specification
- [Riddles List](./docs/RIDDLES_MASTER_LIST.md) - All location hints

---

<p align="center">
  <sub>Created by <a href="https://www.linkedin.com/in/prasadbhalerao">Prasad Bhalerao</a></sub>
</p>
