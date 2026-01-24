# 📱 BERLIN HEIST Client (Frontend)

> A **Brutalist**, mobile-first React application for players and admins.

---

## ✨ Core Features

| Feature                 | Description                                                                  |
| :---------------------- | :--------------------------------------------------------------------------- |
| **🎨 Brutalist UI**     | High-contrast black/white with neon accents. No gradients, hard 4px borders. |
| **📷 Browser Scanner**  | `html5-qrcode` integration. Works on mobile without app install.             |
| **🔄 Real-Time Sync**   | Dashboard polls API every 5 seconds for live state updates.                  |
| **🛡️ Role-Based Views** | Candidates see game UI, Admins see analytics and team management.            |
| **📊 Admin Charts**     | `recharts` powered leaderboard and level distribution graphs.                |

---

## 📂 File Structure

```
Frontend/
├── public/             # Static assets
│
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── FlowManagement.jsx
│   │   │   ├── LocationManagement.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── ui/
│   │   │   └── index.jsx      # Button, Input, Card primitives
│   │   ├── Loader.jsx         # "CONTACTING SATELLITE" spinner
│   │   └── Scanner.jsx        # QR Camera wrapper
│   │
│   ├── context/
│   │   └── AuthContext.jsx    # Global auth state (user, token)
│   │
│   ├── pages/
│   │   ├── Login.jsx          # Team ID + Password
│   │   ├── Dashboard.jsx      # Main game UI (Candidate)
│   │   └── Admin.jsx          # Stats + Leaderboard + Management
│   │
│   ├── utils/
│   │   └── api.js             # Axios instance with interceptors
│   │
│   ├── App.jsx                # React Router setup
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind directives
│
├── .env                       # VITE_API_URL
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

| Page          | Route    | Role      | Description                               |
| :------------ | :------- | :-------- | :---------------------------------------- |
| **Login**     | `/login` | All       | Enter Team ID + Password.                 |
| **Dashboard** | `/`      | Candidate | View level, hint, scan QR.                |
| **Admin**     | `/admin` | Admin     | Live leaderboard, stats, team management. |

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
