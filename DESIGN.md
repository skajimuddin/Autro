# Autro — Design System

> This is the single source of truth for how Autro looks and how its UI is
> built. Read it before touching anything under `apps/web/src/components` or
> `apps/web/src/pages`. If code and this file disagree, fix whichever one is
> wrong — don't just pick a side.

## Where this comes from

`planning/design_handoff_autro_ui/` is a new visual handoff (two runnable
HTML prototypes + a README) dropped into the repo to redefine Autro's look.
This file is the result of reading that handoff and reconciling it with the
frontend that already exists in `apps/web`. It replaces the old `AGENTS.md`
UI section as the design authority.

**Priority order when sources conflict:**

1. **This file** — the decisions actually in force.
2. **The live code in `apps/web/src/components`** — if it disagrees with
   this file, one of them is out of date; fix it, don't shrug at it.
3. **`planning/design_handoff_autro_ui/`** — the *reference* for structure,
   flows and information hierarchy. Not a spec to copy pixel-for-pixel — see
   "The handoff is not the source" below.
4. **`planning/final/05-ui-screens.md`** — the original screen list and the
   token values this app's design system was first built from. Superseded
   by this file wherever the two disagree, but still the record of *why*
   the numbers are what they are.

## The handoff is not the source — the app's frontend is

The handoff's own README says it outright: *"the design is NOT final or
perfect... the real app's existing frontend conventions win."* Believe it.
Two things follow from that:

1. **Never copy the `.dc.html` files' markup, CSS or class names into the
   app.** They're a throwaway prototype (custom `<sc-if>`/`<sc-for>`
   templating, a bespoke `styles.css` bundle, zero build step) — none of it
   is React, none of it is Tailwind, and it was never meant to ship. Recreate
   the *screens*, not the *files*.
2. **Convert intent, don't transcribe pixels.** Where the handoff shows a
   layout, a flow, or a piece of information hierarchy that Autro's app is
   missing, build it — with Autro's own components, tokens, icon set and
   spacing scale. Where the handoff's visual system (flat surfaces, zero
   border-radius, Archivo type, single hard-coded accent) conflicts with
   what's already established below, the established system wins.

### Known flaws in the handoff — do not carry these over

The handoff README flags these itself; repeating them here because "the
design shows it" is not a valid reason to build any of them:

- **The role-switcher strip** ("View as Owner / Staff" pill row) at the top
  of every screen is prototype scaffolding for previewing two roles in one
  file. It is not a screen, a settings toggle, or a feature request — drop
  it entirely. Role is decided by who is logged in, not a UI control.
- **Droppable image placeholders** are a prototype affordance for the demo
  data. Real photo capture/upload already exists (`PhotoUpload`,
  `PhotoGallery` in vehicle details) — don't add a second, fake one.
- **Alignment and spacing are rough in places** — the README calls out
  reactive fixes (header padding, label wrapping, list truncation) as
  incomplete. Don't debug the prototype's CSS; build the equivalent screen
  correctly the first time using this app's spacing/type scale.
- **Content is partly invented** — sample numbers, "Soon" settings rows,
  the exact revenue/attendance stat set. Confirm against `planning/final/`
  and the actual API shape (`apps/api/src/routes`) before wiring a stat that
  doesn't exist yet; don't hardcode the handoff's placeholder numbers.
- **A segmented "set any status directly" control** for vehicle status
  (Repairing / Ready / Delivered as three equally-clickable options) is
  shown in the handoff. Autro's app deliberately does **not** do this: status
  changes are one-way, forward-only mutations tied to the real API
  (`Start Repair` → `Mark as Ready` → `Mark Delivered`, see
  `vehicles/details.tsx`). That's an intentional improvement over the
  prototype, not a gap — don't "fix" it back to a free-choice segmented
  control.
- **Accessibility was not audited** in the handoff (its own words) — focus
  order, ARIA labels, and contrast on status pills. Don't inherit that gap;
  Autro's components already carry `aria-label`, `role="dialog"`,
  `focus-visible` rings, etc. — keep doing that for anything new.
- No backend is wired in the handoff — auth, PDF, WhatsApp share, QR
  generation and GPS are all stubbed with fake handlers. Autro's app has
  real implementations for all of these (`lib/pdf.ts`, `qr-scanner.tsx`,
  `lib/location.ts`, WhatsApp via `wa.me`) — don't regress them to a stub
  while reshaping a screen.

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

This is Autro's own accent (`#2563eb`, matched to the brand mark, blue —
not the handoff's red default) with the handoff's alternate blue variant
(`#2b62dd`) close enough that no change was needed. **Do not** introduce the
handoff's exact hex, a second blue, or any other accent — one accent, one
value, defined in `apps/web/src/index.css` `@theme`.

`default`/neutral badge (`bg-divider` / `text-secondary`) is for states that
aren't good or bad — e.g. `Delivered`, which is *done*, not a success in the
"payment succeeded" sense. Don't reach for `success` just because a status
feels finished.

### Typography

Font is **Inter** (`index.css`, Google Fonts import). No
`-webkit-font-smoothing: antialiased` — it thins the glyphs; Inter reads
sturdier with the browser default.

Use the named type tokens, not raw Tailwind sizes (`text-sm`/`text-xs`
render smaller/lighter than this scale and will look inconsistent next to
it):

| Token             | Size    | Use                                          |
| ----------------- | ------- | --------------------------------------------- |
| `text-value-xl`   | 2rem    | Hero stat / grand total                       |
| `text-value`      | 1.5rem  | Stat tile value, page greeting                |
| `text-row-title`  | 1.1rem  | List row titles, stat labels, button text     |
| `text-detail`     | 1.05rem | Detail rows                                   |
| `text-label`      | 0.95rem | Form labels, uppercase section headers        |
| `text-row-sub`    | 0.9rem  | Row subtitles, stat tile labels               |

Row titles and stat values are **bold (700)**, not semibold — the whole
system reads heavy on purpose. Section headers are uppercase with
`tracking-[1px]`.

### Spacing, radius, shadow

- Card / button radius: `16px` (`rounded-card` / `rounded-button`)
- Input radius: `12px` (`rounded-input`)
- Page padding: `16px` mobile, `24px` at `md:`+
- Card shadow: `0 4px 6px -1px rgba(0,0,0,0.05)`
- Topbar shadow: `0 2px 10px rgba(0,0,0,0.05)`
- Primary/success button glow: `0 10px 15px -3px rgba(<accent>,0.3)`

The handoff's flat, zero-radius "Modernist" surface style is a *placeholder*
per its own README — Autro's rounded, soft-shadow surfaces are the real
system and are not being flattened to match it.

### Icons

FontAwesome 6 solid, via `react-icons/fa6`, always imported from
`@/components/ui/icons` — never from `react-icons` directly. That module
re-exports every glyph under one stable semantic name so the whole app can
be re-skinned from one file. Need a new glyph? Add it there with a comment,
then import it from there. `strokeWidth` has no effect on a filled glyph;
harmless if present, not required on new code.

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

One markup tree per screen, CSS-driven — never a separate mobile and
desktop component for the same screen.

| Width | Nav | Content | Modal |
| ----- | --- | ------- | ----- |
| `< 768px` (base) | Fixed bottom bar, 4 tabs, icon+label | 1 column, full-bleed cards, 16px padding | Bottom sheet |
| `≥ 768px` (`md:`) | Left sidebar (`w-60`), icon+label always visible | Content offset by sidebar, `max-w-3xl` | Centered dialog |
| `≥ 1024px` (`lg:`) | Left sidebar | Wider pages (`wide` prop on `PageShell`) may go `max-w-6xl`; lists render as **tables**, not stacked cards | Centered dialog |

- `BottomNav` is one component (`components/layout/bottom-nav.tsx`) that
  renders as a bottom bar or a sidebar by breakpoint — not two components.
- `Modal` is one component that renders as a bottom sheet or a centered
  dialog by breakpoint — same rule, and it already matches the handoff's
  explicit instruction that these must be "the same component... not two
  components."
- Minimum supported width: 360px, no horizontal scroll. Use
  `env(safe-area-inset-bottom)` on the bottom nav for notched phones.
- Verify new screens at 360 / 414 / 768 / 1024 / 1440.

## Component inventory

Search this list — and the actual files — before writing a new component.
Duplicating an existing pattern inline (see "Patterns adopted from the
handoff" below for one that had drifted into copy-paste) is the thing to
avoid.

**Layout** (`components/layout/`): `PageShell` (topbar + content + nav
wrapper — every page uses it), `Topbar`, `BottomNav`.

**UI** (`components/ui/`): `Button` (primary/outline/dashed/success/ghost),
`Card`, `Badge` (success/warning/danger/default status pill), `Input`,
`Textarea`, `Select`, `SearchBar`, `FilterChips`, `SegmentedControl`,
`StatCard`, `ListItem`, `PriceRow`, `TotalRow`, `PhotoUpload`, `EmptyState`,
`Loading`/`ListItemSkeleton`/`StatCardSkeleton`/`FullPageSpinner`, `Modal`,
`ToastContainer`/`useToast`.

**Domain** (`components/domain/`): `VehicleSearch`, `ContactPicker`,
`QRDisplay`, `QRScanner`.

`estimate-items.tsx` and `invoice-items.tsx` also exist in this folder but
are dead two-line stubs (`export {}`, never imported anywhere) — the line-
item UI they were meant to hold is built inline in `estimates/editor.tsx`
and `invoices/editor.tsx` instead, and the two editors already share the
same shape by hand. Same story for `hooks/use-debounce.ts`,
`hooks/use-staff.ts`, and `lib/location.ts` — all unimported stubs; every
page that needs geolocation (`onboarding/setup.tsx`, `settings/index.tsx`,
`staff/checkin.tsx`) calls `navigator.geolocation.getCurrentPosition`
inline instead of through the never-built helper. None of this was
introduced by this change — it predates it — but it means: don't trust a
file's existence as proof a pattern is implemented, and don't import these
five files expecting them to do anything. Either build them out for real
next time one of these screens is touched, or delete them — the old
`AGENTS.md` rule ("never create an empty placeholder file... build the file
or leave it absent") applies to leaving them as-is too.

## Patterns adopted from the handoff

These are cases where the handoff showed a real, worthwhile pattern that
Autro's app either lacked or had reimplemented inconsistently — adapted to
the existing tokens, not copied as CSS.

- **Segmented control.** The handoff's `.seg`/`.seg-opt` pill group (used
  for discount type, payment mode, tax mode) is a genuine reusable pattern.
  It already existed in this app, but as identical hand-rolled JSX pasted
  into both `estimates/editor.tsx` and `invoices/editor.tsx` for the
  Flat/% discount-type choice. Extracted into `components/ui/
  segmented-control.tsx` (`SegmentedControl<T>`), styled with the app's own
  `rounded-full` pill + `bg-primary` active state rather than the handoff's
  flat/bordered look, and both editors now import the one component. Reach
  for it for any small (2–4 option) mutually-exclusive choice rendered
  inline rather than in a modal or dropdown.
- **Status pill semantics.** The handoff's Ready/Repairing-Late/Delivered/
  Pending color mapping (green / amber / neutral / neutral) confirmed
  Autro's existing `Badge` mapping was already right — `Badge` keeps its
  `success`/`warning`/`danger`/`default` variants; `Delivered` stays
  `default` (neutral), not `success`.
- **Modal-as-one-component-two-layouts** and **nav-as-one-component-two-
  layouts** — both already implemented (`Modal`, `BottomNav`); the handoff's
  explicit call-out for this confirmed the existing approach rather than
  changing it.

Where the handoff showed something Autro's data model doesn't actually
support the same way (free-choice status segmented control; a fixed "No
tax / Add GST 18%" toggle vs. Autro's arbitrary tax-percent field), the
app's own, already-implemented approach was kept — see "Known flaws" above.

## Rules

- Tailwind utility classes only. No inline `style={}` — the two apparent
  hits in the codebase (`onboarding/setup.tsx`, `auth/callback.tsx`) are
  comments documenting a past fix, not live inline styles; keep it that way.
- Hard-coded hex colors are only acceptable for things that are inherently
  not a design token: the multi-color Google "G" mark on the login button,
  and the `fgColor`/`bgColor` props a QR-rendering library requires as
  literal strings. Anything else, use a token.
- Every page is wrapped in `<PageShell>`. Don't hand-roll a topbar/nav.
- Empty states use `<EmptyState>`, loading states use the skeleton
  components — never a bare spinner or a blank screen for a list.
- New icons: add to `components/ui/icons.tsx`, import from there.
- Generic component names (`SegmentedControl`, not
  `DiscountTypeSelector`) when the pattern isn't tied to one screen.

## Screens

Route ↔ handoff screen ↔ implementation, for orientation. All 17 screens
from `planning/final/05-ui-screens.md` are implemented; the handoff's 11
screens map onto a subset of the same flows (it omits estimates/invoices as
separate list screens, staff salary, and the invite flow, and it renames a
few things — "Vehicles" list `Rows` vs `Photo cards` toggle from the
handoff is not implemented, `Rows` — i.e. `ListItem`/table — is the only
list style, matching the handoff's own "pick one for production" note).

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
