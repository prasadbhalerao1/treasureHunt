# Locations & Riddles

These are the **original riddles from the previous event**, restored byte-for-byte from `Backend/local_backup_1770292572869.json`. Do not reword them. They are seeded by `Backend/scripts/seedLocations.js` (data in `Backend/data/locations.js`) and can be edited live in **Admin → Locations**.

A riddle is shown to a team **after it answers the question correctly**, and points to the location whose QR they must scan next. Location `0` is the Start; its QR is projected on the smartboard. QR secrets are random and are not listed here.

**9 locations are in play. Each team visits 5 of them**, in its own order, so all 9 QR codes must be up at the venue.

| ID | Location | Riddle |
| :-: | :-- | :-- |
| 1 | Food Court – Dosa Wala | A common ground for every branch, where hunger makes alliances. From there, track fermentation’s reward, served flat, folded, and warm. |
| 2 | Jaywant Library | Victory’s temple holds the scrolls, where whispers die and silence patrols. The guardian named for triumph’s call— knowledge sleeps behind these walls. |
| 3 | CSBS Department | Not only programmers, not only managers — this is where tech meets business. |
| 4 | FY Department | Where rookies shed their school-day skin, engineers take first steps within. Beginnings live on every page— the launchpad of the college stage. |
| 5 | Stationery Store (Food Court) | Among the edible, find what’s not— ink and paper, bound and bought. Where mistakes retreat with grace, and answers get a cleaner face. |
| 6 | Xerox Shop | Where singularity becomes a crowd, faded notes grow crisp and loud. One idea enters, multiplied— clarity printed side by side. |
| 7 | Mac Lab | 🍎 ➡️ 💻 ➡️ 🚪 Silver screens in silent rows, where designs and deadlines go. Mouse and keys work side by side, your next answer waits inside. |
| 8 | Counselling Centre | A strong mind wins every heist. When fear rises, climb the steps. Behind the door where hearts heal, your next secret waits. |
| 9 | Student Section | Where dreams queue up in paper form, and patience beats the brightest norm. No classes here, just forms to sign— where student requests wait in line. |

Removed before this event: Cafeteria, Bus Parking (Behind Cafeteria), Physics Lab.

## Flow

```
scan START QR -> question 1 -> riddle for location 1
scan L1 QR    -> question 2 -> riddle for location 2
...
scan L4 QR    -> question 5 -> riddle for location 5
scan L5 QR    -> final challenge (one button for now)
```

Five questions, five locations after the Start. Each team gets its own order of locations and its own five questions.

## Adding or removing a location

Edit `Backend/data/locations.js` and run `npm run seed:locations`. **Existing QR secrets are kept**, so printed codes stay valid; only new locations get a new secret. Pass `-- --new-secrets` to rotate them all (then reprint everything). Then run `npm run generate:qr`, `generate:printable` and `generate:start`.

The team route generator reads the location list from the database, so no code change is needed. Keep at least `totalLevels` locations.

## Writing your own

- A riddle must be solvable by someone who knows the venue and must never contain the QR secret.
- Keep it short enough to read on a phone. Line breaks are preserved.
