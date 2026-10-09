# Admin Runbook: Event Day

## Before the event

- [ ] `npm run setup:quick` (or `setup:all` for demo teams) against the **production** database.
- [ ] Admin → **Settings**: check name, levels (5), attempts, cooldown, penalty. Leave status `DRAFT`.
- [ ] Admin → **Question Bank**: 60 active questions, at least as many as the levels needed. Skim for typos.
- [ ] Admin → **Locations**: check every hint. Stick each printed QR at its location (on sturdy paper).
- [ ] Print the 9 location QR codes (A4, 4 per page) from `TraceRoute_QR_Codes.pdf`, or from **Admin → Locations → Print all QRs**. They are deliberately not hosted on the public site.
- [ ] **Start QR:** do not print it. Show the 16:9 slide `TraceRoute_Start_QR.png` (or `.pdf`) fullscreen on the smartboard at the starting place. Regenerate with `npm run generate:start` after any change to the Start secret.
- [ ] Scan every QR with a phone once to confirm it reads the right text.
- [ ] Create the real teams (**Admin → User Management → Add**: team name, **team lead email**, password). Each team lead is emailed the login through Make.com (see [EMAIL_TEMPLATE.md](EMAIL_TEMPLATE.md)). If the admin shows "email NOT sent", share the credentials manually.
- [ ] Run the [simulation guide](../simulation_guide.md) with 2 test teams, then **Reset team** on both.
- [ ] Set status to `LIVE` when the event starts.

## During the event

| Situation | What to do |
| :-- | :-- |
| Team stuck: "Locked, ask an organiser" | Game Flow → pick the team → **Unlock level** |
| A QR was damaged or stolen | Locations → **New secret** → print and replace the QR (old one stops working) |
| Team lost its phone or credentials | Login on a new device works. Max 4 devices, the 5th ejects the oldest |
| Team physically cannot reach a location | Game Flow → **Force-complete level** (no penalty, no explanation shown) |
| A question has a mistake | Question Bank → edit (or disable). New edits apply to future views |
| Need to pause everyone | Settings → status `DRAFT`. Players see "event has not started" |
| Team wants to start over | Game Flow → **Reset team** (new route and questions, penalties cleared) |
| Add a question mid-event | Question Bank → Add. It is used for new teams and swaps only |

## After the event

- Settings → status `ENDED`.
- Dashboard → **CSV** to download final standings (rank, time, penalties, attempts).
- Final time = elapsed time from the Start scan to the Mega Puzzle, plus penalty seconds. Tie-break: fewer attempts, then earlier finish.
- Optional: `npm run db:wipe` before the next event.
