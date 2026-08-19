# Handoff: Autro garage-management UI (mobile-first, responsive)

## Overview
Autro is a garage-management app for small automobile workshops. This bundle covers the **owner app** (sign-in, garage setup, dashboard, vehicles, vehicle detail, add vehicle, estimate, invoice, attendance, settings) and the **staff app** (QR attendance only), as one responsive layout that serves phone and desktop from the same markup.

## ⚠️ Read this first — the design is NOT final or perfect
This is an **exploratory prototype**, not a finished spec. Treat it as intent, not gospel:

- Layout, spacing and hierarchy are a first pass and have known rough edges. Several fixes were made reactively (header padding, label wrapping, list truncation), so expect more of the same.
- The visual system is a generic "Modernist" style (flat, zero radius, 2px rules, Archivo type, single accent). **The real app's existing frontend conventions win.** If Autro's codebase already has a design system, component library, theme tokens, spacing scale, typography or icon set — use those and adapt this layout to them rather than reproducing these CSS values literally.
- Copy, sample data (Indian plates, ₹ amounts, garage name "Sharma Auto Works") and numbers are placeholders.
- Content is invented where the brief was silent: revenue stat, "this month" totals, attendance labels, "Soon" settings rows. Confirm before shipping.
- Accessibility was not audited: focus order, labels, screen-reader semantics, color contrast on the amber/green status pills all need a pass.
- Two things in the prototype are **demo scaffolding, not product UI**: the top "View as Owner / Staff" strip (a role switcher for previewing) and the droppable image placeholders. Drop both.
- No backend: auth, persistence, PDF generation, WhatsApp share, QR generation and GPS verification are all stubbed.

**So: build the screens and flows described below with the app's own frontend building blocks. Where this prototype and the codebase disagree, follow the codebase.**

## About the Design Files
`Autro Prototype.dc.html` (and the blue-accent variant) are **HTML design references** — a runnable prototype of the intended look and behavior. They are not production code and should not be copied into the app. Recreate the screens in Autro's existing environment (its framework, router, component library, state management and styling approach). If a screen already exists in the app, extend it rather than replacing it.

## Fidelity
**Mid-fidelity, leaning hi-fi.** Real flows, real state, real interaction logic; final-ish spacing and type, but the visual identity is a placeholder system and details are unresolved. Use it for structure, information hierarchy, flows and behavior. Use the codebase's design system for styling.

## Screens / Views

### 1. Login (owner)
Purpose: owner signs in. Centered column: logo mark (56–64px square), "Autro" title (~32px bold), one-line value prop (max ~32ch), full-width primary button "Continue with Google" (label flush left), footnote "Owner login only. Staff sign in for attendance."
→ On submit: go to Garage setup (first run) or Dashboard (returning).

### 2. Garage setup / onboarding
Purpose: create the garage record. Single column, max ~420px: "Set up your garage" + "Takes under a minute"; fields Garage name, Phone number, Address (textarea), Logo (optional upload); primary "Create garage" → Dashboard.

### 3. Dashboard (home)
Header: "Dashboard" + profile action (mobile only). Body:
- Three stat cards: **Active repairs**, **Ready**, **This month** (revenue). Desktop: 3-column grid. Mobile: one horizontally scrolling snap row, cards ~62% viewport wide, min 180px, bleeding to the screen edges.
- Two actions: "+ Add vehicle" (primary), "View all vehicles" (secondary).
- "Recent vehicles" section (3 items) + "See all" link; each row: 56px vehicle thumbnail, plate (600/14px, truncates), owner · model (12px, 55% opacity, truncates), status pill right-aligned. Whole row taps into Vehicle detail.

### 4. Vehicles (list)
Header: "Vehicles" + "Add vehicle" primary. Body: search field (matches plate OR owner, case-insensitive), status filter segmented control (All / Repairing / Ready), then the filtered list. Two list presentations exist as a tweak: **Rows** (thumbnail + text + status pill) and **Photo cards** (auto-fill grid, minmax(220px,1fr), 4:3 photo, info + status underneath). Pick one for production; Rows is the default.

### 5. Vehicle detail
Header: back + plate as title, model as subtitle. Body (desktop 1.4fr/1fr, mobile stacked):
- Status segmented control: **Repairing / Ready / Delivered** — changing it updates the vehicle everywhere (list, dashboard counts).
- Photos: 3-up grid of square slots (Front / Damage / Add photo).
- Actions: "Call customer" (secondary), "Create estimate" (primary).
- Customer card: kicker "Customer", name, phone · "Vehicle in since {date}".

### 6. Add vehicle
Back + "Add vehicle". Fields: Customer name, Phone number, Vehicle type (segmented: Car / Bike / Truck / Auto), Plate number, Model, Notes (textarea). Primary "Save vehicle" → back. Max width ~520px.

### 7. Estimate
Back + "New estimate" + plate subtitle. Editable line items: description input (flex) + amount input (100px, digits only) + remove icon button. "+ Add line item" ghost button appends {desc:"New item", amt:"0"}. 2px rule, then **Subtotal** row (bold, 18px, ₹ + en-IN grouping). Primary "Convert to invoice".

### 8. Invoice
Back + "Invoice" + plate subtitle. Desktop: 1fr / 380px; mobile stacked.
- Left: read-only line items (description truncates, amount right, 600 weight); **Tax** segmented (No tax / Add GST 18%); **Discount** (segmented ₹ flat / % + value input); **Payment method** segmented (Cash / UPI / Card).
- Right: elevated total card — kicker "Total due", amount ~28px bold in the accent's deep step; "PDF" secondary; "Share on WhatsApp" primary.
- Math: `total = max(0, subtotal + (tax ? subtotal*0.18 : 0) - (flat ? discountValue : subtotal*discountValue/100))`, formatted en-IN.

### 9. Attendance (owner)
Header "Attendance" + month. Desktop 260px / 1fr, mobile stacked.
- QR card (elevated, flush-left content): kicker "Static QR — display at entrance", 140px QR, "Download QR" secondary. Replace the fake QR with a real generated code.
- "Today's check-ins" list: staff name, time or "Not checked in", status pill (On time / Late / Pending).
- Summary card: "This month" → "3 staff · 78 shifts".

### 10. Settings
Header "Settings". Garage profile card (name, phone · address, "Edit profile"), then a rule + list rows: "Staff & invitations" ›, "Tax & payment defaults" ›, "Dark mode" (Soon), "Language — English" (Soon). "Sign out" ghost button (sidebar on desktop, in-page on mobile).

### 11. Staff attendance (staff role)
Single screen, no nav, max 520px: "Autro / Staff attendance"; status card ("Checked in" / "Not checked in") with either "Checked in at 9:03 AM · GPS verified at Autro Garage" + "Check out", or "Scan the QR code at the garage entrance to check in" + "Scan & check in"; "This week" list (day, time range, status pill).

## Navigation & responsive behavior
- **Desktop (≥861px):** 220px left sidebar — brand block (Autro / garage name), nav items Dashboard, Vehicles, Attendance, Settings (active = accent text + 3px accent left border + accent-100 background), Sign out at the bottom. Content area scrolls; pages capped at 900–1100px.
- **Mobile (≤860px):** sidebar hidden, fixed bottom tab bar (same four destinations, 18px icons + 11px labels, ≥44px targets); content gets 64px bottom padding. Multi-column grids collapse to one column.
- Tab switches reset the nav stack; sub-screens (vehicle detail, add vehicle, estimate, invoice) push onto a stack and the back button pops it (falling back to Dashboard). Vehicle sub-screens keep the Vehicles tab lit.
- Single breakpoint at 860px, plus a 480px tweak for the photo grid. One markup tree, CSS-driven — do not build separate mobile and desktop screens.

## State
`role` owner|staff · `screen` login|onboarding|dashboard|vehicles|vehicleDetail|addVehicle|estimate|invoice|attendance|settings · `stack` (back history) · `search` · `filter` All|Repairing|Ready · `selectedVehicleId` · `vehicles[]` {id, plate, owner, phone, model, type, status, dateIn} · `estimateItems[]` {desc, amt} · `tax` bool · `discountType` flat|percent · `discountVal` · `payment` Cash|UPI|Card · `staffCheckedIn` bool.
Derived: filtered list, selected vehicle, subtotal/tax/discount/total, Active + Ready counts (dashboard stats are computed from `vehicles`, never hardcoded).
Real app additions: auth session, garage profile, per-vehicle photo uploads, invoice records, attendance records, loading + error + empty states (none of which the prototype has).

## Design tokens used in the prototype (placeholders — prefer the codebase's own)
- Ground #f3f2f2 · ink #201e1d · dividers 2px section / 1px row · radius 0 everywhere.
- Accent: Modernist red #ec3013 (deep #8f1c0a, tint #fbe3df). A blue variant matching the user's logo is also provided: #2b62dd (deep #1e449b, tint #e6edfc). Accent is for actions/active nav/totals only.
- Status colors (semantic, deliberately NOT the accent): Ready #1c6b45 on #e4f3ec / border #a9d3bf · Repairing & Late #8a5300 on #fdf0da / #e0c48b · Delivered #4a4644 on #eae8e7 / #cdc9c7 · Pending #6b6664 on transparent / #cdc9c7. Pills: fixed 104px width, centered 11px uppercase 600 label, 1px border, no radius.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32px (there is no 20px step).
- Type: Archivo throughout. Page titles 24px/700 (compact 20px), section titles 26–32px/700, row title 14px/600, row sub 12px, kickers 11px uppercase 0.08em, body 14px.
- Elevation: subtle card shadows only; nothing floats.

## Assets
- `uploads/apple-touch-icon.png` — the user's Autro logo (blue gradient "A" with a wrench). Used as the login mark in the blue variant; ask for full-resolution/SVG source for production.
- Icons: Lucide (home, car, check-square, settings, chevrons, plus, x, whatsapp-ish speech bubble). Use the app's existing icon set if it has one.
- Vehicle photos: none real. Prototype uses droppable placeholders — implement as real uploads.

## Files in this bundle
- `Autro Prototype.dc.html` — the main prototype (red accent, tweakable accent/density/list-style).
- `Autro Prototype Blue.dc.html` — same UI with the logo's blue accent and the logo on login.
- `apple-touch-icon.png` — the logo as supplied.
Open either HTML file in a browser and resize the window to see the responsive behavior. The "View as Owner/Staff" strip at the top is prototype-only.

## Suggested build order
1. App shell + responsive nav (sidebar ↔ bottom tabs) with the codebase's routing.
2. Vehicles list + detail with real data and the status change.
3. Add vehicle form + validation.
4. Estimate → invoice with the money math, then PDF/WhatsApp.
5. Attendance (QR generation, scan, GPS check) for owner and staff.
6. Auth, garage setup, settings.
Confirm visual details against the app's design system as you go — and expect to improve on this prototype, not mirror it.
