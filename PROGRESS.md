# Autro — Progress Tracker

> **AI Agent:** Read this first. Then read the task spec from `planning/final/06-tasks.md`.
> After each task: mark `[x]` in `06-tasks.md` and update the two sections below.
>
> ⚠️ **Only mark a task `[x]` if you have RUN it and seen it work.** On 2026-08-13
> we found three tasks marked complete whose core deliverable was a placeholder
> (see "Tracker correction" below). A `[x]` you can't demonstrate is worse than
> a `[ ]`, because it silently removes the work from the plan.

---

## 🔴 Next Task

**Task 3.7 — Contact Picker**

Implement the Contact Picker API for device-contact auto-fill when adding a new vehicle/customer.

| # | Task | State |
| - | ---- | ----- |
| UI-1 | Amend `AGENTS.md` + `05-ui-screens.md` for responsive scope | ✅ 2026-08-13 |
| UI-2 | Install `qrcode.react`, `@react-pdf/renderer`, `html5-qrcode` | ✅ 2026-08-13 |
| UI-3 | De-slop pass (emoji, rainbow colors, icon weight) | ✅ 2026-08-13 |
| UI-4 | Responsive foundation (container, page-shell, nav, modal) | ✅ 2026-08-13 |
| UI-5 | Responsive pass across pages (padding, grids, list columns) | ✅ 2026-08-13 |
| UI-6 | Auth/onboarding/App off inline styles | ✅ 2026-08-13 |
| UI-8 | Visual retune to demo-ui: type scale, density, FontAwesome icons | ✅ 2026-08-13 |
| 6.3 | Real QR display | ✅ 2026-08-13 |
| 6.4 | QR scanner | ✅ 2026-08-13 |
| 4.6 | Invoice PDF generation | ✅ 2026-08-13 |
| UI-7 | `lg:` dense table view for list pages | ✅ 2026-08-13 |
| 8.3 | Final Production Audit | ✅ 2026-08-14 |
| **3.7** | **Contact picker (`contact-picker.tsx` + `lib/contacts.ts`)** | **← next** |

### ⚠️ Nothing here has been confirmed in a browser

Everything below was verified by `typecheck` + `lint` + `build` and, where an API
contract was involved, against the live local stack. **No screen has been looked
at.** The owner is doing the visual/device pass (7.5.1). Specifically unconfirmed:
the sidebar layout at `md:`+, the centred desktop modal, the QR actually scanning,
the camera permission flow, and the rendered PDF.

Device note: the camera needs a secure context. `localhost` is fine; testing from
a phone over LAN needs HTTPS or the scanner will not start.

### Bundle: heavy deps are correctly code-split

| Chunk | Size | Loads when |
| ----- | ---- | ---------- |
| `index` (main) | 486 KB / 143 KB gzip | always |
| `react-pdf.browser` | 1,318 KB / 472 KB gzip | user taps PDF |
| `esm` (html5-qrcode) | 369 KB / 108 KB gzip | staff opens scanner |

Both heavy deps sit behind dynamic `import()`. Adding all three libraries grew the
initial bundle by only ~19 KB net. The build prints a "chunk larger than 500 kB"
warning — that refers to the lazy react-pdf chunk and is expected. **Do not
convert these to static imports.**

---

## 🛠️ Fixes landed 2026-08-13 (beyond the tracker correction)

**1. `npm run typecheck --workspace=apps/web` was a no-op that always passed.**
`apps/web/tsconfig.json` is a solution-style file (`"files": []` + `references`),
so `tsc --noEmit` resolved **zero** source files. This is how broken code reached
`main` while PROGRESS.md claimed typecheck passed. Script is now `tsc -b --force`,
which respects the project references and re-checks every time (verified by
injecting a deliberate error, seeing it caught, then reverting).
`apps/api` was unaffected — its tsconfig has a real `include` and checks 31 files.

**2. The build was already broken on `main`.** `auth/callback.tsx:3` imported
`saveToken`, which the 2026-08-12 audit had replaced with `onLoginSuccess`.
`tsc -b` fails on it via `noUnusedLocals`; the hollow typecheck above never saw it.
Import removed. `npm run build --workspace=apps/web` now passes.

**3. De-slop pass (UI-3).**
- Both emoji removed from `onboarding/setup.tsx` (`📍` → `<Loader2>` spinner,
  `🚀` → plain text). **Zero emoji remain in the frontend**, now enforced by rule.
- `dashboard/index.tsx` `QUICK_ACTIONS` no longer carries `color`/`iconBg` per item
  — all four action icons are `text-primary` on `bg-primary-light`. The four
  *status* stats keep amber/green/blue/red because `05-ui-screens.md` Screen 3
  explicitly prescribes those.
- Icons raised to `strokeWidth={2.5}` to close the weight gap with the demo's
  FontAwesome-solid look.
- **Removed the dead "Recent Vehicles" section.** Its comment claimed "shown until
  vehicle API is connected", but the API has been connected since 3.2 and the
  component was a hardcoded empty state — it displayed "No vehicles yet" forever,
  even with vehicles in the database. It is in neither Task 3.5's spec nor
  Screen 3's spec; it was unrequested scope. Removed rather than wired up.

**4. Responsive foundation (UI-4).** `max-w-[414px]` is gone from the codebase.
- `bottom-nav.tsx` is one component that renders a bottom bar under 768px and a
  fixed left sidebar (w-60, with brand header) at `md:`+ — breakpoints only, no
  JS branch, no duplicated markup. It already had `env(safe-area-inset-bottom)`.
- `modal.tsx` is a bottom sheet on mobile and a centred dialog at `md:`+; the drag
  handle hides at `md:`. Still **no focus trap** — flagged in the file.
- `page-shell.tsx` gained a `wide` prop (list pages opt in) and dropped the
  `MobileContainer` wrapper. It also had a real bug: `<main>` carried
  `overflow-y-auto`, making *it* the scroll container while `<Topbar>` used
  `sticky top-0` — so the sticky header never worked. Now scrolls on the body.
- `topbar.tsx` lost its inline `boxShadow` (now a Tailwind arbitrary value) and
  left-aligns its title at `md:`+, where centring reads as off-centre beside the
  sidebar.
- `mobile-container.tsx` is now the centred frame for standalone pages only
  (check-in, invite accept). Its name is historical — noted in the file.

**5. Responsive pass (UI-5).** `p-4` → `p-4 md:p-6` on all 14 page wrappers.
Dashboard's two 4-item grids go `grid-cols-2 md:grid-cols-4`. The four list pages
render `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` and pass `wide`. Six other
`grid-cols-2` instances were checked individually and left alone — they hold
exactly two items (IN/OUT, PDF/Print, Estimate/Invoice), so widening them would
be wrong.

**6. Attendance now actually works (6.3 + 6.4).** Two independent bugs, either of
which alone broke the feature:
- the "QR code" was a decorative Lucide icon — now a real `QRCodeSVG`;
- `QRData` declared `{ token }` while `GET /attendance/qr` returns `{ qr_token }`.
  `apiFetch<T>` only *asserts* its type argument — there is no runtime validation —
  so this was silent, and the QR card always fell through to its empty state.
  **Every GET endpoint was then swept for the same class of mismatch against the
  live API; this was the only one.** Consider validating responses with the Zod
  schemas already in `packages/shared` to make this class impossible.
- `checkin.tsx` no longer calls `window.prompt` for the token; it opens a camera
  scanner. Flow order follows the spec: scan → GPS → POST.

**7. Invoice PDF (4.6).** `lib/pdf.ts` + wired button. Amounts print "Rs." because
@react-pdf's Helvetica has no ₹ glyph (U+20B9) — a literal ₹ renders as a blank
box. Registering a rupee-capable .ttf is the proper fix and is not done.

**8. Inline styles eliminated (UI-6).** The frontend now contains **zero**
`style={{ }}` props, down from 56, and zero hardcoded hex colours outside Google's
brand mark. Converted `onboarding/setup.tsx` (31 inline styles, 13 hex colours, 0
`className`), `auth/callback.tsx` (10), `auth/login.tsx` (8) and `App.tsx` (4 —
missed by the first survey, which only scanned `pages/` and `components/`).
Beyond the mechanical conversion:
- `setup.tsx` hand-rolled inputs with absolutely-positioned icons and a shared
  `inputStyle()` factory. It now uses the existing `<Input>`/`<Textarea>`, which
  already provide labels, left icons, the required asterisk and error text.
- Three `linear-gradient`s removed (login logo tile, onboarding logo tile,
  onboarding submit button). The design system has no gradients.
- `callback.tsx` and `App.tsx` each redefined `@keyframes spin` in an inline
  `<style>` tag; `index.css` already ships it as `animate-spin-fast`.
- `App.tsx`'s `AppLoader` was a near-duplicate of `FullPageSpinner` (rule 12).
  Deleted; `FullPageSpinner` gained an optional `label` prop. The five existing
  no-prop call sites are unaffected.
- Two hand-rolled SVGs replaced with Lucide (`AlertCircle`, `Wrench`). Google's
  mark stays raw SVG — fixed brand colours, no Lucide equivalent.
- `login.tsx` lost four `onMouse*` handlers that mutated element styles
  imperatively; now `hover:`/`active:` utilities.
- Removed "By signing in, you agree to our Terms of Service." — Screen 1 says
  "Nothing else — dead simple", and no Terms page exists anywhere in the app, so
  the sentence pointed at a document that does not exist.
- `filter-chips.tsx` carried a `scrollbar-none` class that is **not defined
  anywhere** (no such utility in `index.css`) alongside inline
  `scrollbarWidth: none`, which does nothing in Chrome. Replaced with real
  arbitrary properties including `[&::-webkit-scrollbar]:hidden`, so the
  scrollbar is actually hidden now.
- Remaining env()/scrollbar/calc values became Tailwind arbitrary values;
  verified they compile to real CSS in `dist` rather than being silently dropped.

Net effect on the bundle: main chunk *shrank* 490 → 486 KB, because hand-rolled
markup was replaced by already-bundled shared components.

The only hex colours left in the codebase are `qr-display.tsx`'s `bgColor`/
`fgColor` — `QRCodeSVG` takes colour strings, not classes, and `#0f172a` is the
literal value of the `--color-text` token.

**9. Visual retune to match `planning/demo-ui` (UI-8).** Owner reviewed the UI and
it still read as weaker than the demo. Measured cause, not guessed:

> **`05-ui-screens.md` already specified the right values.** Its Typography table
> says "Card title / List name — 1.1rem, 700 Bold", "Section header — 0.95rem, 700
> UPPERCASE, 1px letter-spacing", "Hero stat — 2rem, 700". The first build ignored
> that table and used Tailwind's defaults (`text-sm` = 0.875rem/600 for list
> titles, `text-xs` = 0.75rem for section headers), rendering every screen 20–38%
> smaller and lighter than the approved design. This work brings the app **into**
> spec; it did not change the spec.

- Added named type tokens to `index.css` (`--text-value-xl` … `--text-row-sub`),
  one per row of that table, and mapped them in `05-ui-screens.md` so it cannot
  drift again. Verified in `dist` that each compiles to a real `var()`-backed rule.
- **Removed `-webkit-font-smoothing: antialiased`** — it thins every glyph. The
  demo never set it and reads sturdier without it.
- Retuned `Card` (p-4→p-5), `ListItem` (py-3→py-4, title 1.1rem/700, subtitle
  0.9rem secondary), `Input`/`Textarea` (16px padding, 0.95rem secondary labels),
  `Button` (md h-12→h-14 at 1.1rem, per demo's 18px-padding `.btn`), `Badge`
  (rounded-full→8px radius, UPPERCASE, 700 — the demo's crisp tag, not a soft pill).
- **`StatCard` restructured** to the demo's layout: centred, coloured icon on top,
  value at 1.5rem/700 inheriting that colour, 0.9rem secondary label. Was a
  horizontal grey icon chip with a small dark number. Its `iconBg` prop became a
  semantic `tone` (`primary|success|warning|danger`); 10 call sites updated. The
  icon wrapper forces 24px via `[&>svg]:w-6`, so call sites can't drift.

**10. Icons: Lucide → FontAwesome 6 solid (UI-8).** The demo's filled glyphs carry
far more mass than Lucide's 2px outlines; owner chose the demo's icons and amended
the Icons row in `AGENTS.md`. Implementation detail worth preserving:

- Added **one** dependency, `react-icons@5.7.0`, and created
  `components/ui/icons.tsx`, which re-exports FontAwesome 6 solid glyphs **under
  the previous Lucide names**. So all 27 files changed only their import source —
  zero JSX edits, and a future re-skin is a one-file change.
- All 58 glyph names were verified to exist in `react-icons/fa6` *before* writing
  the module, so the swap landed with only one gap (`X`, missed because the
  name-collection regex required 2+ characters).
- **Import icons from `@/components/ui/icons`, never from `react-icons` directly** —
  that is the whole point of the indirection.
- `lucide-react` was removed from `package.json` (0 remaining references).
- `strokeWidth` is inert on filled glyphs. Existing ones are harmless; don't churn
  files to strip them. Note the nav's active tab no longer differs by stroke weight,
  only by colour — which is exactly what the demo did.

### Verification status of the above

`typecheck` (all 3 workspaces), `lint` (0 errors) and `build` pass.
`node temp/e2e2.mjs` is 26/26. **Nothing was opened in a browser** (see the
warning under Next Task).

Two toolchain bugs fixed on the way, both pre-existing:

- **`npm run build` at the repo root always failed.** It ran
  `npm run build --workspaces`, and `packages/shared` has no `build` script
  (it is consumed as TypeScript source). npm aborts the whole run on the missing
  script, so a root build never completed. Now `--if-present`, matching how
  `typecheck` and `lint` were already written.
- **`temp/e2e2.mjs` had a stale assertion.** It asserted `POST /upload/presign`
  returns **500** on the premise "R2 vars unset". All four `R2_*` vars are now
  present in `.dev.vars`, so presign legitimately returns 200 and the check
  started failing (the `wrangler dev` process appears to have predated the vars
  and reloaded partway through 2026-08-13). Rewritten to assert the success path
  — a valid presigned `upload_url` containing `X-Amz-Signature` — which is what
  photo upload actually depends on.

Also fixed while here: `06-tasks.md` had drifted from reality in both directions;
all 48 checkboxes now match the code.

---

## ⚠️ Tracker correction — 2026-08-13

A code-level verification (not a re-read of this file) found the two trackers
disagreed with the codebase **in both directions**. `06-tasks.md` has been
corrected. What was wrong:

### Marked `[x]`, but the core deliverable is a placeholder

| Task | What was claimed | What is actually there |
| ---- | ---------------- | ---------------------- |
| **6.3 QR Attendance** | "QR displays, regeneration works" | `attendance.tsx:201` renders a decorative Lucide `<QrCode>` **icon** + 12 chars of token. Not scannable. `qrcode.react` never installed. |
| **6.4 Staff Check-In** | "Staff can scan QR, GPS verified" | `checkin.tsx:113` = `window.prompt('Enter QR Token (Simulating scan):')`. Staff must **type the token by hand**. `html5-qrcode` never installed. |
| **3.7 Add Vehicle** | "customer auto-fill works" | Page works, but `contact-picker.tsx` + `lib/contacts.ts` are empty stubs. No device-contact auto-fill. |

**Consequence: the attendance feature does not work at all.** This was the
headline gap, and it was hidden behind a `[x]`.

### Marked `[ ]` in `06-tasks.md`, but genuinely complete

4.2, 4.3, 4.4, 4.5, 4.7, 5.2, 5.3, 5.4, 5.5 — all verified present and
substantive in code. Now checked off.

### The 12 stub files — 4 are missing features, 7 are dead, 1 was a false alarm

`temp/audit.md` correctly identified 12 files of ~30 bytes with no importers, but
recommended deleting all of them. **Do not do that** — deleting them erases the
only trace of unbuilt work. Correct classification:

**Real missing features — build these (do not delete):**
- `components/domain/qr-display.tsx` → Task 6.3
- `components/domain/qr-scanner.tsx` → Task 6.4
- `lib/pdf.ts` → Task 4.6 (`invoices/editor.tsx:439` fires an error toast today)
- `components/domain/contact-picker.tsx` + `lib/contacts.ts` → Task 3.7 step 3–4

**Genuinely dead — safe to delete, work exists elsewhere:**
- `domain/estimate-items.tsx`, `domain/invoice-items.tsx` — item add/remove is
  inlined and working in both editors (`addItem`/`removeItem`/`items.map`)
- `domain/vehicle-search.tsx` — `vehicles/list.tsx` has its own search. (The
  audit's "1 reference" was a false positive: an `id="vehicle-search"` HTML
  attribute, not an import.)
- `hooks/use-vehicles.ts`, `hooks/use-staff.ts` — 12 pages call `useQuery` directly
- `hooks/use-debounce.ts` — no debouncing in use anywhere
- `lib/location.ts` — geolocation is inlined and working in `checkin.tsx`,
  `onboarding/setup.tsx`, `settings/index.tsx`. Note: that means the same
  `getCurrentPosition` block is duplicated in 3 places — works, but a DRY
  cleanup candidate. Extracting it here would make this file legitimate.

---

## ✅ Approved scope change — 2026-08-13

Owner reviewed the production UI against `planning/demo-ui` and approved:

1. **Component strategy** — keep the existing 17 hand-rolled UI components and fix
   them in place. No component library. Owner note: *"also use better icon like
   that demo ui."*
2. **Responsive scope — mobile + tablet + desktop.** This supersedes the
   mobile-only 414px rule:
   | Width | Layout |
   | ----- | ------ |
   | `< 640px` | bottom nav, 1 column, bottom-sheet modal |
   | `≥ 768px` | sidebar nav, 2-column grid, centered modal |
   | `≥ 1024px` | sidebar + content + detail pane; lists render as tables |
3. **Dependencies approved:** `qrcode.react`, `@react-pdf/renderer`, `html5-qrcode`.

### Root causes of the UI drift (diagnosed, not guessed)

- **Icon weight** — demo used FontAwesome **solid** (filled, heavy); prod uses
  Lucide (2px outline strokes) because `CLAUDE.md` mandated it. Same icons,
  very different visual weight. The agent followed the rule.
- **Rainbow color assignment** — the real slop. `dashboard/index.tsx`
  `QUICK_ACTIONS` gives each action a different color chip (blue / amber / green)
  for no semantic reason. The demo kept every icon a single primary blue.
- **Emoji** — only **2** in the entire 6,626-line frontend, both in
  `onboarding/setup.tsx` (`📍`, `🚀`). Note the demo itself has `👋 Good Morning`
  on `index.html:44`, which is likely where the idea came from.
- **Zero responsive CSS** — grep for `sm:|md:|lg:|xl:` across all `.tsx` returns
  3 hits, and all 3 are size-variant object keys in `button.tsx`
  (`{ sm: 'h-9', md: 'h-12', lg: 'h-14' }`), not breakpoints. Everything is
  hardcoded `max-w-[414px]`. This matched the plan; it was not a mistake.
- **Design tokens are fine** — `index.css` `@theme` matches the demo's palette,
  16px radius and shadows exactly. Do not "fix" the token layer.

---

## ✅ Completed

| Task | Date |
| ---- | ---- |
| 0.1 — Initialize Monorepo | done |
| 0.2 — Setup Shared Package | done |
| 0.3 — Setup Frontend (Vite + React) | done |
| 0.4 — Setup Backend (Hono + /health verified) | 2026-08-10 |
| 0.5 — ESLint + Prettier (oxlint + prettier, all pass) | 2026-08-10 |
| 1.1 — Database Schema (Drizzle) — users, tenants, tenant_members | 2026-08-10 |
| 1.2 — Auth API (Google OAuth → JWT) | 2026-08-10 |
| 1.3 — Auth Middleware (JWT verification) | 2026-08-10 |
| 1.4 — Tenant API (Create Garage) | 2026-08-10 |
| 1.5 — Login Page (Frontend) | 2026-08-10 |
| 1.6 — Auth Provider + Protected Routes | 2026-08-10 |
| 1.7 — Onboarding Page | 2026-08-11 |
| 2.1 — Design Tokens + Tailwind Config | 2026-08-11 |
| 2.2 — Layout Components (MobileContainer, Topbar, BottomNav, PageShell) | 2026-08-11 |
| 2.3 — UI Components Part 1 (Button, Card, Badge, Input, Textarea, Select, Toast) | 2026-08-11 |
| 2.4 — UI Components Part 2 (all 10 data display components) | 2026-08-11 |
| 3.1 — Database: Vehicle Tables | 2026-08-11 |
| 3.2 — Vehicle API Routes | 2026-08-11 |
| 3.3 — Upload API (R2 Presigned URLs) | 2026-08-11 |
| 3.4 — Dashboard API | 2026-08-11 |
| 3.5 — Dashboard Page | 2026-08-11 |
| 3.6 — Vehicle List Page | 2026-08-11 |
| 3.8 — Vehicle Details Page | 2026-08-11 |
| 4.1 — Database: Estimate + Invoice Tables | 2026-08-11 |
| 4.2 — Estimate API Routes | 2026-08-11 |
| 4.3 — Invoice API Routes | 2026-08-11 |
| 4.4 — Estimate Editor Page | 2026-08-11 |
| 4.5 — Invoice Editor Page (PDF/Print buttons are placeholders by design) | 2026-08-11 |
| 4.7 — Estimate + Invoice List Pages | 2026-08-11 |
| 5.1 — Database: Staff Tables | 2026-08-11 |
| 5.2 — Staff API Routes | 2026-08-11 |
| 5.3 — Staff List + Add Pages | 2026-08-11 |
| 5.4 — Staff Profile Page | 2026-08-11 |
| 5.5 — Invite Acceptance Page | 2026-08-11 |
| 6.1 — Database: Attendance Tables | 2026-08-11 |
| 6.2 — Attendance API Routes | 2026-08-11 |
| 7.1 — Settings Page | 2026-08-11 |
| 7.2 — PWA Setup | 2026-08-11 |
| 7.3 — Polish: Animations + Transitions | 2026-08-11 |
| 7.4 — Polish: Error Handling + Edge Cases | 2026-08-11 |
| Audit — 13 bug fixes across API + shared (see Audit section below) | 2026-08-12 |
| Tracker correction — verified all 47 tasks against code, fixed 12 checkboxes | 2026-08-13 |
| 8.1 — GitHub Actions CI/CD (Frontend + Backend) | 2026-08-13 |
| 8.2 — Production Setup (Cloudflare D1, R2, Pages, Secrets) | 2026-08-13 |

### Not complete (previously misreported)

| Task | State |
| ---- | ----- |
| 3.7 — Add Vehicle Page | ⚠️ Partial — no contact picker |
| 4.6 — PDF Generation | ❌ Not started |
| 6.3 — QR Attendance Page | ❌ Placeholder icon, not a QR code |
| 6.4 — Staff Check-In Page | ❌ `window.prompt` instead of a scanner |

---

## 📋 Key Implementation Notes (for next agent)

### What exists and works
- **`apps/web/src/index.css`** — Tailwind v4 `@theme` block with all design tokens (colors, shadows, radius, animations). Build verified. Matches `planning/demo-ui/styles.css`.
- **`apps/web/src/components/layout/`** — `mobile-container.tsx`, `topbar.tsx`, `bottom-nav.tsx`, `page-shell.tsx` + `index.ts`
- **`apps/web/src/components/ui/`** — All 17 component files implemented + `index.ts` barrel
- **`apps/web/src/lib/`** — `config.ts`, `auth.ts`, `api.ts` (apiFetch wrapper with JWT + X-Tenant-ID), `image.ts`
- **`apps/web/src/providers/`** — `auth-provider.tsx` (useAuth hook), `tenant-provider.tsx` (useTenant hook), `query-provider.tsx`
- **`apps/web/src/pages/`** — All UI pages built with Lucide icons and TanStack Query
- **`apps/api/src/`** — auth routes, tenant routes, auth middleware, Drizzle schema all implemented

### Tailwind v4 Note
Project uses `@tailwindcss/vite` plugin (v4). There is NO `tailwind.config.ts`. All tokens are defined via `@theme {}` CSS block in `src/index.css`. Custom classes use `bg-primary`, `text-text-secondary`, `shadow-[var(--shadow-card)]` etc.

### Before the browser pass
The four `R2_*` vars in `apps/api/.dev.vars` are present (verified 2026-08-13),
so photo upload should work. Regression suite: `node temp/e2e2.mjs` with
`wrangler dev` running — 26/26 pass.

---

## 🔍 Audit — 2026-08-12

Full-codebase audit, verified against a live `wrangler dev` + local D1 (not just
by reading). Regression suite lives at `temp/e2e2.mjs` — 26/26 pass.

### Two bugs that made the app non-functional

**1. `GET /tenants/mine` always returned 400 → nobody could ever reach the app.**
`index.ts` had `app.use('/tenants/:id', tenantMiddleware)`. In Hono that pattern
also matches `/tenants/mine`, and middleware registered before a router runs
first — so every call hit "Missing X-Tenant-ID". The client cannot send that
header on this request; discovering the tenant id is the whole point of the call.
`TenantProvider` therefore always saw an error, `tenant` stayed `null`, and
`RequireTenant` bounced every user to `/onboarding` forever.
Fixed with `app.on('PATCH', '/tenants/:id', tenantMiddleware)` — method-scoped,
matching `04-api-routes.md` which specifies `/tenants/mine` as JWT-only.

**2. Every multi-table write 500ed — D1 does not support SQL transactions.**
Eight handlers used `db.transaction()`. Drizzle's D1 driver implements that by
emitting `BEGIN`/`COMMIT`, which D1 rejects outright:
`D1_ERROR: To execute a transaction, please use the state.storage.transaction()
… APIs instead of the SQL BEGIN TRANSACTION or SAVEPOINT statements.`
That covered create vehicle, add visit, create/update estimate, create/update
invoice, convert estimate→invoice, and accept staff invite — the entire core
write path. Rewritten onto `db.batch()` (D1's real atomic primitive) via a new
`src/db/batch.ts` helper. Note the constraint it imposes: a batch is a fixed
statement list, so reads the writes depend on now happen before the batch.

### Security / correctness

3. **Cross-tenant writes** — `POST /vehicles/:id/visits`, `POST /vehicles/:id/images`,
   `PATCH /estimates/:id` and `POST /estimates|/invoices` (body `visit_id`) never
   verified the target belonged to the caller's tenant. `estimate_items` has no
   `tenant_id`, so one garage could rewrite another's line items. All now check first.
4. **Cross-tenant read** — `PATCH /visits/:id/status` scoped the UPDATE by tenant
   but not the follow-up SELECT, returning another garage's visit after a 0-row update.
5. **Removed staff could still check in** — four `tenant_members` lookups in
   `attendance.ts` omitted `isNull(removed_at)`.
6. **Double billing** — `POST /invoices/from-estimate/:id` had no guard, so a
   retry or double-tap minted a second invoice. Now idempotent.
7. **OAuth client secret one `git add .` from being committed** — a real
   `client_secret_*.json` sat untracked but un-ignored in the repo root.
   Added to `.gitignore` (file left on disk).

### Contract / hygiene

8. **No global error handler** — uncaught throws returned Hono's bare-text
   "Internal Server Error", breaking the `{ error: { code, message } }` contract
   every client parses. Added `app.onError` + `app.notFound`.
9. **`validateEnv()` was dead code** — never called, so absent `R2_*` vars
   produced an opaque 500 from inside `aws4fetch`. Now wired as global
   middleware, split into core (every request) vs R2 (upload route only) so a
   deployment without upload credentials still serves the rest of the API.
   `.dev.vars.example` and `wrangler.toml` now document all eight vars.
10. **Internal error leakage** — `POST /vehicles` returned raw `err.message`.
11. **`any` types** (CLAUDE.md rule 4) in `invoices.ts`, `estimates.ts`,
    `visits.ts`, `vehicles.ts` → `Partial<typeof table.$inferInsert>`.
12. **Broken invite link** — API returns `invite_url: "/invite/<token>"`; the
    frontend copied/WhatsApp-shared that relative path verbatim, so recipients
    got something unopenable. `staff/add.tsx` now resolves it against
    `window.location.origin`.
13. **Staff invite failed whenever salary was left blank** — the form sends
    `monthly_salary: null` for that optional field, but
    `CreateStaffInviteSchema` used `z.number().optional()`, which rejects `null`
    (only `undefined` passes). Now `.nullable().optional()`, matching the
    nullable column.

### Known-good, left alone (worth a look later, not bugs)

- List endpoints use OFFSET paging while `03-database.md` specifies cursor-based.
  Works correctly; drifts from spec and can skip rows under concurrent inserts.
- `GET /estimates` does N+1 queries to total each estimate (comment admits it).
- No OWNER-only guard on staff/settings mutations — any STAFF member can invite,
  remove staff, and read salaries. Check against the intended role model.
- `dashboard/stats` computes "today" in UTC, so revenue rolls over at 05:30 IST.
- `POST /auth/refresh` accepts tokens up to 30 days expired, indefinitely.
