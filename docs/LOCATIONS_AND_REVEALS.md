# Locations & Riddles

These are the **original riddles from the previous event**, restored byte-for-byte from `Backend/local_backup_1770292572869.json`. Do not reword them. They are seeded by `Backend/scripts/seedLocations.js` (data in `Backend/data/locations.js`) and can be edited live in **Admin → Locations**.

A riddle is shown to a team **after it answers the question correctly**, and points to the location whose QR they must scan next. Location `0` is the Start; its QR is projected on the smartboard. QR secrets are random and are not listed here.

| ID | Location | Riddle |
| :-: | :-- | :-- |
| 1 | Bus Parking (Behind Cafeteria) | Not a classroom, not a hall Big yellow giants stand tall. Meals are near, engines sleep, Find your clue where drivers meet. |
| 2 | Food Court – Dosa Wala | A common ground for every branch, where hunger makes alliances. From there, track fermentation’s reward, served flat, folded, and warm. |
| 3 | Cafeteria | Where hunger gathers between bells, plates move fast, and chatter swells. Meals replace the morning grind— search where students queue to dine. |
| 4 | Jaywant Library | Victory’s temple holds the scrolls, where whispers die and silence patrols. The guardian named for triumph’s call— knowledge sleeps behind these walls. |
| 5 | CSBS Department | Not only programmers, not only managers — this is where tech meets business. |
| 6 | FY Department | Where rookies shed their school-day skin, engineers take first steps within. Beginnings live on every page— the launchpad of the college stage. |
| 7 | Physics Lab | Where pendulums swing and circuits glow, beneath the stage where speakers show. Forces meet and laws collide— Newton whispers, Ohm replies. |
| 8 | Stationery Store (Food Court) | Among the edible, find what’s not— ink and paper, bound and bought. Where mistakes retreat with grace, and answers get a cleaner face. |
| 9 | Xerox Shop | Where singularity becomes a crowd, faded notes grow crisp and loud. One idea enters, multiplied— clarity printed side by side. |
| 10 | Mac Lab | 🍎 ➡️ 💻 ➡️ 🚪 Silver screens in silent rows, where designs and deadlines go. Mouse and keys work side by side, your next answer waits inside. |
| 11 | Counselling Centre | A strong mind wins every heist. When fear rises, climb the steps. Behind the door where hearts heal, your next secret waits. |
| 12 | Student Section | Where dreams queue up in paper form, and patience beats the brightest norm. No classes here, just forms to sign— where student requests wait in line. |

## Flow

```
scan START QR -> question 1 -> riddle for location 1
scan L1 QR    -> question 2 -> riddle for location 2
...
scan L5 QR    -> question 6 -> riddle for location 6
scan L6 QR    -> final challenge (one button for now)
```

Six questions, six locations after the Start. Each team gets its own order of locations and its own six questions.

## Writing your own

- A riddle must be solvable by someone who knows the venue and must never contain the QR secret.
- Keep it short enough to read on a phone. Line breaks are preserved.
- Write at least as many locations as `totalLevels`.
