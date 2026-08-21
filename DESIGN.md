# Autro — Design System

> Source of truth for how Autro looks. Read before touching anything under
> `apps/web/src/components` or `apps/web/src/pages`.

## Where this comes from

Rebuilt 2026-08-20 from an approved design explored outside the repo and
signed off screen by screen. It replaces the previous flat/zero-radius system
and the rounded blue system that briefly followed it.

**Migrated so far: the dashboard, the three vehicle screens, `/invoices`,
`/estimates` and `/staff`. Every other screen still renders its content with
Tailwind** and will be migrated one at a time. Both systems read the same palette (below), so
they do not drift while that is in progress.

## Foundations

### The single brand colour

`theme.ts` exports `BRAND` and nothing else may define a brand hex.

| Scheme | Value     | Notes                            |
| ------ | --------- | -------------------------------- |
| light  | `#3560C0` | Autro blue at **72%** saturation |
| dark   | `#8DABF0` | same hue, lightness inverted     |

The app's original `#2563EB` is **84%** saturation, and that is what made it
glow: at that chroma every surface it touched shouted. The hue is unchanged,
so the brand still reads as Autro.

Measured contrast (AA needs 4.5): white on light brand **5.86:1**; `#10151E`
on dark brand **8.03:1**.

**The brand is not a status colour.** It appears on the primary action, the
active nav item and the hero figure — three times per screen. Overdue jobs and
late check-ins use `warning`, so blue keeps meaning _action_.

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

## Shared components

A screen must not re-implement something another screen already draws. Anything
two screens show is one component, in one file:

| Component      | File                                 | Rendered by                            |
| -------------- | ------------------------------------ | -------------------------------------- |
| `VehicleList`  | `components/domain/vehicle-list.tsx` | dashboard panel, `/vehicles`           |
| `StageChip`    | `components/ui/stage-chip.tsx`       | anywhere a stage is shown              |
| `SectionCard`  | `components/ui/section-card.tsx`     | every titled panel                     |
| `EmptyPanel`   | `components/ui/empty-panel.tsx`      | every "nothing here yet" body          |
| `Kicker`       | `components/ui/kicker.tsx`           | stat labels, card kickers              |
| `Field`        | `components/ui/field.tsx`            | every MUI form field                   |
| format helpers | `lib/format.ts`                      | money, dates, times, day counts, stages |
| photo upload   | `lib/upload.ts`                      | Add Vehicle, vehicle detail            |

This is not tidiness. The dashboard and `/vehicles` previously drew the same
rows from two components and had already drifted: one painted `REPAIRING`
amber and `NEW` blue, the other left both neutral, and each computed
days-in-shop separately.

Form fields get their height, radius, border and focus from the
`MuiOutlinedInput` overrides in `theme.ts` — never from `sx` at a call site.

**Icons.** Migrated screens use `@mui/icons-material`. `components/ui/icons.tsx`
(Lucide) exists only for the screens still on Tailwind and shrinks as they
migrate; nothing new should be added to it.

## Rules

- **Never hard-code a colour.** MUI screens use palette keys; Tailwind screens
  use the tokens in `index.css`. Both resolve to the same `--au-*` variables.
- Money and counts use `fontVariantNumeric: 'tabular-nums'` so columns align.
- Every figure must be backed by a real endpoint. If the data does not exist,
  the element does not ship — see the dashboard's missing money column.
- Check what an icon actually draws. `LuReceipt` contains a dollar sign; this
  app is ₹ only.
- **Colour is spent, not sprinkled.** Blue is the primary action, the active
  nav item and the stage a job is at. Amber means one thing: a visit past
  `STALE_AFTER_DAYS`. A complaint is not an alert and a customer is not a
  banner — both were coloured before and are plain now.
- A filter's selected state is a change of surface, never brand colour: five
  blue pills beside one blue button teach nobody what blue means.

## Layout

- `PageShell` wraps every page: sidebar at `md:`+, mobile tab bar below.
- The mobile bar carries a centred **Add vehicle** action, an active-tab pill,
  and a 56px hit area per tab.
- `Topbar` renders in two forms. Below `md` it is an **app bar**: brand tile,
  page name (`mobileTitle`), garage name, action. At `md:`+ it is the page
  header: large title, subtitle, action, no rule. Mobile needs the brand mark
  and garage name because the sidebar that carries them is hidden there.
- `Topbar` content sits in the same max-width column as the page body, so the
  title does not drift left of the content on wide screens.
- `subtitle` takes a node, so a page can style its own second line.
- `mobileSubtitle` replaces the garage name on the mobile app bar's second
  line. Top-level screens want the garage; a sub-screen wants the thing it is
  about (a vehicle's model) — you know which garage you are in by then.
- `mobileAction={null}` gives the app bar no action at all. Only `undefined`
  falls back to `rightAction`, so a list page whose add button already sits in
  the mobile tab bar does not get a second one crowding a 62px bar.
- Detail and form screens (`hideNav`) carry their primary actions in a bar
  fixed to the bottom of the screen below `md:`, within thumb reach; at `md:`+
  those actions move to the page header and the bar is gone.

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
