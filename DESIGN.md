# Autro — Design System

> Source of truth for how Autro looks. Read before touching anything under
> `apps/web/src/components` or `apps/web/src/pages`.

## Where this comes from

Rebuilt 2026-08-20 from an approved design explored outside the repo and
signed off screen by screen. It replaces the previous flat/zero-radius system
and the rounded blue system that briefly followed it.

**The dashboard is migrated. Every other screen still renders its content with
Tailwind** and will be migrated one at a time. Both systems read the same
palette (below), so they do not drift while that is in progress.

## Foundations

### The single brand colour

`theme.ts` exports `BRAND` and nothing else may define a brand hex.

| Scheme | Value | Notes |
| ------ | ----- | ----- |
| light | `#3560C0` | Autro blue at **72%** saturation |
| dark | `#8DABF0` | same hue, lightness inverted |

The app's original `#2563EB` is **84%** saturation, and that is what made it
glow: at that chroma every surface it touched shouted. The hue is unchanged,
so the brand still reads as Autro.

Measured contrast (AA needs 4.5): white on light brand **5.86:1**; `#10151E`
on dark brand **8.03:1**.

**The brand is not a status colour.** It appears on the primary action, the
active nav item and the hero figure — three times per screen. Overdue jobs and
late check-ins use `warning`, so blue keeps meaning *action*.

**No coloured shadows.** `--shadow-primary` is neutral. A tinted halo under
every button was a large part of what made the previous UI read as loud.

### Status colour is spent only where a decision is needed

Most rows in a real workshop are `REPAIRING`; colouring them all makes colour
meaningless. `stageChipSx()` gives `READY` a green (come collect it) and
`DELIVERED` a hollow outline; `NEW` and `REPAIRING` are neutral tints.

### Colour schemes

MUI's CSS-variable provider stamps `data-mui-color-scheme` on `<html>`, and
`index.css` keys the Tailwind tokens off the same attribute — so a screen that
has not been migrated yet flips with the rest instead of staying light.
`InitColorSchemeScript` runs before first paint, so there is no light flash.

### Typography

**Geist**, self-hosted at `public/fonts/geist-var.woff2` — one 29 KB variable
file covering 400–700. Deliberately not Inter (the most-used UI font on the
web reads as a default, not a decision), and its even-width numerals matter on
a screen that is mostly money and counts.

Never re-add a Google Fonts `@import`: it is a render-blocking third-party
request on every load, and this app is a PWA, so it yields no font at all
offline. That is also why the font "looked weird" during design review — the
request was silently blocked and everything fell back to a system face.

## Rules

- **Never hard-code a colour.** MUI screens use palette keys; Tailwind screens
  use the tokens in `index.css`. Both resolve to the same `--au-*` variables.
- Money and counts use `fontVariantNumeric: 'tabular-nums'` so columns align.
- Every figure must be backed by a real endpoint. If the data does not exist,
  the element does not ship — see the dashboard's missing money column, and
  `revenue_yesterday`, which was added to `GET /dashboard/stats` precisely so
  the change figure could be real.
- Check what an icon actually draws. `LuReceipt` contains a dollar sign; this
  app is ₹ only.

## Layout

- `PageShell` wraps every page: sidebar at `md:`+, mobile tab bar below.
- The mobile bar carries a centred **Add vehicle** action, an active-tab pill,
  and a 56px hit area per tab.
- `Topbar` content sits in the same max-width column as the page body, so the
  title does not drift left of the content on wide screens.
- `subtitle` takes a node, so a page can style its own second line.

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
