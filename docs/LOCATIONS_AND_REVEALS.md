# Locations & Hints

Seeded by `Backend/scripts/seedLocations.js` (edit the `LOCATION_DATA` array, or change them live in **Admin → Locations**). Location `0` is the Start. QR secrets are generated randomly at seed time and are never listed here.

A hint is shown to a team **after it solves the previous hop**, telling it where to go next. The hop code is awarded when the team solves the hop at that location and is used in the Mega Puzzle.

| ID | Location | Hop code | Hint |
| :-: | :-- | :-- | :-- |
| 1 | Bus Parking (Behind Cafeteria) | ROUTER | TTL almost expired. Big yellow gateways sit idle behind the place where meals are served. Find the checkpoint where drivers exchange messages. |
| 2 | Food Court – Dosa Wala | GATEWAY | A shared broadcast domain for every branch: all hungry, all connected. Next hop: the stall that serves a flat, folded, warm payload. |
| 3 | Cafeteria | SWITCH | Hungry packets queue up here between bells. Buffers overflow with chatter, and throughput is measured in plates per minute. Search where students line up to dine. |
| 4 | Jaywant Library | FIREWALL | PING sent. Reply expected from the building where the loudest sound is a whisper. Its name is a victory cry; its shelves hold the only RFCs that matter. Latency here: very high. Volume: zero. |
| 5 | CSBS Department | PROXY | A dual-stack department that speaks both code and commerce. Not only programmers, not only managers: this is where tech meets business. |
| 6 | FY Department | DNS | The first hop for every new engineer. Fresh nodes join the network here and learn the protocols of college life. The launchpad of the campus. |
| 7 | Physics Lab | DHCP | Circuits glow and pendulums swing, beneath the stage where the speakers sing. Forces meet and laws collide: Newton whispers, Ohm replies. |
| 8 | Stationery Store (Food Court) | NAT | Hidden among the edible, a node that sells what is not: ink and paper, bound and bought. Where mistakes get erased and a clean page awaits. |
| 9 | Xerox Shop | BRIDGE | One packet in, many packets out. This node duplicates every payload: faded notes come out crisp and loud. One idea enters, multiplied. |
| 10 | Mac Lab | MODEM | 🍎 ➡️ 💻 ➡️ 🚪 A subnet of silver machines, the same logo on every node. Mouse and keys work side by side; your next packet waits inside. |
| 11 | Counselling Centre | REPEATER | A strong mind survives any outage. When the signal drops, climb the steps. Behind the door where hearts heal, your next secret waits. |
| 12 | Student Section | HUB | The request queue of the campus: forms in, approvals out. No classes here, only requests waiting their turn in line. |

## Writing your own hints

- A hint must be solvable by someone who knows the venue, and must not contain the QR secret.
- Keep them short enough to read on a phone in sunlight (3 lines).
- Hint text keeps its line breaks. The Start location's hint is not shown; teams see "scan the Start QR".
- Each team visits 7 of these 12, so write at least as many locations as `totalLevels`.
