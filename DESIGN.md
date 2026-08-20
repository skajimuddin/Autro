# Autro — Design System

> Single source of truth for how Autro looks and how its UI is built. Read it
> before touching anything under `apps/web/src/components` or
> `apps/web/src/pages`. If code and this file disagree, fix whichever one is
> wrong — don't just pick a side.

## Current system: rounded, tinted, table-on-desktop

Rebuilt **2026-08-20**. This replaced the previous flat "Modernist" system
(zero radius, bordered boxes, fixed-width uppercase status tags) that had been
adapted from `planning/design_handoff_autro_ui/`. That handoff is now
**historical reference only** — where it and this file disagree, this file wins.

What changed, and why:

| Before                               | Now                                                 | Reason                                                                                         |
| ------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Radius `0` everywhere                | 16px surfaces, 12px tiles, pill buttons/chips       | The owner asked for a modern rounded app; flat-square surfaces read as unfinished, not minimal |
| Fixed 104px uppercase status tags    | Pills sized to their label, tinted fill + deep text | A chip that hugs its label reads as data; the old one read as a form control                   |
| `text-warning` on `bg-warning-light` | `text-warning-deep` on `bg-warning-light`           | The old pairing was ~2:1 contrast and failed WCAG AA                                           |
| One flat row list at every width     | Table at `md:+`, rounded row cards below            | A six-column table is illegible at 360px; a card stack wastes a 1360px screen                  |
| Four-tile stat grid on the dashboard | Compact stat strip                                  | The tiles pushed the vehicle list below the fold                                               |

## Foundations

### Color — semantic only, never decorative

All tokens live in `apps/web/src/index.css` `@theme`. **No component hard-codes
a hex**, so re-theming the app is a change to these values and nothing else.

| Token                                       | Hex                                           | Usage                                                   |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `primary` / `-hover` / `-light`             | `#2563eb` / `#1d4ed8` / `#dbeafe`             | The one accent: CTAs, active nav, links, focus rings    |
| `bg`                                        | `#f8f9fb`                                     | Page ground                                             |
| `card`                                      | `#ffffff`                                     | Cards, table surface, nav                               |
| `divider` / `border`                        | `#edf0f3` / `#dfe3e9`                         | Hairline on surfaces / stronger stroke on inputs        |
| `subtle`                                    | `#f5f6f8`                                     | Filled neutral: search fields, thumbnails, table header |
| `text` / `-secondary` / `-muted` / `-faint` | `#0f172a` / `#64748b` / `#94a3b8` / `#cbd5e1` | Ink ramp; `faint` is chevrons and empty cells           |
| `success` / `-light` / `-deep`              | `#10b981` / `#d1fae5` / `#047857`             | Ready, paid, present                                    |
| `warning` / `-light` / `-deep`              | `#f59e0b` / `#fef3c7` / `#b45309`             | Repairing, late, stale job                              |
| `danger` / `-light` / `-deep`               | `#ef4444` / `#fee2e2` / `#b91c1c`             | Unpaid, absent, destructive                             |

**The three-step status pattern matters**: `-light` is the chip fill, the base
hue is the dot/graphic, `-deep` is chip _text_. Never put base-hue text on its
own tint — that's the contrast bug listed above.

### Typography

**Archivo** (Google Fonts, `index.css`), weights 400–800. Use the named tokens,
not raw Tailwind sizes:

| Token                            | Size | Use                                                         |
| -------------------------------- | ---- | ----------------------------------------------------------- |
| `text-value-xl`                  | 28px | Stat numbers, grand totals                                  |
| `text-value`                     | 22px | Secondary numbers (customer name on detail)                 |
| `text-row-title` / `text-detail` | 14px | Row titles, button labels, line items                       |
| `text-label`                     | 13px | Form field labels                                           |
| `text-row-sub`                   | 12px | Row subtitles, captions, chips                              |
| `text-kicker`                    | 11px | Uppercase kickers — pair with `uppercase tracking-[0.08em]` |

Page titles are `font-extrabold` with `tracking-[-0.01em]`. Money and counts get
tabular figures — `table` and `.tabular` both set `font-variant-numeric`.

### Radius, shadow, spacing

- `rounded-card` **16px** (surfaces), `rounded-tile` **12px** (thumbnails, icon
  squares, nav items), `rounded-input` **10px**, `rounded-button` **9999px**
  (every button and chip is a pill).
- Three shadow levels, one formula each — **never an ad-hoc shadow at a call
  site**: `--shadow-card` (resting surface), `--shadow-elev-md` (the one
  important card / modals), `--shadow-primary` (filled primary controls only).
- Every white surface carries a hairline border **and** its shadow. On this
  light ground, shadow-only reads hazy and border-only reads hard.
- Page padding: `px-4` mobile, `px-7` at `md:+`.

### Icons

**Lucide** via `react-icons/lu`, always imported from `@/components/ui/icons` —
never from `react-icons` directly. Need a new glyph? Add it there first.

**Check what a glyph actually draws before mapping it.** `LuReceipt` contains a
literal dollar sign; in an app where every amount is ₹ the correct glyph is
`LuReceiptIndianRupee`. Because every call site imports the semantic name
(`Receipt`), fixing that was a one-line change in `icons.tsx` — which is the
whole reason the file exists.

### Motion

Button press `active:scale-press`; row press `active:scale-[0.99]`; page enter
fade+slide 200ms (applied by `PageShell`); modal slides up from the bottom edge
on mobile, fades on desktop; toast slides in from top, auto-dismiss ~3.5s.

### No emoji, light mode only, ₹ only

No emoji in rendered UI — use an icon. Light mode only. Currency is hardcoded ₹
with `en-IN` grouping; this is an India-first garage tool.

## Layout & responsive rules

| Width     | Nav                                                        | Content                                                       |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `< 768px` | Fixed bottom tab bar (4 tabs, 3 for STAFF)                 | 1 column, 16px padding                                        |
| `≥ 768px` | Left sidebar 224px — brand, grouped sections, account chip | Offset by sidebar; `max-w-3xl`, or `lg:max-w-6xl` with `wide` |

- `BottomNav` renders **both** the mobile bar and the sidebar; `hideNav` on
  `PageShell` hides only the **mobile** bar (for sub-screens with their own
  bottom action bar). The desktop sidebar always stays — a detail screen on a
  1360px window still belongs inside the app shell.
- Pass `wide` for table screens and the two-column vehicle detail. `PageShell`
  forwards it to `Topbar`, whose **content** sits in the same max-width column
  as the page body while the bar itself spans full width. Without that, the
  page title drifts left of the content on wide screens, where the body is
  centred and the title is not.
- Anything that repeats on a track (the status stepper) is laid out on equal
  grid columns, never a flex row: flex sizes columns to their label widths, so
  "New" and "Repairing" produce visibly uneven spacing.
- Cap decorative grids. An uncapped `grid-cols-3` of squares inside the ~900px
  detail column renders a 280px "Add photo" placeholder.
- Minimum supported width 360px, no horizontal scroll. The vehicle table sets
  `min-w-[720px]` and scrolls **inside its own card**, never the page.
- Staff/Attendance are `RequireOwner` routes, so the nav hides them for STAFF
  rather than rendering a tab that bounces the user back.

### Lists: table at `md:+`, cards below

This is a deliberate reversal of the old "one markup tree at every width" rule.
`VehicleListView` (`components/domain/`) owns **both** branches so they render
the same fields from the same data and cannot drift in content — only in
layout. Any new list of records follows this component, not a hand-rolled copy.

Desktop tables use `table-fixed` with explicit `w-[N%]` on the `th`s. With auto
layout the free-text column collapsed to a few characters, because every other
column held short unbreakable strings.

## Component inventory

Search this list — and the actual files — before writing a new component.

**Layout** (`components/layout/`): `PageShell` (every page uses it), `Topbar`
(supports `subtitle`), `BottomNav`.

**UI** (`components/ui/`): `Button` (primary/outline/dashed/success/ghost),
`Card` (plain or `elevated`), `Badge` (success/warning/danger/info/default,
optional `dot`), `StatCard`, `StatPill`, `Input`, `Textarea`, `Select`,
`SearchBar`, `SegmentedControl`, `FilterChips`, `ListItem`, `PriceRow`,
`TotalRow`, `PhotoUpload`, `EmptyState`, `Modal`, `ToastContainer`/`useToast`,
and skeletons: `Loading`, `ListItemSkeleton`, `TableRowSkeleton`,
`StatCardSkeleton`, `StatPillSkeleton`, `FullPageSpinner`.

**Domain** (`components/domain/`): `VehicleListView`, `VehicleSearch`,
`ContactPicker`, `QRDisplay`, `QRScanner`.

Skeletons mirror the shape of what they replace, so nothing shifts when data
lands. `estimate-items.tsx` / `invoice-items.tsx` are still dead two-line stubs
(the line-item UI is inline in the editors) — build them out or delete them next
time those screens are touched.

## The rule that governs everything: no UI without data behind it

A control that does nothing, or a figure with no endpoint, is worse than no
control at all. Things deliberately **not** built, with the reason:

- **No notification bell** — the app has no notifications feature.
- **No ⌘K search field in the sidebar** — there is no command palette.
- **No workspace-switcher chevron** — a user has exactly one garage
  (`tenant-provider`).
- **No revenue trend/delta** — `GET /dashboard/stats` returns today's total with
  nothing to compare against.
- **No "showing N of M"** — `GET /vehicles` is cursor paginated and returns no
  total count.
- **No money column in the vehicle table** — per-vehicle estimate/invoice totals
  are computed per record in `GET /vehicles/:id` (item sum + discount + tax) and
  aren't on the list endpoint. Adding it means real backend work, not a column.
- **No status filter on the dashboard** — it fetches one unfiltered page, so
  client-side filtering would silently filter only what's loaded. Filtering
  lives on `/vehicles`, which filters server-side.

When a screen genuinely needs a field the API lacks, **add it to the API** —
that's how the table's Job and In-shop columns got real: `GET /vehicles` now
selects `complaint` and `visit_started_at` from the visit it was already
joining, at no extra query cost.

## Rules

- Tailwind utility classes only. No inline `style={}`.
- Hard-coded hex is only acceptable where it is inherently not a token: the
  Google "G" mark on the login button, and the `fgColor`/`bgColor` props a QR
  library requires as literal strings.
- Every page is wrapped in `<PageShell>`. Don't hand-roll a topbar or nav.
- Empty states use `<EmptyState>`; loading uses the matching skeleton — never a
  bare spinner or a blank screen for a list.
- Paginated endpoints return a `cursor`; a "Load more" button must actually use
  it (`useInfiniteQuery`). Three lists shipped with a dead button before.
- A mutation invalidates **every** query its result appears in — a vehicle's
  status shows on the detail, the list and the dashboard counts.
- New icons: add to `components/ui/icons.tsx`, import from there.

## Screens

| Route                                         | File                         |
| --------------------------------------------- | ---------------------------- |
| `/login`                                      | `pages/auth/login.tsx`       |
| `/onboarding`                                 | `pages/onboarding/setup.tsx` |
| `/`                                           | `pages/dashboard/index.tsx`  |
| `/vehicles`, `/vehicles/add`, `/vehicles/:id` | `pages/vehicles/*`           |
| `/estimates`, `/estimates/:id`                | `pages/estimates/*`          |
| `/invoices`, `/invoices/:id`                  | `pages/invoices/*`           |
| `/staff`, `/staff/add`, `/staff/:id`          | `pages/staff/*`              |
| `/staff/attendance` (owner)                   | `pages/staff/attendance.tsx` |
| `/checkin` (staff)                            | `pages/staff/checkin.tsx`    |
| `/invite/:token`                              | `pages/invite/accept.tsx`    |
| `/settings`                                   | `pages/settings/index.tsx`   |
