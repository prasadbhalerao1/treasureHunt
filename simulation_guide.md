# 🏴‍☠️ TreasureHunt: The Final Simulation Guide

## 📱 Mobile Configuration (CRITICAL)

**Before starting the simulation:**

1.  **Find your PC's IP Address**: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux). Look for IPv4 Address (e.g., `192.168.1.5`).
2.  **Update Frontend Config**: Open `Frontend/.env` and set `VITE_API_URL=http://<YOUR_IP>:5000/api`.
3.  **Connect Mobile**: Ensure your phone is on the **SAME Wi-Fi** as your PC.
4.  **Access App**: Open Chrome on your phone and go to `http://<YOUR_IP>:5173`.

---

## 🎭 Part 1: The Role-Based User Experience

### 🕵️ Role 1: The Candidate (The Player)

_The hero of the story. High-stress, fast-paced, mobile-first._

#### 1. The Hook (Pre-Game)

- **Trigger**: Team Leader registers 2 days prior.
- **Notification**: **EMAIL RECEIVED** from "TreasureHunt HQ".
- **Content**: "MISSION BRIEFING - Status: ACTIVATED. Your Team ID is **TITAN-X99**."

#### 2. The Login (Event Start)

- **Action**: Enter `TITAN-X99` and password.
- **Constraint**: **Max 3 Devices**. If a 4th tries, they see "Access Denied: Logout someone first."

#### 3. The Dashboard (The Compass)

- **Visual**: Giant "01" (Current Level).
- **Clue**: Cryptic ridde pointing to **Location 1**.
- **Status**: 🔒 **LOCKED**. "Find Volunteer to unlock scanner."

#### 4. The Interaction (At Location)

- **Action**: Run to Clock Tower -> Find Volunteer.
- **Show**: Show Phone Dashboard to Volunteer.
- **Wait**: Volunteer verifies.
- **Feedback**: Phone vibrates (simulated). Status changes to **SCAN QR**.

#### 5. Scan & Reward

- **Action**: Click "SCAN QR" -> Scan printed code on wall.
- **Success**:
  - **Keyword Found**: "PROFESSOR" (Saved to inventory).
  - **Next Level**: Screen wipes -> "02".
  - **Next Clue**: New riddle appears.

---

### 🛡️ Role 2: The Volunteer (The Gatekeeper)

_The enforcer. Interface is simple, fast, binary._

#### 1. The Verification Flow

- **Scenario**: Team TITAN runs up. "We're Team Titan!"
- **Action**: Volunteer types `TIT` in search bar -> Selects `TITAN-X99`.
- **System Logic**:
  - 🟢 **READY TO VERIFY**: Team is on Level 1, Volunteer is at Level 1 location (Simulated). -> **Click Verify**.
  - 🔴 **WRONG LOCATION**: Team is on Level 1, but at Level 3 station. -> **Reject**.
  - 🔵 **ALREADY VERIFIED**: Team already passed this step. -> **Ignore**.

---

### 👑 Role 3: The Admin (The Overseer)

_The strategist. God Mode._

#### 1. Command Center

- **Views**:
  - **Live Leaderboard**: Sorted by completed levels.
  - **Level Drill-Down**: See who is stuck on Level 4.
- **Emergency Controls**:
  - **Manual Override**: Click "Pass Level" if a team's phone dies or QR is missing.

---

## 🧩 Part 2: The Game Loop (The Engine)

### Security Protocols

1.  **Sequential Locking**: Cannot scan QR #4 until verified for Level #4.
2.  **Triangulation**:
    - Signal A: Volunteer Verification (Physical Presence).
    - Signal B: QR Scan (Found the Code).
    - _Both are required to proceed._

---

## 🔐 Part 3: The Bitlocker Finale (Level 7)

### The Climax

- **Collection**: Teams have collected 6 keywords (PROFESSOR, BERLIN, HEIST, MINT, TOKYO, PLAN).
- **The Final Hint**: "The password is the sequence. Arrange in alphabetical order."

### The Description

1.  **Run**: Team runs to Auditorium (Level 7).
2.  **Input**: Type the phrase: `BERLIN-HEIST-MINT-PLAN-PROFESSOR-TOKYO`.
3.  **Victory**:
    - System checks hash.
    - **Confetti Animation**.
    - Final Time Logged.

---

## 🚀 Running the Simulation

1.  **Register a Team**: Use the Registration page.
    - _No annoying popup!_ Watch for the **Green Mission Briefing** banner.
    - _Check Email_: Get the Team ID from your inbox (or console logs).
2.  **Login**: Use the generated Team ID.
3.  **Play Level 1**:
    - As **Volunteer**: Verify the team.
    - As **Candidate**: Scan the generated QR code (found in `public/qr_codes` or displayed on screen if testing).
4.  **Repeat**: Until Level 7.
5.  **Win**: Enter the final sequence.

---

## 🔑 Ready-to-Use Test Accounts

### Administrators

- **Main**: `ADMIN-MAIN` (Password: `adminpassword123`)
- **Backup**: `ADMIN-BACKUP` (Password: `adminpassword456`)

### Volunteers (10 Stations)

- **Password**: `volunteerpassword123`
- **IDs**: `VOLUNTEER-1` to `VOLUNTEER-10`
