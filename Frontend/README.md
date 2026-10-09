# 📱 TraceRoute Client (Frontend)

React 18 + Vite 5 + Tailwind 3 (neo-brutalist). Mobile-first for the players, desktop-friendly for the admin.

## Run

```bash
npm install --legacy-peer-deps
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
npm run build            # production build into dist/
```

The camera scanner needs HTTPS (or `localhost`). On a phone, use the deployed or tunnelled HTTPS URL.

## Screens

| Route | Who | What |
| :-- | :-- | :-- |
| `/login` | everyone | Team ID + password. Shows the event name and tagline from Settings |
| `/dashboard` | teams | Hop progress, running timer, hint card, QR scanner, MCQ challenge, Mega Puzzle, result |
| `/admin` | admins | Dashboard, User Management, Game Flow, Locations, Question Bank, Settings |

## Structure

```
src/
  pages/            Login, Dashboard, Admin
  components/
    Dashboard/      ChallengeCard (MCQ), FinalePanel (Mega Puzzle)
    admin/          Settings, QuestionBank, Locations (+ QR print), Flow (+ team actions), Users
    Scanner.jsx     html5-qrcode wrapper
  context/          AuthContext, SettingsContext (event name / status)
  utils/            api (axios), constants (+ formatDuration)
```

The team screen is a pure render of the `state` object returned by the API; it keeps no game logic of its own. It re-syncs on tab focus and every 15 s, and corrects its clock with `serverTime`.
