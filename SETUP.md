# Autro — deployment & setup

Everything you have to do outside the code. Check the **Pending** section
before every deploy — that is where a change that needs an action from you
gets recorded.

---

## ⚠️ Pending — do this before your next deploy

### Finish the custom-domain cutover (`autro.zeonweb.com` / `api.autro.zeonweb.com`)

The API side is done — `api.autro.zeonweb.com` is live (declared in
`wrangler.toml`, so every future `wrangler deploy`, including CI, keeps it).
Four steps are left, **in this order** — doing them out of order breaks login
or the site for however long the gap lasts:

1. **You, dashboard** — add the web custom domain:
   Cloudflare dashboard → Workers & Pages → **autro-web** → **Custom domains**
   tab → Set up a custom domain → enter `autro.zeonweb.com` → Activate. (Not
   possible from the CLI — `wrangler pages` has no `domain` subcommand as of
   4.122.0.) Wait for it to show **Active** (SSL usually issues within a few
   minutes since the zone is already on this account).

2. **You, Google Cloud Console** — console.cloud.google.com/apis/credentials
   → open the OAuth client (`790736114811-…`) → add:
   - Authorized JavaScript origin: `https://autro.zeonweb.com`
   - Authorized redirect URI: `https://autro.zeonweb.com/auth/callback`

   Leave the old entries in place for now — remove them only after step 4 is
   confirmed working, so a mistake doesn't lock out login entirely.

3. **Tell the agent/session** once 1 and 2 are done — it will then:
   - `wrangler secret put GOOGLE_REDIRECT_URI` → `https://autro.zeonweb.com/auth/callback`
   - update `apps/web/.env.production` → `VITE_API_BASE_URL=https://api.autro.zeonweb.com`
   - drop the old `https://autro-web.pages.dev` entry from the CORS allow-list
     in `apps/api/src/middleware/cors.ts`
   - commit + push (CI builds and deploys the frontend on the new domain)

4. **Verify end-to-end** on `https://autro.zeonweb.com` — load the app, log in
   with Google, confirm API calls succeed. Then, and only then:
   - Cloudflare Pages does not offer a way to disable the default
     `*.pages.dev` URL — it stays reachable regardless of custom domains. Not
     a problem; nothing will reference or advertise it any more.
   - In `apps/api/wrangler.toml`, remove `workers_dev = true` (added
     specifically as a bridge during this cutover) and redeploy — this
     retires `autro-api.skazimuddin7786.workers.dev`.
   - Remove the old origin/redirect URI from the Google OAuth client.

**Why the two-URL bridge:** defining a `routes` entry in `wrangler.toml`
silently disables the Worker's `*.workers.dev` URL — caught mid-setup because
the live frontend still pointed at it. `workers_dev = true` was added back
explicitly so nothing broke while the rest of the cutover is pending.

---

## Deploying

```bash
npm run typecheck && npm run lint       # both must pass
npm run build --workspace=apps/web

cd apps/api && wrangler deploy          # API → api.autro.zeonweb.com (+ *.workers.dev, bridge — see Pending)
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

| Date       | Change                                                                    | Action                                      |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| 2026-08-21 | `api.autro.zeonweb.com` attached as the API's custom domain               | Finish the cutover — see **Pending** above |
| 2026-08-20 | `R2_PUBLIC_URL` added; the R2 host is no longer hardcoded in `upload.ts`  | Done — secret is set                        |
