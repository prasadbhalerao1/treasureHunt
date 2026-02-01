# Project Credentials & Environment Variables

This document lists the required environment variables and credentials for the TreasureHunt project (Refactored Version 3.0).

## Backend Configuration

Create a file named `.env` in the `Backend/` directory:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection (MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/treasurehunt?retryWrites=true&w=majority

# Security (JWT)
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# Email Service
# (Used for sending Team IDs if implemented, currently flow is Admin-driven)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Integrations
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/37yxq8dipsc3d5z8pz6kuxqy6r1pg8h6
```

## Frontend Configuration

Create a file named `.env` in the `Frontend/` directory:

```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 🔐 Credentials / Logins

### 👨‍✈️ Admin Access

- **URL**: `/admin`
- **Team ID**: `ADMIN-MAIN` (Preserved from cleanup)
- **Password**: _Existing Password_ (Typically `adminpassword123`)
  - _Note: If no admin existed, the system created `ADMIN-01` / `admin123`._
  - **Note to User**: Since the database was wiped, please **Logout and Login again** to refresh your token.

### 🕵️‍♂️ Team Logins (Candidates)

All teams have been seeded with the default password: **`123456`**

| Team ID     | Name    | Role      | Steps              |
| :---------- | :------ | :-------- | :----------------- |
| **Team-1**  | Team 1  | Candidate | Random 7-step path |
| **Team-2**  | Team 2  | Candidate | Random 7-step path |
| ...         | ...     | ...       | ...                |
| **Team-35** | Team 35 | Candidate | Random 7-step path |

---

## 📍 Locations & Keywords

**Locations now use randomized QR Secrets for security.**

| Location ID   | Keyword                     | QR Code                                          |
| :------------ | :-------------------------- | :----------------------------------------------- |
| **0 (Start)** | `START`                     | `Location-0_(Start).png`                         |
| **1-12**      | City Names (e.g., `BERLIN`) | `Location_Name.png` (e.g., `Blossom_Ground.png`) |
