# TraceRoute: Simulation Guide

A full dry run before the event, using the demo data. About 15 minutes.

## 1. Set up a scratch database

Use a **separate** database name in `Backend/.env`, for example `.../traceroute_test?...`.

```bash
cd Backend
ADMIN_PASSWORD=sim-admin-123 npm run setup:all
cd ../Frontend && npm run dev     # and in another terminal: cd Backend && npm run dev
```

You now have: Start + 12 locations, 60 questions, `Team-1`…`Team-20` (password `123456`) and `ADMIN-MAIN` (your `ADMIN_PASSWORD`). QR codes are in `Frontend/public/qr_codes/` and `Frontend/public/print_qrs.html`.

## 2. Play one team end to end

1. Open <http://localhost:5173> on a phone (camera needs HTTPS or localhost; on a phone use your Vercel preview or a tunnel).
2. Log in as `Team-1` / `123456`. Screen shows **Hop 00/07** and "scan the Start QR".
3. Scan `00_Location-0_Start.png` (show it on your laptop screen). The timer starts and a hint appears.
4. In **Admin → Game Flow → Team 1** you can see the route and each level's question *and answer* (organiser view).
5. Scan the QR for the hinted location (`NN_…png`). A question opens.
6. Answer **wrongly** once: expect "+30s penalty", "Retry in 20s", attempts left 2.
7. Answer correctly: "Packet delivered", the explanation, and the next hint.
8. Repeat for all 7 hops. After hop 7 the **Mega Puzzle** opens.
9. Tap the hop codes in the order the rule asks. A wrong order adds a penalty. A correct one shows the final time.

## 3. Edge cases to try

| Test | Expected |
| :-- | :-- |
| Scan the wrong location's QR | "Invalid QR Code. Wrong Location?" |
| Scan the right QR twice | Same question, no new attempt used |
| Refresh the page or log in on a second phone mid-question | Same question and cooldown |
| Wrong answer 3 times | New question + extra penalty (or lock, depending on Settings) |
| Settings → status `DRAFT` | Players get "event has not started" |
| Admin → **Unlock level** while a team is cooling down | Team can answer immediately |
| Admin → **Reset team** | Team back at hop 0 with new route and questions |
| Settings → `totalLevels` = 4, then create a new team | New team has 4 hops; existing teams are unchanged |

## 4. Check the admin

- **Dashboard:** your finished team is at the top with time and penalties. **CSV** downloads the standings.
- **Question Bank:** disable a question and confirm the active count drops.
- **Locations:** **Print all QRs** opens a print-ready sheet.

## 5. Clean up

Point `.env` back at the production database, run `npm run setup:quick` (or `seed:event` if you restore known teams), and set the event status to `DRAFT` until you are ready.
