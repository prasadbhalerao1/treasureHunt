# TreasureHunt State Machine Diagram

> System-level view of all state transitions across Frontend and Backend

---

## 1. System Overview

The TreasureHunt application is a multiplayer QR-code-based treasure hunt game with:

- **2 User Roles**: `CANDIDATE` (players) and `ADMIN` (game masters)
- **7 Game Levels**: Path of 7 locations (Start + 6 random locations)
- **Finale**: BitLocker decryption puzzle using collected keywords

---

## 2. Authentication State Machine

```mermaid
stateDiagram-v2
    direction LR

    [*] --> Unauthenticated

    Unauthenticated --> Authenticating : Submit Credentials
    Authenticating --> Authenticated_Admin : Success (role=ADMIN)
    Authenticating --> Authenticated_Candidate : Success (role=CANDIDATE)
    Authenticating --> Unauthenticated : Invalid Credentials

    Authenticated_Admin --> AdminDashboard : Navigate /admin
    Authenticated_Candidate --> PlayerDashboard : Navigate /dashboard

    Authenticated_Admin --> Unauthenticated : Logout
    Authenticated_Candidate --> Unauthenticated : Logout
    Authenticated_Admin --> Unauthenticated : Token Expired (12h)
    Authenticated_Candidate --> Unauthenticated : Token Expired (12h)
```

### Auth Flow Details

| Transition                       | Trigger                 | Backend Action                  | Frontend Action             |
| -------------------------------- | ----------------------- | ------------------------------- | --------------------------- |
| Unauthenticated → Authenticating | Form Submit             | `POST /auth/login`              | Show Loader                 |
| Authenticating → Authenticated   | Valid teamId + password | Generate JWT (12h), add session | Store token in localStorage |
| Authenticating → Unauthenticated | Invalid credentials     | Return 401                      | Show error message          |
| Authenticated → Unauthenticated  | Logout button           | -                               | Clear localStorage, reload  |

### Session Management

- Max 4 concurrent sessions per team (FIFO eviction)
- Sessions tracked via `activeSessions[]` containing JWT IDs (`jti`)

---

## 3. Game Progression State Machine (Core)

This is the primary state machine tracking a team's progress through the treasure hunt.

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Registered

    state "currentLevelIndex = -1" as Registered
    state "currentLevelIndex = 0" as Level0
    state "currentLevelIndex = 1" as Level1
    state "currentLevelIndex = 2" as Level2
    state "currentLevelIndex = 3" as Level3
    state "currentLevelIndex = 4" as Level4
    state "currentLevelIndex = 5" as Level5
    state "currentLevelIndex = 6 (FINALE)" as Finale
    state "currentLevelIndex ≥ 7 (COMPLETED)" as Completed

    Registered --> Level0 : Scan Start QR (Location 0)
    Level0 --> Level1 : Scan QR at path[1]
    Level1 --> Level2 : Scan QR at path[2]
    Level2 --> Level3 : Scan QR at path[3]
    Level3 --> Level4 : Scan QR at path[4]
    Level4 --> Level5 : Scan QR at path[5]
    Level5 --> Finale : Scan QR at path[6]
    Finale --> Completed : Submit correct answer

    note right of Registered : Team created via Admin<br/>Path assigned: (0, x, x, x, x, x, x)
    note right of Finale : BitLocker puzzle<br/>Arrange keywords alphabetically
    note right of Completed : Game Over<br/>Victory screen shown
```

### Level Progression Details

| Level Index | Status        | What Team Sees              | Required Action                       |
| ----------- | ------------- | --------------------------- | ------------------------------------- |
| `-1`        | REGISTERED    | Hint for Location 0 (Start) | Scan Start QR                         |
| `0`         | HINT_UNLOCKED | Hint for `path[1]`          | Scan QR at `path[1]`                  |
| `1`         | HINT_UNLOCKED | Hint for `path[2]`          | Scan QR at `path[2]`                  |
| `2`         | HINT_UNLOCKED | Hint for `path[3]`          | Scan QR at `path[3]`                  |
| `3`         | HINT_UNLOCKED | Hint for `path[4]`          | Scan QR at `path[4]`                  |
| `4`         | HINT_UNLOCKED | Hint for `path[5]`          | Scan QR at `path[5]`                  |
| `5`         | HINT_UNLOCKED | Hint for `path[6]`          | Scan QR at `path[6]`                  |
| `6`         | FINALE        | BitLocker UI + Keywords     | Submit alphabetically sorted keywords |
| `≥7`        | COMPLETED     | Victory Screen              | None (Game Over)                      |

---

## 4. QR Scan Flow State Machine

```mermaid
stateDiagram-v2
    direction LR

    [*] --> Idle

    Idle --> Scanning : Click "INITIATE SCAN"
    Scanning --> Validating : QR Detected
    Scanning --> Idle : Click "ABORT SCAN"

    Validating --> Success : qrString === targetLocation.qrSecret
    Validating --> Failed : qrString !== targetLocation.qrSecret

    Success --> Idle : Show keyword, advance level
    Failed --> Idle : Show "Wrong Location" error

    note right of Validating : Backend validates against<br/>path(currentLevelIndex + 1)
```

### QR Scan API Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant DB as MongoDB

    FE->>BE: POST /game/scan { qrString }
    BE->>DB: Find team by JWT.id

    alt Team not found
        BE-->>FE: 404 "Team not found"
    end

    BE->>BE: Calculate nextIndex = currentLevelIndex + 1

    alt Already completed (nextIndex >= path.length)
        BE-->>FE: 200 "Game Already Completed"
    end

    BE->>DB: Find Location by path[nextIndex]

    alt QR matches target
        BE->>DB: Update team (advance level, add keyword, push history)
        BE-->>FE: 200 { keyword, nextLevel, nextHint }
    else QR doesn't match
        BE-->>FE: 400 "Invalid QR Code. Wrong Location?"
    end
```

---

## 5. Finale (BitLocker) State Machine

```mermaid
stateDiagram-v2
    direction TB

    [*] --> ShowingKeywords

    state "Finale UI Active" as ShowingKeywords
    state "Validating Answer" as Validating
    state "COMPLETED" as Victory

    ShowingKeywords --> Validating : Submit answer

    Validating --> ShowingKeywords : Incorrect sequence
    Validating --> Victory : Correct sequence OR "OVERRIDE-VICTORY"

    note right of ShowingKeywords : Display all collected keywords<br/>(excluding "START")<br/>User must arrange alphabetically
    note right of Victory : currentLevelIndex = path.length + 1 (8)
```

### Answer Validation Logic

```javascript
// Expected answer computation (Backend)
const expected = team.collectedKeywords
  .map((k) => k.trim().toUpperCase())
  .filter((k) => k !== "START") // Exclude START keyword
  .sort() // Alphabetical order
  .join("-"); // Hyphen-separated

// Example: If keywords are ["RIO", "ALICIA", "BERLIN", "START"]
// Expected = "ALICIA-BERLIN-RIO"
```

---

## 6. Admin Operations State Machine

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Dashboard

    state AdminPanel {
        Dashboard --> UserManagement : Click "User Management"
        Dashboard --> FlowManagement : Click "Game Flow"
        Dashboard --> LocationManagement : Click "Locations"

        UserManagement --> Dashboard : Switch tab
        FlowManagement --> Dashboard : Switch tab
        LocationManagement --> Dashboard : Switch tab

        UserManagement --> FlowManagement : Click "Manage Flow" on team
    }
```

### Admin Actions and Their Effects

| Action           | API Endpoint                | State Change                                         |
| ---------------- | --------------------------- | ---------------------------------------------------- |
| Create Team      | `POST /admin/teams`         | New team with `currentLevelIndex: -1`, random `path` |
| Delete Team      | `DELETE /admin/teams/:id`   | Team removed from DB                                 |
| Update Team Path | `PUT /admin/teams/:id/path` | Team's `path[]` modified                             |
| Update Location  | `PUT /admin/locations/:id`  | Location's `hint` or `qrSecret` changed              |
| View Stats       | `GET /admin/stats?level=X`  | No state change (read-only)                          |

---

## 7. Frontend UI State Machine

```mermaid
stateDiagram-v2
    direction TB

    [*] --> Loading

    Loading --> LoginPage : No token in localStorage
    Loading --> RoleRedirect : Token exists

    RoleRedirect --> AdminPage : user.role === "ADMIN"
    RoleRedirect --> DashboardPage : user.role === "CANDIDATE"

    state DashboardPage {
        [*] --> FetchingGameState
        FetchingGameState --> StandardLevelUI : level < 7
        FetchingGameState --> FinaleUI : level === 7
        FetchingGameState --> VictoryScreen : level > 7 OR status === "COMPLETED"
        FetchingGameState --> ErrorState : API Error

        StandardLevelUI --> ScannerOverlay : Click "INITIATE SCAN"
        ScannerOverlay --> StandardLevelUI : Scan complete OR abort
    }

    state AdminPage {
        [*] --> DashboardTab
        DashboardTab --> UsersTab : Click tab
        DashboardTab --> FlowTab : Click tab
        DashboardTab --> LocationsTab : Click tab
        UsersTab --> DashboardTab : Click tab
        FlowTab --> DashboardTab : Click tab
        LocationsTab --> DashboardTab : Click tab
    }
```

---

## 8. Data Flow Summary

```mermaid
flowchart TB
    subgraph Frontend
        Login[Login Page]
        Dashboard[Dashboard]
        Admin[Admin Panel]
        Scanner[QR Scanner]
    end

    subgraph Backend
        AuthC[authController]
        GameC[gameController]
        AdminC[adminController]
        TeamSvc[teamService]
    end

    subgraph Database
        TeamModel[(Team)]
        LocationModel[(Location)]
    end

    Login -->|POST /auth/login| AuthC
    AuthC -->|Verify & JWT| TeamModel

    Dashboard -->|GET /game/state| GameC
    Scanner -->|POST /game/scan| GameC
    Dashboard -->|POST /game/submit| GameC
    GameC -->|Read/Update| TeamModel
    GameC -->|Read hints| LocationModel

    Admin -->|CRUD| AdminC
    AdminC -->|Manage| TeamModel
    AdminC -->|Manage| LocationModel
    AdminC -->|Create Team| TeamSvc
```

---

## 9. Edge Cases & Potential Issues

### ⚠️ Identified Edge Cases

| Edge Case                             | Current Behavior                                                     | Potential Issue                             |
| ------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| Scan same QR twice                    | Returns "Game Already Completed" if at end, otherwise allows re-scan | ✅ Handled - duplicate keyword check exists |
| Submit finale before reaching level 6 | Returns 400 "Not authorized for finale decryption"                   | ✅ Handled                                  |
| Multiple users on same team           | FIFO session management (max 4)                                      | ✅ Handled                                  |
| Invalid JWT                           | 401 from middleware                                                  | ✅ Handled                                  |
| Missing location data                 | Returns 500 "Target Location Data Missing"                           | ⚠️ Should log more details                  |
| Empty keywords array at finale        | Will produce empty expected answer                                   | ⚠️ May need validation                      |

### 🔍 State Transition Gaps to Review

1. **No backward progression**: Once a level is completed, there's no mechanism to undo (intentional)
2. **No timeout/penalty**: Game has no time limits or penalties for wrong scans
3. **OVERRIDE-VICTORY**: Backdoor exists in finale validation - security concern?
4. **Session invalidation**: Old sessions aren't explicitly invalidated on logout

---

## 10. Quick Reference: All States

| Component         | State Variable      | Possible Values                           |
| ----------------- | ------------------- | ----------------------------------------- |
| **Auth**          | `user`              | `null`, `{ teamId, name, role, level }`   |
| **Game Progress** | `currentLevelIndex` | `-1` to `8+`                              |
| **Game Status**   | `status`            | `HINT_UNLOCKED`, `FINALE`, `COMPLETED`    |
| **User Role**     | `role`              | `CANDIDATE`, `ADMIN`                      |
| **Dashboard UI**  | `scanMode`          | `true`, `false`                           |
| **Admin UI**      | `activeTab`         | `dashboard`, `users`, `flow`, `locations` |
