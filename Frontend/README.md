# 📱 Campus Heist Client (Frontend)

> A **Brutalist**, mobile-first React application for players, volunteers, and admins.

---

## ✨ Core Features

| Feature                 | Description                                                                  |
| :---------------------- | :--------------------------------------------------------------------------- |
| **🎨 Brutalist UI**     | High-contrast black/white with neon accents. No gradients, hard 4px borders. |
| **📷 Browser Scanner**  | `html5-qrcode` integration. Works on mobile without app install.             |
| **🔄 Real-Time Sync**   | Dashboard polls API every 5 seconds for live state updates.                  |
| **🛡️ Role-Based Views** | Candidates see game UI, Volunteers see verify panel, Admins see analytics.   |
| **📊 Admin Charts**     | `recharts` powered leaderboard and level distribution graphs.                |

---

## � File Structure

```
Frontend/
├── public/
│   └── qr_codes/          # Pre-generated level QR images
│
├── src/
│   ├── components/
│   │   ├── Loader.jsx     # "CONTACTING SATELLITE" spinner
│   │   ├── Scanner.jsx    # QR Camera wrapper
│   │   └── ui/            # Button, Input, Card primitives
│   │
│   ├── context/
│   │   └── AuthContext.jsx # Global auth state (user, token)
│   │
│   ├── pages/
│   │   ├── Login.jsx      # Team ID + Password
│   │   ├── Register.jsx   # Team creation (max 4 members)
│   │   ├── Dashboard.jsx  # Main game UI (Candidate)
│   │   ├── Volunteer.jsx  # Team lookup & verify
│   │   └── Admin.jsx      # Stats + Leaderboard
│   │
│   ├── utils/
│   │   └── api.js         # Axios instance with interceptors
│   │
│   ├── App.jsx            # React Router setup
│   ├── main.jsx           # Entry point
│   └── index.css          # Tailwind directives
│
├── .env                   # VITE_API_URL
├── tailwind.config.js
└── vite.config.js
```

---

## 🎨 Design System

| Element        | Style                                                     |
| :------------- | :-------------------------------------------------------- |
| **Borders**    | `border-4 border-black`                                   |
| **Shadows**    | `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`                  |
| **Buttons**    | Black fill, white text, uppercase, `active:translate-x-1` |
| **Cards**      | White background, thick border, no border-radius          |
| **Typography** | `font-black`, `uppercase`, `tracking-widest`              |

---

## 📄 Pages

| Page          | Route        | Role      | Description                       |
| :------------ | :----------- | :-------- | :-------------------------------- |
| **Login**     | `/login`     | All       | Enter Team ID + Password.         |
| **Register**  | `/register`  | Public    | Create new team (email required). |
| **Dashboard** | `/`          | Candidate | View level, hint, scan QR.        |
| **Volunteer** | `/volunteer` | Volunteer | Search & verify teams.            |
| **Admin**     | `/admin`     | Admin     | Live leaderboard & stats.         |

---

## 🛠️ Scripts

| Script         | Command         | Description                    |
| :------------- | :-------------- | :----------------------------- |
| **Dev Server** | `npm run dev`   | Runs Vite at `localhost:5173`. |
| **Build**      | `npm run build` | Production bundle in `dist/`.  |
| **Lint**       | `npm run lint`  | ESLint check.                  |

---

## 📱 Mobile Testing

1.  Find your PC's IP: `ipconfig` (Windows) or `ifconfig` (Mac).
2.  Update `.env`:
    ```ini
    VITE_API_URL=http://192.168.1.5:5000/api
    ```
3.  Connect phone to same Wi-Fi.
4.  Open `http://192.168.1.5:5173` in mobile browser.
