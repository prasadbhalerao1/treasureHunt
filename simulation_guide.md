# 🏴‍☠️ TreasureHunt: The Final Simulation Guide

## 🎭 The Player Experience

### 🕵️ The Candidate (The Player)

_The hero of the story. High-stress, fast-paced, mobile-first._

#### 1. The Hook (Pre-Game)

- **Trigger**: **Admin creates team** via Dashboard.
- **Notification**: **EMAIL RECEIVED** from "TreasureHunt HQ" (via Webhook).
- **Content**: "MISSION BRIEFING - Status: ACTIVATED. Your Team ID is **TITAN-X99**."

#### 2. The Login (Event Start)

- **Action**: Enter `TITAN-X99` and password.
- **Constraint**: **Max 4 Devices**. If a 5th tries, they see "Access Denied: Logout someone first."

#### 3. The Dashboard (The Compass)

- **Visual**: Giant "01" (Current Level).
- **Clue**: Cryptic riddle pointing to **Location 1**.
- **Action**: "SCAN QR" button ready.

#### 4. The Hunt (At Location)

- **Action**: Run to the location described in the hint.
- **Find**: Locate the QR code posted at the physical location.
- **Scan**: Click "SCAN QR" → Scan the code.

#### 5. Scan & Reward

- **Success**:
  - **Keyword Found**: "PROFESSOR" (Saved to inventory).
  - **Next Level**: Screen wipes → "02".
  - **Next Clue**: New riddle appears.

---

### 👑 The Admin (The Overseer)

_The strategist. God Mode._

#### 1. Command Center

- **Views**:
  - **Live Leaderboard**: Sorted by completed levels.
  - **Level Drill-Down**: See who is stuck on Level 4.
  - **Team Management**: Add/Delete teams, manage paths.
  - **Location Management**: Edit hints and QR secrets.

---

## 🧩 The Game Loop (The Engine)

### Security Protocols

1.  **Sequential Locking**: Cannot scan QR #4 until QR #3 is scanned.
2.  **Location Validation**: QR must match the team's current target location.
3.  **Unique Paths**: Each team has a randomized sequence of 6 locations.

---

## 🔐 The Bitlocker Finale (Level 7)

### The Climax

- **Collection**: Teams have collected 6 keywords (PROFESSOR, BERLIN, HEIST, MINT, TOKYO, PLAN).
- **The Final Hint**: "The password is the sequence. Arrange in alphabetical order."

### The Description

1.  **Run**: Team runs to final location.
2.  **Input**: Type the phrase: `BERLIN-HEIST-MINT-PLAN-PROFESSOR-TOKYO`.
3.  **Victory**:
    - System checks hash.
    - **Confetti Animation**.
    - Final Time Logged.

---

## 🚀 Running the Simulation

1.  **Create a Team**: Login as **Admin** (`ADMIN-MAIN`) → Click **"Add Team"**.
    - _No public registration!_ All teams are created by Admin.
    - _Check Email_: Get the Team ID from your inbox (via Webhook) or look at the Admin Table.
2.  **Login**: Use the generated Team ID.
3.  **Play Level 1**:
    - As **Candidate**: See the hint, find the location, scan the QR code.
4.  **Repeat**: Until Level 6.
5.  **Win**: Enter the final sequence.

---

## 🔑 Ready-to-Use Test Accounts

### Administrators

- **Main**: `ADMIN-MAIN` (Password: `adminpassword123`)
- **Backup**: `ADMIN-BACKUP` (Password: `adminpassword456`)

### Testing Teams

Create teams via Admin Dashboard - no pre-seeded teams exist.
