# Deployment (Vercel + MongoDB Atlas)

TraceRoute runs as **two Vercel projects**: the API (`Backend/`) and the web app (`Frontend/`).

| Part | Vercel project | URL |
| :-- | :-- | :-- |
| Web app | `traceroute` | https://traceroute-cn.vercel.app (also `traceroute-ivory.vercel.app`) |
| API | `traceroute-api` | https://traceroute-api.vercel.app |

`traceroute.vercel.app` belongs to another Vercel account, which is why the web app uses `traceroute-cn`.

## Environment variables

**API (`traceroute-api`, Production)**

| Variable | Value |
| :-- | :-- |
| `MONGODB_URI` | Atlas connection string **with a database name** (`.../traceroute?...`) |
| `JWT_SECRET` | Long random string |
| `CORS_ORIGINS` | `https://traceroute-cn.vercel.app,https://traceroute-ivory.vercel.app` |
| `FRONTEND_URL` | `https://traceroute-cn.vercel.app` (login link in the email) |
| `MAKE_WEBHOOK_URL` | Your Make.com webhook |
| `MONGOMS_DISABLE_POSTINSTALL` | `1` (stops the test-only in-memory MongoDB from downloading ~780 MB during the build) |

**Web app (`traceroute`, Production)**

| Variable | Value |
| :-- | :-- |
| `VITE_API_URL` | `https://traceroute-api.vercel.app/api` (baked in at build time, so redeploy after changing it) |

## Deploy

```bash
# API
cd Backend
vercel link --project traceroute-api
vercel env add MONGODB_URI production      # repeat for each variable above
vercel deploy --prod

# Web app
cd ../Frontend
vercel link --project traceroute
vercel env add VITE_API_URL production
vercel deploy --prod
```

## Things that matter

- **MongoDB Atlas network access** must allow Vercel (Atlas → Network Access → `0.0.0.0/0`), because Vercel IPs change.
- **Do not publish the QR images.** `Frontend/.vercelignore` excludes `public/qr_codes` and `public/print_qrs.html`. Anyone who could download a QR image could skip that location. Print QR codes from **Admin → Locations → Print all QRs** (or from your local `Frontend/public/qr_codes/`).
- `Backend/vercel.json` has **no rewrites**. Vercel's Express runtime routes everything itself, and a catch-all rewrite makes every request 404.
- `.npmrc` sets `legacy-peer-deps=true` in both apps (the ESLint peer ranges conflict otherwise).
- `Backend/.vercelignore` keeps `.env`, tests, scripts and local backups out of the upload.
- Changing `CORS_ORIGINS`, `FRONTEND_URL` or any API variable needs an API redeploy: `cd Backend && vercel deploy --prod`.

## Health checks

```bash
curl https://traceroute-api.vercel.app/api/health
curl https://traceroute-api.vercel.app/api/settings/public
```

## Seeding the production database

Seed from your machine with `Backend/.env` pointing at the production database (see the root README). The Vercel API never seeds anything.
