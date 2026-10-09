# Deployment (Vercel + MongoDB Atlas)

TraceRoute runs as **two Vercel projects**: the API (`Backend/`) and the web app (`Frontend/`).

| Part | Vercel project | URL |
| :-- | :-- | :-- |
| Web app | `traceroute` | https://traceroute-cn.vercel.app |
| API | `traceroute-api` | https://traceroute-api.vercel.app |

`traceroute.vercel.app` belongs to another Vercel account, which is why the web app uses `traceroute-cn`. Each project has exactly one public address; Vercel's automatic team and branch preview URLs also exist but sit behind Vercel login.

## Environment variables

**API (`traceroute-api`, Production)**

| Variable | Value |
| :-- | :-- |
| `MONGODB_URI` | Atlas connection string **with a database name** (`.../traceroute?...`) |
| `JWT_SECRET` | Long random string |
| `CORS_ORIGINS` | `https://traceroute-cn.vercel.app` (comma-separate more; a `*` matches one hostname label, trailing slashes are ignored) |
| `FRONTEND_URL` | `https://traceroute-cn.vercel.app` (login link in the email) |
| `MAKE_WEBHOOK_URL` | Your Make.com webhook |
| `MONGOMS_DISABLE_POSTINSTALL` | `1` (stops the test-only in-memory MongoDB from downloading ~780 MB during the build) |

**Web app (`traceroute`, Production)**

| Variable | Value |
| :-- | :-- |
| `VITE_API_URL` | `https://traceroute-api.vercel.app/api` (baked in at build time, so redeploy after changing it) |

## Deploy

Both projects are connected to the GitHub repo `prasadbhalerao1/treasureHunt` with **Root Directory** `Frontend` (web app) and `Backend` (API). Production branch: `main`.

- **Normal flow:** push a branch and Vercel builds a preview of both. Merge to `main` and Vercel deploys production.
- **Why the Root Directory matters:** with it left at `.` the Git build runs at the repo root, where there is no app, and fails with `Cannot read properties of undefined (reading 'fsPath')`. Set it under Project → Settings → General → Root Directory.
- **Previews:** only the **Production** environment has the API variables, so a preview build succeeds but its API calls will not work. Add the variables to *Preview* too if you need working previews.
- **CLI deploys:** with a Root Directory set, do not run `vercel deploy` inside `Backend/` or `Frontend/` (the path doubles). Prefer Git. If you must use the CLI, run it from the repo root with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set; the root `.vercelignore` keeps the QR files out.

First-time setup of the environment variables:

```bash
vercel env add MONGODB_URI production      # repeat for each variable above
```

## Things that matter

- **MongoDB Atlas network access** must allow Vercel (Atlas → Network Access → `0.0.0.0/0`), because Vercel IPs change.
- **Do not publish the QR images.** `Frontend/.vercelignore` excludes `public/qr_codes` and `public/print_qrs.html`. Anyone who could download a QR image could skip that location. Print QR codes from **Admin → Locations → Print all QRs** (or from your local `Frontend/public/qr_codes/`).
- `Backend/vercel.json` has **no rewrites**. Vercel's Express runtime routes everything itself, and a catch-all rewrite makes every request 404.
- `.npmrc` sets `legacy-peer-deps=true` in both apps (the ESLint peer ranges conflict otherwise).
- `Backend/.vercelignore` keeps `.env`, tests, scripts and local backups out of the upload.
- Changing `CORS_ORIGINS`, `FRONTEND_URL` or any API variable needs an API redeploy: `cd Backend && vercel deploy --prod`.

## CORS

Only the origins in `CORS_ORIGINS` (plus `localhost:5173` / `:3000` for development) may call the API from a browser. Anything else gets no CORS headers, so the browser blocks it. Error responses (401, 400, 429...) still carry the headers, so the app can read the real error message. `Backend/tests/cors.test.js` covers this.

If you add a new frontend domain, add it to `CORS_ORIGINS` and redeploy the API.

## Health checks

```bash
curl https://traceroute-api.vercel.app/api/health
curl https://traceroute-api.vercel.app/api/settings/public
```

## Seeding the production database

Seed from your machine with `Backend/.env` pointing at the production database (see the root README). The Vercel API never seeds anything.
