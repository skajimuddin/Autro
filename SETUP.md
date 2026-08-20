# Autro — deployment & setup

Everything you have to do outside the code. Check the **Pending** section
before every deploy — that is where a change that needs an action from you
gets recorded.

---

## ⚠️ Pending — do this before your next deploy

### Set `R2_PUBLIC_URL` (new, one time)

```bash
cd apps/api
wrangler secret put R2_PUBLIC_URL
# paste exactly:
# https://pub-3f013ceda72a4355bda7a9dde43b4a84.r2.dev
```

**Why:** that URL used to be hardcoded in `src/routes/upload.ts`. It is now
configuration, so a bucket host baked into the source cannot outlive the
bucket. Use the value above and not a different one — your existing vehicle
photos are already stored against that host, so a different value would split
old and new photos across two domains.

**If you skip it:** `POST /upload/presign` throws, so adding a vehicle photo
fails. Everything else keeps working — `validateR2Env()` only runs on the
upload route.

Your other four R2 secrets are unchanged. Nothing else to re-enter.

---

## Deploying

```bash
npm run typecheck && npm run lint       # both must pass
npm run build --workspace=apps/web

cd apps/api && wrangler deploy          # API  → autro-api.<subdomain>.workers.dev
```

The frontend build output is `apps/web/dist` — deploy it wherever you host it
(Pages/Netlify/etc). Its config is committed in `apps/web/.env.production`:

| Variable                | Value                                           |
| ----------------------- | ----------------------------------------------- |
| `VITE_API_BASE_URL`     | `https://autro-api.skazimuddin7786.workers.dev` |
| `VITE_GOOGLE_CLIENT_ID` | `790736114811-…apps.googleusercontent.com`      |

Both are public by nature (the client ID is visible in any browser), so they
live in the repo rather than in secrets. If the Worker URL ever changes, edit
that file — the frontend throws on boot if either is missing, by design.

### Database migrations

Migrations live in `apps/api/drizzle/` (8 so far) and are **not** applied by
`wrangler deploy`. When a release adds one, apply it yourself:

```bash
cd apps/api
wrangler d1 migrations apply autro-db --remote     # --local for the dev copy
```

---

## Secrets reference

Set with `wrangler secret put <NAME>` from `apps/api/`. There are no fallback
defaults anywhere — a missing value throws rather than silently misbehaving.

### Core — checked on every request

Missing any of these returns 500 for the whole API.

| Secret                 | Where it comes from                                   |
| ---------------------- | ----------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google Cloud console → Credentials → OAuth client     |
| `GOOGLE_CLIENT_SECRET` | same client                                           |
| `GOOGLE_REDIRECT_URI`  | must match the redirect URI registered on that client |
| `JWT_SECRET`           | generate one: `openssl rand -base64 32`               |

### Upload — checked only by `POST /upload/presign`

Missing any of these breaks photo upload; the rest of the API still serves.

| Secret                 | Where it comes from                          |
| ---------------------- | -------------------------------------------- |
| `R2_ACCOUNT_ID`        | Cloudflare dashboard → R2                    |
| `R2_ACCESS_KEY_ID`     | R2 → Manage API tokens                       |
| `R2_SECRET_ACCESS_KEY` | same token                                   |
| `R2_BUCKET_NAME`       | `autro-uploads` — must match `wrangler.toml` |
| `R2_PUBLIC_URL`        | R2 → bucket → Settings → Public access       |

`DB` and `BUCKET` are Wrangler **bindings**, already declared in
`wrangler.toml`. They are not secrets and need no action.

---

## Local development

```bash
npm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # then fill it in — gitignored
npm run dev:api                                     # :8787
npm run dev:web                                     # :5173
```

`apps/web` needs a `.env.local` with `VITE_API_BASE_URL=http://localhost:8787`
and your `VITE_GOOGLE_CLIENT_ID`. It is gitignored.

---

## Log of setup-affecting changes

Newest first. Anything here needs an action from you that code alone cannot do.

| Date       | Change                                                                   | Action                                 |
| ---------- | ------------------------------------------------------------------------ | -------------------------------------- |
| 2026-08-20 | `R2_PUBLIC_URL` added; the R2 host is no longer hardcoded in `upload.ts` | Set the secret — see **Pending** above |
