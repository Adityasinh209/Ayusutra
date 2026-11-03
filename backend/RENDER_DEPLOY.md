# Deploy AyurSutra API on Render (Web Service)

Use this **before** Vercel. Env vars alone do not start the app — these **Settings** must match.

## Service type

**Web Service** → Language **Python 3** (not Static Site).

## Settings (copy exactly)

| Field | Value |
|-------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Pre-Deploy Command** | *(leave empty)* |

If **Root Directory** is wrong, logs show: `ModuleNotFoundError: No module named 'app'` → exit 1.

## Environment (you already have most)

Required for startup:

- `DATABASE_URL` — must reach MySQL from Render
- `CLERK_FRONTEND_API` — hostname only, e.g. `your-instance.clerk.accounts.dev` (no `https://`). In Clerk Dashboard → **Configure** → **Domains**, copy the **Frontend API** host. It must be the **same Clerk application** as Vercel’s `VITE_CLERK_PUBLISHABLE_KEY` (Dashboard → **API Keys**). A mismatch causes **Invalid token** on OTP and other API calls.

If using **Aiven / cloud MySQL** and logs mention **SSL** or **certificate**:

```env
MYSQL_SSL_SKIP_VERIFY=true
```

SMTP / Fast2SMS do **not** affect startup; only email/SMS at runtime.

## Verify deploy

When status is **Live**, open:

`https://<your-service-name>.onrender.com/health`

Expected: `{"status":"ok"}`

If the service **Exited with status 1**, open **Logs** and search for `Database startup failed` or `ModuleNotFoundError` — that line is the fix.

## After Render works

Then set Vercel `VITE_API_URL` to this service URL.
