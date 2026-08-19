# Autro — Design System

> This is the single source of truth for how Autro looks and how its UI is
> built. Read it before touching anything under `apps/web/src/components` or
> `apps/web/src/pages`. If code and this file disagree, fix whichever one is
> wrong — don't just pick a side.

## Where this comes from

`planning/design_handoff_autro_ui/` is a visual handoff (two runnable HTML
prototypes + a README) dropped into the repo to redefine Autro's look. This
file is the result of reading that handoff and reconciling it with the
frontend in `apps/web`. It replaces the old `AGENTS.md` UI section as the
design authority.

**This was a full visual redesign, not a token tweak.** An earlier pass at
this file tried to keep the app's previous rounded/Inter/FontAwesome system
and only borrow *patterns* from the handoff. The owner was explicit that
that was wrong: the brief is to implement the handoff's actual look —
flat surfaces, zero radius, Archivo type, thin-stroke icons — across every
screen, adapted to this app's real data and routes, not a redesign in name
only. That is what's now built and what this file documents.

**Priority order when sources conflict:**

1. **This file** — the decisions actually in force.
2. **The live code in `apps/web/src/components`** — if it disagrees with
   this file, one of them is out of date; fix it, don't shrug at it.
3. **`planning/design_handoff_autro_ui/`** — the visual and structural
   reference. Its literal CSS values win wherever this app has no
   conflicting real-data reason not to follow them (see "Known flaws" for
   the actual exceptions — there are few, and each is justified below, not
   assumed).
4. **`planning/final/05-ui-screens.md`** — the original screen list and API
   contract. Still the record of what data each screen needs; its old visual
   tokens (rounded surfaces, Inter, FontAwesome) are superseded by this file.

## The handoff is the visual source — adapted where the app's data disagrees

The handoff's own README calls itself an exploratory prototype with rough
edges, invented placeholder content, and two pieces of pure demo scaffolding.
That's still true, and still matters — but it's a note about *fidelity in
places*, not license to skip the redesign. In force:

1. **Don't copy the `.dc.html` files' markup, CSS or class names verbatim.**
   They're a custom templating prototype (`<sc-if>`/`<sc-for>`, a bespoke
   `styles.css` this repo doesn't have a copy of) — not React, not Tailwind.
   Rebuild each screen's actual visual system (flat cards, zero radius, the
   type scale below, thin-stroke icons) with this app's components.
2. **Where the handoff's structure fits this app's real data, use it as-is**
   — the dashboard's 3-stat-row + recent-vehicles list, the vehicle detail's
   segmented status control, the flat divided row list, the elevated total
   card. Where it doesn't (a field with no backend column, a flow the real
   API doesn't support), adapt — see "Known flaws" below for the actual list;
   don't invent more exceptions than what's there.

### Known flaws in the handoff — do not carry these over

- **The role-switcher strip** ("View as Owner / Staff" pill row) at the top
  of every screen is prototype scaffolding for previewing two roles in one
  file. Not a screen, not a settings toggle — role is decided by who's
  logged in.
- **Droppable image placeholders** are prototype-only. Real photo
  capture/upload already exists (`PhotoUpload`, the vehicle-detail photo
  grid) — don't add a second, fake one.
- **Content is partly invented** — sample numbers, "Soon" settings rows
  pointing at screens (Staff & invitations, Tax & payment defaults) that
  don't exist in this app's routes. Wire real stats from the actual API
  shape (`apps/api/src/routes`); don't add nav rows to screens nobody built.
- **A `Vehicle type` segmented control** (Car/Bike/Truck/Auto) appears on the
  handoff's Add Vehicle screen. `planning/final/03-database.md` is explicit
  that `vehicles` has **no `vehicle_type` column** ("just a free-text `name`
  field... simple") — so this field is not built. Don't add a UI control
  with nothing behind it.
- **A fixed "No tax / Add GST 18%" segmented toggle** is shown for invoice
  tax. This app's `tax_percent` is a real, arbitrary field (not fixed at
  18%), so the actual control is a toggle + percent input, not a two-option
  segment — same underlying idea (on/off), adapted to the real field.
- **Payment method as an inline segmented control** on the invoice screen.
  This app instead confirms payment method in the "Mark as Paid" bottom-sheet
  modal, because marking paid is a real, consequential mutation (freezes the
  total, sets `paid_at`) — picking a method inline before that action exists
  would be misleading. Kept as a modal; restyled flat to match everything
  else.
- Two things the handoff has no equivalent for at all — the complaint card
  and the estimate/invoice financial-summary card on vehicle detail — are
  real backend-driven data (`complaint`, `estimate_total`, `invoice_total`)
  this app has and the handoff's simpler demo never modeled. Kept, restyled
  flat, not dropped.
- No backend is wired in the handoff — auth, PDF, WhatsApp share, QR
  generation and GPS are all stubbed. This app's real implementations
  (`lib/pdf.ts`, `qr-scanner.tsx`, real geolocation calls, WhatsApp via
  `wa.me`) stay real; a redesign never regresses a working feature to a stub.

## Foundations

### Color — semantic only, never decorative

Color carries meaning. It is not used for visual variety — four sibling
icons on a dashboard get four identical blue icons, not a rainbow, unless
each one really is a different status.

| Token             | Hex       | Usage                                       |
| ------------------ | --------- | -------------------------------------------- |
| `primary`          | `#2563eb` | The one accent. CTAs, links, active nav, totals, focus rings |
| `primary-hover`    | `#1d4ed8` | Hover/pressed primary                        |
| `primary-light`    | `#dbeafe` | Icon chip backgrounds, subtle accent fills   |
| `bg`                | `#f1f5f9` | Page background                               |
| `card`              | `#ffffff` | Cards, inputs, nav, modals                    |
| `border`            | `#cbd5e1` | Input/divider borders                         |
| `divider`           | `#e2e8f0` | Row dividers, hairlines                       |
| `text`              | `#0f172a` | Primary text                                  |
| `text-secondary`    | `#64748b` | Labels, captions, section headers             |
| `text-muted`        | `#94a3b8` | Placeholder-weight text, disabled chevrons    |
| `success` / `-light`| `#10b981` / `#d1fae5` | Ready, present, paid, positive state |
| `warning` / `-light`| `#f59e0b` / `#fef3c7` | Repairing, pending, in-progress       |
| `danger` / `-light` | `#ef4444` / `#fee2e2` | Absent, unpaid, error, destructive     |

This is Autro's own accent blue (`#2563eb`, matched to the brand mark) —
close enough to the handoff's blue variant (`#2b62dd`) that it stayed
unchanged rather than introducing a second, near-identical blue. **One
accent, one value**, defined in `apps/web/src/index.css` `@theme`.

`default`/neutral badge (`bg-divider` / `text-secondary`) is for states that
aren't good or bad — e.g. `Delivered`, which is *done*, not a success in the
"payment succeeded" sense. This matches the handoff's own status-color table
(Ready green, Repairing/Late amber, Delivered/Pending neutral) exactly.

### Typography

Font is **Archivo** (`index.css`, Google Fonts import) — the handoff's type
throughout. No `-webkit-font-smoothing: antialiased`; the browser default
reads sturdier.

Use the named type tokens, not raw Tailwind sizes:

| Token             | Size      | Use                                          |
| ----------------- | --------- | --------------------------------------------- |
| `text-value-xl`   | 1.75rem (28px) | Stat-tile numbers, invoice/estimate grand total |
| `text-value`      | 1.375rem (22px) | Secondary numbers (customer-card name)      |
| `text-row-title`  | 0.875rem (14px) | List row titles, button labels — pair with `font-semibold` |
| `text-detail`     | 0.875rem (14px) | Line-item rows (estimate/invoice)           |
| `text-label`      | 0.8125rem (13px) | Form field labels                          |
| `text-row-sub`    | 0.75rem (12px) | Row subtitles, stat tile labels              |
| `text-kicker`     | 0.6875rem (11px) | Uppercase card kickers / section headers — pair with `uppercase tracking-[0.08em]` |

These match the handoff's actual rendered sizes (its README + markup), not
its own occasionally-inconsistent prose description of them.

### Spacing, radius, shadow

- **Radius: zero, everywhere** (`--radius-card`/`-button`/`-input` are all
  `0px`) — the handoff's flat "Modernist" system. Surfaces read as flat
  bordered panels, not rounded cards. The one deliberate exception is
  circular elements that aren't "surfaces" — spinners, a modal's drag-handle
  affordance — which stay `rounded-full`.
- Page padding: `16px` mobile, `24px` at `md:`+.
- Card: `1px` `divider`-colour border + a hairline shadow
  (`--shadow-card: 0 1px 2px rgba(15,23,42,.06)`). An `elevated` variant
  (`--shadow-elev-md`) is for the one "important" card on a screen — invoice
  total, attendance QR, vehicle-detail customer card.
- Dividers: `2px` for section separators (topbar bottom border, nav
  borders), `1px` for row separators inside a list.
- No floating button shadow — "nothing floats" per the handoff. Buttons are
  flat colour, not glowing.

### Icons

**Lucide**, via `react-icons/lu`, always imported from
`@/components/ui/icons` — never from `react-icons` directly. The handoff
draws every icon as a 2px-stroke, round-cap outline glyph (literally
Lucide's own path style); this app previously used FontAwesome **solid**
against an earlier, different demo that no longer governs the design. Each
icon keeps its previous semantic export name (`Car`, `ArrowLeft`, etc.) so
existing call sites didn't need touching — swapping icon sets again later is
still a one-file change. Need a new glyph? Add it to `icons.tsx` with a
comment, then import it from there.

### Motion

- Button press: `active:scale-[0.98]` (`active:scale-press` utility)
- Card hover (desktop): `translate-y-[-2px]` (`hover:lift` utility)
- Page enter: fade + slide up 8px, 200ms (`animate-page-enter`, applied by
  `PageShell`, not per-page)
- Toast: slide in from top, auto-dismiss ~3.5s

### No emoji, light mode only, ₹ only

No emoji anywhere in rendered UI — use an icon. Light mode only, no dark
mode toggle. Currency is hardcoded ₹ (`en-IN` grouping) — this is an India-
first garage tool, not a multi-currency app.

## Layout & responsive rules

One markup tree per screen, CSS-driven — never a separate mobile and desktop
component, and never a separate mobile-card / desktop-table pair for the
same list. The handoff is explicit about this ("One markup tree, CSS-driven
— do not build separate mobile and desktop screens"); the previous
implementation violated it (every list page had a card grid *and* a
lg:-only `<table>`) and that's been removed — lists are one flat
thin-divider row layout at every width now.

| Width | Nav | Content | Modal |
| ----- | --- | ------- | ----- |
| `< 768px` (base) | Fixed bottom bar, 4 tabs, icon+label | 1 column, full-bleed, 16px padding | Bottom sheet |
| `≥ 768px` (`md:`) | Left sidebar (220px, matching the handoff), icon+label always visible, 3px accent left border on the active item | Content offset by sidebar, `max-w-3xl`; several screens (vehicle detail, invoice, attendance) go two-column | Centered dialog |

- `BottomNav` is one component that renders as a bottom bar or a sidebar by
  breakpoint — not two components.
- `Modal` is one component that renders as a bottom sheet or a centered
  dialog by breakpoint — same rule.
- Minimum supported width: 360px, no horizontal scroll. Use
  `env(safe-area-inset-bottom)` on the bottom nav for notched phones.

## Component inventory

Search this list — and the actual files — before writing a new component.

**Layout** (`components/layout/`): `PageShell` (topbar + content + nav
wrapper — every page uses it), `Topbar`, `BottomNav`.

**UI** (`components/ui/`): `Button` (primary/outline/dashed/success/ghost),
`Card` (plain or `elevated`), `Badge` (success/warning/danger/default status
pill, fixed 104px width per the handoff), `Input`, `Textarea`, `Select`,
`SearchBar`, `SegmentedControl` (the handoff's `.seg`/`.seg-opt` — fixed
compact or `fill`), `FilterChips` (flattened, mostly superseded by
`SegmentedControl` — see below), `StatCard` (kicker-first, no icon by
default), `ListItem`, `PriceRow`, `TotalRow`, `PhotoUpload`, `EmptyState`,
`Loading`/`ListItemSkeleton`/`StatCardSkeleton`/`FullPageSpinner`, `Modal`,
`ToastContainer`/`useToast`.

**Domain** (`components/domain/`): `VehicleSearch`, `ContactPicker`,
`QRDisplay`, `QRScanner`.

`estimate-items.tsx` and `invoice-items.tsx` also exist in this folder but
are dead two-line stubs (`export {}`, never imported anywhere) — the line-
item UI they were meant to hold is built inline in `estimates/editor.tsx`
and `invoices/editor.tsx` instead. Same story for `hooks/use-debounce.ts`,
`hooks/use-staff.ts`, and `lib/location.ts` — all unimported stubs; pages
needing geolocation call `navigator.geolocation.getCurrentPosition` inline
instead. Predates this redesign; noted so a file's existence isn't mistaken
for a built pattern. Either build them out next time the relevant screen is
touched, or delete them.

## Patterns from the handoff, and how they landed

- **Segmented control** (`SegmentedControl<T>`) — the handoff's `.seg`
  pattern, now flat/bordered/zero-radius matching it directly. Used for:
  discount type and (still) tax on/off in the editors; the vehicle-status
  control (Repairing/Ready/Delivered — see below); the vehicles-list and
  invoices-list status filters (replacing the old rounded pill `FilterChips`
  there, which the handoff never used for filtering).
- **Free-choice vehicle status.** The handoff shows Repairing/Ready/
  Delivered as three equally-clickable segmented options, changeable in any
  direction. Verified against `apps/api/src/routes/visits.ts`: the status
  PATCH endpoint accepts any of the four statuses directly, no forward-only
  restriction — so this is safe to build exactly as shown, not just
  visually similar to it. `vehicles/details.tsx` uses `SegmentedControl`
  directly wired to that endpoint.
- **Flat divided-row lists** (56px bordered thumbnail + `row-title`/
  `row-sub` + status tag, 1px bottom divider, no per-row Card) — now the one
  list style everywhere (dashboard recent vehicles, vehicles/estimates/
  invoices/staff lists), replacing the old per-row `Card` + separate desktop
  `<table>`.
- **Elevated total-due card** (kicker "Total due" + 28px blue number) on the
  invoice screen, in a two-column layout (`1fr / 380px`) at `md:`+ matching
  the handoff's `app-grid-inv`.
- **Kicker → number stat tiles**, no icon, matching the handoff's actual
  dashboard markup (`card-kicker` then a bare number) rather than the
  previous icon-centred tile from an earlier demo. This app keeps a 4th
  "Unpaid invoices" tile the handoff's 3-tile row doesn't have — real
  backend data the handoff never modeled, not invented copy.
- **The real Autro logo** (`public/apple-touch-icon.png` — already the PWA
  icon set) replaces a generic icon-tile brand mark on the login screen, per
  the handoff README's own instruction for the blue variant.

## Rules

- Tailwind utility classes only. No inline `style={}`.
- Hard-coded hex colors are only acceptable for things that are inherently
  not a design token: the Google "G" mark on the login button, and the
  `fgColor`/`bgColor` props a QR-rendering library requires as literal
  strings. Anything else, use a token.
- Every page is wrapped in `<PageShell>`. Don't hand-roll a topbar/nav.
- Empty states use `<EmptyState>`, loading states use the skeleton
  components — never a bare spinner or a blank screen for a list.
- Lists are one flat row-list markup tree at every width — no `lg:`-only
  `<table>` variant. If a screen genuinely needs tabular columns later,
  that's a deliberate new decision, not a default.
- New icons: add to `components/ui/icons.tsx`, import from there.

## Screens

| Route | File |
| ----- | ---- |
| `/login` | `pages/auth/login.tsx` |
| `/onboarding` | `pages/onboarding/setup.tsx` |
| `/` | `pages/dashboard/index.tsx` |
| `/vehicles`, `/vehicles/add`, `/vehicles/:id` | `pages/vehicles/*` |
| `/estimates`, `/estimates/:id` | `pages/estimates/*` |
| `/invoices`, `/invoices/:id` | `pages/invoices/*` |
| `/staff`, `/staff/add`, `/staff/:id` | `pages/staff/*` |
| `/staff/attendance` (owner) | `pages/staff/attendance.tsx` |
| `/checkin` (staff) | `pages/staff/checkin.tsx` |
| `/invite/:token` | `pages/invite/accept.tsx` |
| `/settings` | `pages/settings/index.tsx` |
