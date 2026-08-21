# Autro — deployment & setup

Everything you have to do outside the code. Check the **Pending** section
before every deploy — that is where a change that needs an action from you
gets recorded.

---

## ⚠️ Pending — do this before your next deploy

### One optional cleanup: old Google OAuth entries

The `autro.zeonweb.com` domain cutover is **done and confirmed working**
end-to-end (login, vehicle add, photo upload all tested live on the new
domain, 2026-08-21). The only thing left is cosmetic, not urgent:

- In the Google OAuth client (console.cloud.google.com/apis/credentials →
  `790736114811-…`), remove whatever old origin/redirect URI is still listed
  from before the cutover. It's inert now — `GOOGLE_REDIRECT_URI` only ever
  sends the new one — but tidying it up avoids confusion later.

---

## Deploying

```bash
npm run typecheck && npm run lint       # both must pass
npm run build --workspace=apps/web

cd apps/api && wrangler deploy          # API → api.autro.zeonweb.com
```

The frontend build output is `apps/web/dist` — deploy it wherever you host it
(Pages/Netlify/etc). Its config is committed in `apps/web/.env.production`:

| Variable            | Value                            |
| ------------------- | --------------------------------- |
| `VITE_API_BASE_URL` | `https://api.autro.zeonweb.com` |

It's public by nature (visible in any browser), so it lives in the repo
rather than in secrets. If the Worker URL ever changes, edit that file — the
frontend throws on boot if it's missing, by design.

The Google OAuth client ID lives only on the backend (`GOOGLE_CLIENT_ID`
below) — the frontend never builds a Google URL itself, it always redirects
through `GET /auth/google`, so it has no need for its own copy. (Previously
the frontend also carried `VITE_GOOGLE_CLIENT_ID` for a one-off OAuth URL on
the invite-accept screen; that screen now goes through the same backend
redirect as every other login, so the var was dropped — safe to remove from
your deploy's env if you had it set.)

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

`apps/web` needs a `.env.local` with `VITE_API_BASE_URL=http://localhost:8787`.
It is gitignored.

---

## Log of setup-affecting changes

Newest first. Anything here needs an action from you that code alone cannot do.

| Date       | Change                                                                          | Action                             |
| ---------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| 2026-08-21 | Custom domains live: `autro.zeonweb.com` (web), `api.autro.zeonweb.com` (API). `workers.dev` retired. | Done — see **Pending** above for the one optional cleanup |
| 2026-08-20 | `R2_PUBLIC_URL` added; the R2 host is no longer hardcoded in `upload.ts`        | Done — secret is set                |
