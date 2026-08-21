# Fix: GitHub Actions deploy has been failing since `e59ca70`

**Status: broken, needs your action.** Every push to `main` since commit
`e59ca70` ("retire the workers.dev bridge") has failed in CI at the API
deploy step. Typecheck, lint, and the web build all pass — the Worker code
itself uploads fine — it fails one step later, and because that step has no
`continue-on-error`, the job stops there and **the frontend (Cloudflare
Pages) never redeploys either.** Production has been frozen on commit
`0d8b71c` since 2026-08-21 while five pushes on top of it, including
security/bug fixes, sat undeployed.

---

## What's actually failing

From the CI log (`.github/workflows/deploy.yml` → `Deploy API (Cloudflare
Workers)` step):

```
Uploaded autro-api (2.00 sec)

✘ [ERROR] A request to the Cloudflare API (/zones/.../workers/routes) failed.

  Authentication error [code: 10000]

📎 It looks like you are authenticating Wrangler via a custom API token set
in an environment variable. Please ensure it has the correct permissions
for this operation.
```

The Worker script itself deploys (`Uploaded autro-api`) — the failure is
Cloudflare rejecting one specific follow-up call, to manage **zone-level**
Workers Routes on `zeonweb.com`.

## Why this started now, not earlier

Compare the two `wrangler deploy` outputs:

**Before `e59ca70` (last one that worked, commit `c31f4a0`):**
```
Deployed autro-api triggers (0.36 sec)
  https://autro-api.skazimuddin7786.workers.dev
  api.autro.zeonweb.com (custom domain)
```
`wrangler.toml` still had `workers_dev = true` at this point, so wrangler
deployed to both URLs and never needed to touch the zone's route table.

**`e59ca70` removed `workers_dev = true`** — a correct, deliberate cleanup;
the custom domain had already been confirmed working end-to-end. But
without it, wrangler now has to reconcile the zone's route table on every
deploy (confirm nothing conflicting is registered, the custom domain is the
only thing pointing at this Worker), which means a zone-scoped API call it
never made before: `GET/PUT /zones/{zone_id}/workers/routes`.

The `CLOUDFLARE_API_TOKEN` in this repo's GitHub secrets has always been
able to push Worker code (an **account**-level permission) — that part
still works today. It was just never granted the matching **zone**-level
"Workers Routes" permission, because nothing asked for it until this
change. So it's not that anything regressed — a correct code change started
requiring one more permission than the token has.

---

## The fix (needs your Cloudflare + GitHub access — can't be done from here)

### 1. Get a token with the right permissions

Easiest: mint a fresh token from Cloudflare's built-in template rather than
guessing which permission to add to the existing one.

1. Go to **https://dash.cloudflare.com/profile/api-tokens** (log in as
   `skazimuddin7786@gmail.com` — the account CI is using, per the logs).
2. **Create Token** → find the **"Edit Cloudflare Workers"** template →
   **Use template**. This template already bundles what's missing:
   `Account → Workers Scripts → Edit`, `Zone → Workers Routes → Edit`, and
   `Zone → Zone → Read`.
3. **Zone Resources** → include `zeonweb.com` (specific zone is fine).
4. **Account Resources** → confirm it's scoped to
   `Skazimuddin7786@gmail.com's Account`.
5. **Continue to summary** → **Create Token** → copy the value now
   (Cloudflare shows it exactly once).

### 2. Swap it into GitHub Actions

1. Repo → **Settings → Secrets and variables → Actions**.
2. `CLOUDFLARE_API_TOKEN` → **Update** → paste the new value → **Update
   secret**.

### 3. Re-run the deploy

Either push any commit, or: **Actions** tab → the latest failed **Deploy**
run → **Re-run all jobs**.

### 4. Verify

The `Deploy API (Cloudflare Workers)` step should end with something like:

```
Deployed autro-api triggers (...)
  api.autro.zeonweb.com (custom domain)
```

with no `[ERROR]` line — and the `Deploy Web (Cloudflare Pages)` step
after it should actually run this time and print a
`https://<hash>.autro-web.pages.dev` deployment URL, plus the custom domain
serving `autro.zeonweb.com`.

---

## Once this is fixed

Everything currently on `main` (`8cc63dd` and back to `0d8b71c`) will
deploy in that same run — nothing further needs re-pushing. Delete this
file once you've confirmed a green deploy; it's a one-time fix note, not
ongoing reference material (see `SETUP.md` for that).
