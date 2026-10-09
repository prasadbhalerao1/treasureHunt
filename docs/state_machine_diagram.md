# TraceRoute: State Machine

## Team state

```mermaid
stateDiagram-v2
  [*] --> NOT_STARTED: registered (level -1)
  NOT_STARTED --> HINT_UNLOCKED: scan Start QR (level 0, clock starts)
  HINT_UNLOCKED --> CHALLENGE_OPEN: scan QR of the next location
  CHALLENGE_OPEN --> CHALLENGE_OPEN: wrong answer (attempt++, penalty, cooldown)
  CHALLENGE_OPEN --> CHALLENGE_OPEN: out of attempts (SWAP_QUESTION: new question + extra penalty)
  CHALLENGE_OPEN --> HINT_UNLOCKED: correct, level k solved (k < N)
  CHALLENGE_OPEN --> FINALE: correct, level N solved
  FINALE --> FINALE: wrong order (penalty, lock after every 3rd miss)
  FINALE --> COMPLETED: correct order (clock stops)
  COMPLETED --> [*]
```

`LOCK_UNTIL_ADMIN` replaces the "new question" transition with a locked `CHALLENGE_OPEN` until an organiser unlocks it.

## Event gate

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> LIVE: admin sets LIVE
  LIVE --> ENDED: admin sets ENDED
  LIVE --> DRAFT: pause
  ENDED --> LIVE: reopen
```

Players can scan and answer only while `LIVE`. `GET /game/state` always works.

## Level index

```
-1  not started          0  Start scanned        k  hop k solved
 N  Mega Puzzle open (N = path.length - 1)       N+2 finished (path.length + 1)
```
