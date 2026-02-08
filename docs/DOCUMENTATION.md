# 🏴‍☠️ BERLIN HEIST - System Documentation

> Complete technical documentation for the treasure hunt platform.

## 1. Database Structure

### **Team Model** (`Team.js`)

- **teamId**: String (Unique, e.g., "TITAN-X99")
- **name**: String
- **email**: String (Unique)
- **passwordHash**: String (Scrypt)
- **salt**: String
- **members**: [String]
- **role**: Enum ["CANDIDATE", "ADMIN"]
- **finaleChallenge**: Enum [ALPHA_ASC, ALPHA_DESC, LENGTH_ASC, LENGTH_DESC, SECOND_LETTER, LAST_LETTER]
- **path**: [Number] (Array of Location IDs, ordered sequence)
  - Length: 7 (Start + 6 Levels)
  - Index 0: Location 0 (Start)
  - Indices 1-6: Randomized Locations (1-12)
- **currentLevelIndex**: Number (Tracks progress in `path`)
  - 0 = At Start
  - 1 = Completed Start, looking for Path[1]
  - ...
  - 7 = Completed all levels
- **collectedKeywords**: [String]
- **lastLevelCompletedAt**: Date
- **levelHistory**: [{level: Number, completedAt: Date}]
- **activeSessions**: [String] (JWT session IDs, max 4)

### **Location Model** (`Location.js`)

- **locationId**: Number (0-12)
- **name**: String ("Location-0", "Location-1"...)
- **hint**: String (Text hint to find this location)
- **qrSecret**: String (Content of QR code)
- **keyword**: String ("Keyword-1"...)

---

## 2. Team Flow Logic

### **Levels & Progression**

- **Total Levels**: 6 (excluding Start)
- **Total Locations**: 12 (plus Start = 13)
- **Start**: All teams start at **Location-0** (Level 0).
- **Randomization**: Levels 1 to 6 are assigned unique, random locations from 1-12.
- **Hint Rule**: When on Level `N`, the user sees the hint for Level `N+1`.
  - e.g., At Start (Level 0), user sees hint for `path[1]`.
  - Upon scanning QR for `path[1]`, user advances to Level 1 and sees hint for `path[2]`.

### **Flow Example**

`Team-1`:
`Location-0` (Level 0) -> `Location-5` (Level 1) -> `Location-7` (Level 2) -> ...

---

## 3. QR & Keyword Validation

### **QR Codes**

- Generated for all 13 locations.
- Content: `SHORTCODE_RANDOMNUM` (e.g., `PHYLAB_839210`).
- Validation:
  - User scans QR.
  - System checks user's `currentLevelIndex`.
  - Target Location = `team.path[currentLevelIndex + 1]`.
  - If Scanned QR matches Target Location's Secret -> Success.
  - Else -> Invalid Location.

### **Keywords**

- Each location (1-12) has a unique **City Keyword** (e.g., `BERLIN`, `TOKYO`).
- Upon successful QR scan, the keyword is awarded to the Team.

---

## 4. Admin Workflows

### **User Management**

- **View**: Excel-style table listing all teams.
- **Add Team**: Modal form.
  - Fields: Name, Email, Members, Password.
  - **Trigger**: Calls Make.com Webhook with team details.
- **Delete**: Remove team and wipes progress.
- **Manage Flow**: Click "View Flow" on a team row to edit their path.

### **Location Management**

- List all 13 locations.
- Edit `Hint` and `QRSecret`.
- Updates reflect immediately for all players targeting that location.

## 5. Webhook Integration (Optional)

The system supports Make.com webhooks for sending team activation emails.

### Setup Guide

1. Create a [Make.com](https://make.com) account
2. Create a new scenario with "Webhooks" → "Custom webhook" as trigger
3. Add an "Email" action module to send team credentials
4. Copy the webhook URL to your `.env` file:
   ```ini
   MAKE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_WEBHOOK_ID
   ```

### Webhook Payload

When a team is created, the following payload is sent:

```json
{
  "teamId": "TITAN-X99",
  "name": "Titans",
  "email": "leader@titans.com",
  "to": "leader@titans.com",
  "members": ["A", "B"],
  "password": "...",
  "pathAsString": "0->5->12..."
}
```

> **Note**: If `MAKE_WEBHOOK_URL` is not set, teams can still be created—emails just won't be sent automatically. Use the seeding scripts to create teams without webhooks.

## 6. Game Progression

### **State Machine**

1. **Login** -> Dashboard shows Level 0, Hint for Location 1
2. **Scan QR at Location 1** -> Keyword collected, Level advances to 1
3. **Dashboard updates** -> Shows Level 1, Hint for Location 2
4. **Repeat** -> Until Level 6 completed
5. **Finale** -> Submit sorted keywords

### **Finale Logic**

**Randomized Challenges**: Each team is assigned one of 6 sorting challenges at creation:

| Type            | Rule                   |
| --------------- | ---------------------- |
| `ALPHA_ASC`     | Alphabetical A → Z     |
| `ALPHA_DESC`    | Reverse Z → A          |
| `LENGTH_ASC`    | Shortest word first    |
| `LENGTH_DESC`   | Longest word first     |
| `SECOND_LETTER` | Sort by 2nd character  |
| `LAST_LETTER`   | Sort by last character |

**Ties Allowed**: If two words have the same key, either order is valid.

**Admin Override**: Submit `OVERRIDE-VICTORY` to bypass validation.

- Success → `currentLevelIndex = 7` (COMPLETED)
