# Project Credentials & Environment Variables

This document lists the required environment variables for the TreasureHunt project.

## Backend Configuration

Create a file named `.env` in the `Backend/` directory with the following variables:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection (MongoDB)
# Get this from MongoDB Atlas or use a local instance
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/treasurehunt?retryWrites=true&w=majority

# Security (JWT)
# Use a strong, random string for production
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# Email Service (Nodemailer)
# Used for sending Team IDs after registration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

### Notes:

- **EMAIL_PASS**: If using Gmail, you must use an **App Password**, not your regular login password. Enable 2FA on your Google Account to generate one.
- **MONGODB_URI**:
  - For **Vercel Deployment**: You must whitelist `0.0.0.0/0` (Allow Access from Anywhere) in MongoDB Atlas Network Access, because Vercel uses dynamic IPs.
  - For **Local Dev**: Whitelist your current IP.

---

## Frontend Configuration

Create a file named `.env` in the `Frontend/` directory with the following variables:

```ini
# API URL
# Points to the backend server.
# For local development: http://localhost:5000/api
# For production: Your deployed backend URL
VITE_API_URL=http://localhost:5000/api
```

### Notes:

- The frontend uses **Vite**, so variables must start with `VITE_` to be exposed to the client.
- You may need to restart the development server (`npm run dev`) after changing `.env` files.

---

## Demo Logins

These accounts are created when running the seed script (`npm run seed:users` in Backend folder).

### Admin Dashboard

- **URL**: `/admin`
- **Main Admin**: `ADMIN-MAIN` / `adminpassword123`
- **Backup Admin**: `ADMIN-BACKUP` / `adminpassword456`

### Volunteer Portal

- **URL**: `/volunteer`
- **Default Password**: `volunteerpassword123`
- **Volunteers**:
  - `VOLUNTEER-1` (Station 1)
  - `VOLUNTEER-2` (Station 2)
  - `VOLUNTEER-3` (Station 3)
  - ... up to `VOLUNTEER-10`

### Player Team

- **URL**: `/login`
- **Team ID**: Generated upon registration (e.g., `TEA-A1B2`)
- **Password**: Set during registration
- **Note**: To test the player experience, go to `/register` and create a new team. You will receive a Team ID which is used for login.
