# TraceRoute: Game Documentation

## 1. Rules in one page

- **Teams** log in with a Team ID and password.
- The event has **N levels** (default **7**) and a **Mega Puzzle**. N is `totalLevels` in Settings.
- A team's route is the **Start** plus N locations drawn from the location list, in a team-specific order, balanced so locations are used evenly.
- Each team has **N assigned questions**, one per level, drawn from the question bank (distinct within a team, difficulty ramping from easy to hard, least-used first). Option order is shuffled per team.
- **Winner:** least `elapsed time + penalty seconds`. Tie-break: fewer total attempts, then earlier finish.

## 2. Flow per team

| Step | Player action | Server effect |
| :-- | :-- | :-- |
| Not started | Scan the **Start** QR | Starts the clock (level 0), reveals the hint for hop 1 |
| Hop *k* (1…N) | Go to the hinted location, scan its QR | Opens challenge *k* (first view timestamp is stored once; re-scan is harmless) |
| | Pick an option, **Send packet** | Correct: level *k* is done, hint for hop *k+1* is revealed (or the Mega Puzzle opens after hop N). Wrong: penalty plus cooldown |
| Mega Puzzle | Tap the collected hop codes in the required order | Correct: the clock stops. Wrong: penalty, and a 30 s lock after every third miss |

Scanning a QR out of order is rejected. Only the QR for the team's *next* location opens anything.

### Wrong answers

Controlled by Settings:

| Setting | Default | Meaning |
| :-- | :-- | :-- |
| `maxAttemptsPerQuestion` | 3 | Tries before the out-of-attempts rule applies |
| `wrongAnswerCooldownSeconds` | 20 | Wait before the next try |
| `wrongAnswerTimePenaltySeconds` | 30 | Added to the final time on every wrong answer |
| `outOfAttemptsAction` | `SWAP_QUESTION` | Give a new question plus an **extra** penalty, or `LOCK_UNTIL_ADMIN` |

### Mega Puzzle

Each location has a **hop code** (ROUTER, GATEWAY, SWITCH…). Solving a hop awards its code. In the finale the team sees its codes and a personal rule, one of: alphabetical (A→Z or Z→A), by length (short→long or long→short), by second letter, by last letter. Ties are accepted in any order. The team taps the codes into the right sequence.

To use a different finale, change `utils/finale.js` (rules) and `FinalePanel.jsx` (UI). `isValidOrder` is unit-tested.

## 3. Level and state values

`Team.currentLevelIndex`:

| Value | Meaning |
| :-- | :-- |
| `-1` | Registered, Start QR not scanned |
| `0` | Start scanned, looking for hop 1 |
| `k` | Hop *k* solved |
| `N` (= `path.length - 1`) | All hops solved, **Mega Puzzle open** |
| `path.length + 1` | Mega Puzzle solved, finished |

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
