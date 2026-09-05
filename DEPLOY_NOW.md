# Deploy this update — step by step

Everything from the last few sessions is on `main` already (confirmed in
sync with GitHub — nothing sitting in an unmerged branch). Nothing is
deployed yet. Do these in order.

## 1. Get the code

```bash
git pull origin main
```

## 2. Apply the 2 new database migrations

```bash
cd apps/api
wrangler d1 migrations apply autro-db --remote
```

## 3. Deploy the API

```bash
wrangler deploy
```

(Still inside `apps/api`. CI auto-deploy is broken right now — see
`CI_DEPLOY_FIX.md` — so this has to be manual until that's fixed.)

## 4. Deploy the web app

```bash
cd ../../apps/web
npm run build
```

Upload the `apps/web/dist` folder to wherever you host it (Cloudflare Pages,
Netlify, etc.) — same as always.

## 5. Optional: let logos show up in PDFs

Cloudflare dashboard → R2 → your bucket → Settings → CORS policy → allow
`GET` from your web app's domain. Skip this and everything still works —
PDFs just generate without the logo.

## 6. Tell your team

Any garage that hasn't set a workshop location yet needs to do it now
(Settings → Workshop location, **from a phone**) — staff cannot check in
until they do. This didn't matter before; it does now.

---

## Cross-check after deploying

Go through this on a real phone + a real desktop, not just at your desk:

- [ ] Log in, dashboard loads
- [ ] Settings has 5 pages: Garage, Location, Payroll, PDF, Account
- [ ] Upload a logo in Settings → Garage — it shows up in the app header
- [ ] Create/open an invoice → download PDF → logo + your details are on it
- [ ] Create/open an estimate → download PDF (this is new — didn't exist before)
- [ ] On desktop: Settings → Location shows the "use your phone" message, no GPS button
- [ ] On a phone: Settings → Location → set the location successfully
- [ ] On a phone: scan the QR code, check in, check out
- [ ] Vehicle details → set a "service reminder" date a few days out → it appears on the dashboard
- [ ] Turn the phone to airplane mode, reopen the app on a screen you've visited before → it still opens (offline screen only appears for screens you've never opened)
- [ ] Vehicles list/dashboard: each row shows a small photo (or a car icon if none uploaded)
- [ ] Vehicles page: search box is above the stage filter (All/New/Repairing/...)
- [ ] On a phone: tap the vehicles search box — the bottom nav bar stays put, doesn't jump up the screen
- [ ] Settings → QR code (not Staff → Attendance anymore) → download the A4 PDF, check it opens and shows the code
- [ ] Vehicle details → tap the customer's name → their profile opens with vehicles + total spent
- [ ] Log in as a staff account (if you have one) → confirm Settings has no "QR code" row and Attendance page has no QR/regenerate control

If any box fails, that's the one to send back for a fix — not a reason to
redo the whole list.
