# TraceRoute: Game Documentation

## 1. Rules in one page

- **Teams** log in with a Team ID and password.
- The event has **N question levels** (default **6**) and a final challenge. N is `totalLevels` in Settings.
- A team's route is the **Start** plus N locations drawn from the location list, in a team-specific order, balanced so locations are used evenly.
- Each team has **N assigned questions**, one per level, drawn from the question bank (distinct within a team, difficulty ramping from easy to hard, least-used first). Option order is shuffled per team.
- **Winner:** least `elapsed time + penalty seconds`. Tie-break: fewer total attempts, then earlier finish.

## 2. Flow per team

```
scan START QR -> question 1 -> riddle for location 1
scan L1 QR    -> question 2 -> riddle for location 2
...
scan L5 QR    -> question 6 -> riddle for location 6
scan L6 QR    -> final challenge (a single button for now)
```

| Step | Player action | Server effect |
| :-- | :-- | :-- |
| Not started | Scan the **Start** QR | Starts the clock and opens question 1 |
| Question *k* | Pick an option | Correct: reveals the riddle for location *k*. Wrong: penalty plus cooldown |
| Walking | Go to the place the riddle describes, scan its QR | Opens question *k+1* |
| Last location | Scan its QR | Unlocks the final challenge |
| Final | Press the button | Stops the clock (the real puzzle lands here later) |

Scanning a QR out of order is rejected: only the QR for the team's *current* location does anything.

### Wrong answers

Controlled by Settings:

| Setting | Default | Meaning |
| :-- | :-- | :-- |
| `maxAttemptsPerQuestion` | 3 | Tries before the out-of-attempts rule applies |
| `wrongAnswerCooldownSeconds` | 20 | Wait before the next try |
| `wrongAnswerTimePenaltySeconds` | 30 | Added to the final time on every wrong answer |
| `outOfAttemptsAction` | `SWAP_QUESTION` | Give a new question plus an **extra** penalty, or `LOCK_UNTIL_ADMIN` |

### Final challenge

For now it is a single button that stops the clock. The real puzzle will be built later; it lives in `submitAnswer` (`controllers/gameController.js`) and `FinalePanel.jsx`.

## 3. Level and state values

`Team.currentLevelIndex`:

| Value | Meaning |
| :-- | :-- |
| `-1` | Registered, Start QR not scanned |
| `0` | Start QR scanned, question 1 open |
| `k` | Question *k* solved; walking to location *k* |
| `path.length` | All questions solved and the last QR scanned: **final challenge** |
| `path.length + 1` | Finished |

API status values: `NOT_STARTED`, `HINT_UNLOCKED`, `CHALLENGE_OPEN`, `FINALE`, `COMPLETED`.

## 4. Admin dashboard

| Tab | Purpose |
| :-- | :-- |
| Dashboard | Leaderboard (time, penalties, status), per-level fastest teams, distribution chart, CSV export. Polls every 10 s |
| User Management | Create / delete teams. A team is a name, the **team lead's email** and a password; the login is emailed to the lead via the Make.com webhook |
| Game Flow | View or edit a team's path before it starts. **Unlock level**, **Force-complete level**, **Reshuffle questions**, **Reset team**, per-level challenge table with answers (organiser-only) |
| Locations | Add / edit / delete locations, hop codes and hints, regenerate a QR secret, download one QR or print all |
| Question Bank | Search, add, edit, enable / disable, delete, import / export JSON. Shows active questions against the number needed |
| Settings | Event name, tagline, levels, attempts, cooldown, penalty, out-of-attempts rule, event status |

**Event status:** `DRAFT` and `ENDED` block players from scanning and answering. Admins can always test. Switch to `LIVE` to start.

## 5. Security notes

- `correctKey` and `explanation` never reach a team before the question is solved. After solving, only the explanation is sent.
- Scan, answer and Mega Puzzle updates are atomic (`findOneAndUpdate` with preconditions), so double taps cannot advance two levels.
- Sessions: a JWT carries a session id. At most 4 devices per team; a 5th login ejects the oldest. A removed session is rejected on the next request.
- Rate limits: 120 requests/min per token, 30 logins/min per IP, 30 answers/min per token.
- Login lookups escape user input (no regex injection).

## 6. Make.com webhook (optional)

If `MAKE_WEBHOOK_URL` is set, creating a team in the admin POSTs `{teamId, name, email, to, password, eventName, tagline, totalLevels, loginUrl, subject}` so a Make scenario can email the credentials.

## 7. Printing the QR codes

- **Locations 1-12:** `npm run generate:qr` then `npm run generate:printable` builds an A4 sheet (4 QR per page, white cards with the location name). Print it from Chrome (A4, margins none).
- **Start:** `npm run generate:start` builds a 16:9 slide (1920x1080) with only the Start QR, to project on the smartboard at the starting place. Export it to PDF or PNG from Chrome.
- Both files are gitignored and never deployed, because the QR codes are secrets.
