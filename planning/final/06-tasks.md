# Workshop — Task Breakdown

> **How to use this file:**
>
> 1. Give an AI agent ONE task at a time (copy-paste the task block)
> 2. Wait for it to complete and verify the output
> 3. Test it works before moving to the next task
> 4. Check off completed tasks with `[x]`
>
> **Each task is self-contained.** It says exactly what to read, what to create, and what the done criteria is.

---

## Phase 0: Project Setup

### Task 0.1 — Initialize Monorepo

```
GOAL: Create the monorepo root with npm workspaces

READ: planning/final/02-folder-structure.md (just the root level)

DO:
1. Create root package.json with workspaces: ["packages/*", "apps/*"]
2. Create root tsconfig.base.json with strict mode
3. Create .env.example listing all required env vars (no values, just names)
4. Create .gitignore

DONE WHEN: `npm install` runs without errors at root level
```

- [x] Completed

### Task 0.2 — Setup Shared Package

```
GOAL: Create packages/shared with Zod schemas and constants

READ: planning/final/02-folder-structure.md (packages/shared section)
READ: planning/final/03-database.md (for schema field names/types)

DO:
1. Create packages/shared/package.json
2. Create packages/shared/tsconfig.json (extends root)
3. Create Zod schemas that match the database columns:
   - schemas/auth.ts (login response shape)
   - schemas/tenant.ts (create/update tenant)
   - schemas/vehicle.ts (create/update vehicle)
   - schemas/customer.ts (create/update customer)
   - schemas/estimate.ts (create/update estimate + items)
   - schemas/invoice.ts (create/update invoice + items)
   - schemas/staff.ts (invite, update)
   - schemas/attendance.ts (checkin/checkout)
4. Create constants/roles.ts (OWNER, STAFF)
5. Create constants/status.ts (vehicle statuses, payment statuses)
6. Create types/index.ts (export inferred types from Zod)

DONE WHEN: `npx tsc --noEmit` passes in packages/shared
```

- [x] Completed

### Task 0.3 — Setup Frontend (Vite + React)

```
GOAL: Initialize the React frontend app

READ: planning/final/01-tech-stack.md (frontend section)
READ: planning/final/02-folder-structure.md (apps/web section)

DO:
1. Create apps/web using Vite (React + TypeScript template)
2. Install: tailwindcss@4, react-router, @tanstack/react-query
3. Configure Tailwind v4
4. Create src/index.css with Tailwind directives
5. Create the folder structure (empty files are OK):
   - src/lib/
   - src/hooks/
   - src/components/layout/
   - src/components/ui/
   - src/components/domain/
   - src/pages/
   - src/providers/
6. Setup path alias @ → src/

DONE WHEN: `npm run dev --workspace=apps/web` shows a blank page without errors
```

- [x] Completed

### Task 0.4 — Setup Backend (Hono + Cloudflare Workers)

```
GOAL: Initialize the Hono API backend

READ: planning/final/01-tech-stack.md (backend section)
READ: planning/final/02-folder-structure.md (apps/api section)

DO:
1. Create apps/api with Hono for Cloudflare Workers
2. Install: hono, drizzle-orm, drizzle-kit, zod
3. Create wrangler.toml with D1 and R2 bindings
4. Create src/env.ts with strict typed bindings (throw if missing)
5. Create src/index.ts with basic Hono app + health check route
6. Create empty route files in src/routes/
7. Create empty middleware files in src/middleware/

DONE WHEN: `npx wrangler dev` starts and GET /health returns { status: "ok" }
```

- [x] Completed

### Task 0.5 — ESLint + Prettier

```
GOAL: Configure linting and formatting

DO:
1. Add ESLint config at root (TypeScript + React rules)
2. Add Prettier config at root
3. Add npm scripts: lint, format
4. Verify: `npm run lint` passes on all workspaces

DONE WHEN: `npm run lint` and `npm run format` work without errors
```

- [x] Completed

---

## Phase 1: Auth + Onboarding

### Task 1.1 — Database Schema (Drizzle)

```
GOAL: Create the Drizzle schema for users, tenants, and tenant_members tables

READ: planning/final/03-database.md (tables 1, 2, 3 ONLY)

DO:
1. Create apps/api/src/db/schema.ts
2. Define users, tenants, tenant_members tables using Drizzle sqliteTable
3. Match EXACTLY the columns from 03-database.md
4. Generate migration: `npx drizzle-kit generate`
5. Apply migration to local D1

DONE WHEN: Migration runs, tables exist in D1
```

- [x] Completed

### Task 1.2 — Auth API (Google OAuth → JWT)

```
GOAL: Implement Google OAuth login backend

READ: planning/final/04-api-routes.md (Auth Routes section)

DO:
1. Create src/middleware/cors.ts (CORS for frontend origin)
2. Create src/routes/auth.ts with:
   - GET /auth/google → redirect to Google OAuth
   - GET /auth/google/callback → exchange code, create/find user, return JWT
   - POST /auth/refresh → refresh JWT
3. Use jose library for JWT (works in Workers)
4. JWT payload: { user_id: string }
5. Env vars needed: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET

DONE WHEN: Full OAuth flow works — Google login → JWT returned
```

- [x] Completed

### Task 1.3 — Auth Middleware

```
GOAL: Create JWT verification middleware

READ: planning/final/04-api-routes.md (top section about auth header)

DO:
1. Create src/middleware/auth.ts
2. Extract Bearer token from Authorization header
3. Verify JWT with jose
4. Attach user_id to Hono context
5. Return 401 if missing/invalid

DONE WHEN: Protected routes return 401 without token, 200 with valid token
```

- [x] Completed

### Task 1.4 — Tenant API (Create Garage)

```
GOAL: Implement garage creation (onboarding)

READ: planning/final/04-api-routes.md (Tenant Routes section)
READ: planning/final/03-database.md (tenants table)

DO:
1. Create src/routes/tenants.ts with:
   - POST /tenants → create garage + tenant_member (role: OWNER)
   - GET /tenants/mine → get user's garage (or 404 if none)
   - PATCH /tenants/:id → update garage (owner only)
2. Create src/middleware/tenant.ts (reads X-Tenant-ID header, verifies membership)
3. Validate with Zod schemas from shared package

DONE WHEN: Can create garage, retrieve it, update it via API
```

- [x] Completed

### Task 1.5 — Login Page (Frontend)

```
GOAL: Build the login screen

READ: planning/final/05-ui-screens.md (Screen 1: Login)

DO:
1. Create src/pages/auth/login.tsx
2. Create src/pages/auth/callback.tsx
3. Create src/lib/auth.ts (Google OAuth redirect + token storage)
4. Create src/lib/config.ts (strict env config, throws if missing)
5. Create src/lib/api.ts (fetch wrapper with JWT header)
6. Simple centered layout: app name + "Sign in with Google" button
7. Callback page: exchange code → store JWT → redirect

DONE WHEN: Click "Sign in with Google" → OAuth flow → JWT stored → redirect
```

- [x] Completed

### Task 1.6 — Auth Provider + Protected Routes

```
GOAL: Wrap app with auth context, protect routes

DO:
1. Create src/providers/auth-provider.tsx (AuthContext with user, token, logout)
2. Create src/providers/query-provider.tsx (TanStack Query setup)
3. Create src/providers/tenant-provider.tsx (current tenant context)
4. Update src/app.tsx with React Router routes
5. Add route guards: unauthenticated → /login, no garage → /onboarding

DONE WHEN: Unauthenticated users go to /login, authenticated users with no garage go to /onboarding
```

- [x] Completed

### Task 1.7 — Onboarding Page

```
GOAL: Build the garage setup screen

READ: planning/final/05-ui-screens.md (Screen 2: Onboarding)

DO:
1. Create src/pages/onboarding/setup.tsx
2. Form fields: Garage Name, Phone, Address, Logo Upload, "Set Location" button
3. Location button → navigator.geolocation → capture lat/lng
4. On submit → POST /tenants → redirect to dashboard
5. Use React Hook Form + Zod validation

DONE WHEN: Can fill form, set GPS location, create garage, redirect to dashboard
```

- [x] Completed

---

## Phase 2: Design System + Layout

### Task 2.1 — Design Tokens + Tailwind Config

```
GOAL: Configure Tailwind with the project's design system

READ: planning/final/05-ui-screens.md (Design System section — colors, typography, shadows)

DO:
1. Update tailwind.config.ts with custom colors, fonts, shadows
2. Update src/index.css with @import for Inter font
3. Add custom animations (button press, page enter, toast)

DONE WHEN: Tailwind classes like bg-primary, text-text-secondary, shadow-card work
```

- [x] Completed

### Task 2.2 — Layout Components

```
GOAL: Build the 4 core layout components

READ: planning/final/05-ui-screens.md (Layout Components table)

DO:
1. Create components/layout/mobile-container.tsx (max-w-[414px], centered)
2. Create components/layout/topbar.tsx (sticky, back button, title, right action)
3. Create components/layout/bottom-nav.tsx (4 tabs: Home, Vehicles, Staff, Settings)
4. Create components/layout/page-shell.tsx (wraps topbar + content + bottom-nav)

DONE WHEN: A test page wrapped in PageShell shows topbar, scrollable content, and bottom nav
```

- [x] Completed

### Task 2.3 — UI Components (Part 1: Basics)

```
GOAL: Build the basic UI primitives

READ: planning/final/05-ui-screens.md (UI Components table + Button Variants)

DO:
1. button.tsx — variants: primary, outline, dashed, success, ghost
2. card.tsx — white, rounded-2xl, soft shadow
3. badge.tsx — success (green), danger (red), warning (amber)
4. input.tsx — label + input, rounded-xl, focus ring
5. textarea.tsx — same styling as input
6. select.tsx — styled dropdown
7. toast.tsx — slide in from top, auto-dismiss

DONE WHEN: All components render correctly with all variants
```

- [x] Completed

### Task 2.4 — UI Components (Part 2: Data Display)

```
GOAL: Build data display components

READ: planning/final/05-ui-screens.md (UI Components table)

DO:
1. search-bar.tsx — input with magnifying glass icon
2. stat-card.tsx — icon + number + label
3. list-item.tsx — clickable row: icon + title + subtitle + right content
4. price-row.tsx — item name + ₹ price
5. total-row.tsx — bold divider + large total
6. filter-chips.tsx — horizontal scrollable chips
7. photo-upload.tsx — dashed border, camera icon, tap to upload
8. empty-state.tsx — illustration + message
9. loading.tsx — skeleton shimmer
10. modal.tsx — bottom sheet

DONE WHEN: All components render correctly
```

- [x] Completed

---

## Phase 3: Vehicle Management

### Task 3.1 — Database: Vehicle Tables

```
GOAL: Add customers, vehicles, vehicle_images, service_visits tables to Drizzle schema

READ: planning/final/03-database.md (tables 5, 6, 7, 8)

DO:
1. Add tables to apps/api/src/db/schema.ts
2. Add indexes from 03-database.md
3. Generate and apply migration

DONE WHEN: New tables exist in D1
```

- [x] Completed

### Task 3.2 — Vehicle API Routes

```
GOAL: Implement vehicle CRUD endpoints

READ: planning/final/04-api-routes.md (Vehicle Routes + Service Visit Routes)

DO:
1. Create src/routes/vehicles.ts (all vehicle endpoints)
2. Create src/routes/customers.ts (customer search)
3. Create src/routes/visits.ts (visit status + new visit for returning vehicles)
4. POST /vehicles creates customer + vehicle + visit in one transaction
5. POST /vehicles/:id/visits creates new visit for returning vehicle
6. POST /vehicles/:id/images adds photo to existing vehicle
7. GET /vehicles with pagination + status filter
8. GET /vehicles/search for autocomplete
9. Validate with shared Zod schemas

DONE WHEN: All vehicle endpoints work via curl/Postman
```

- [x] Completed

### Task 3.3 — Upload API (R2 Presigned URLs)

```
GOAL: Implement image upload via R2 presigned URLs

READ: planning/final/04-api-routes.md (Upload Routes + Upload Flow)

DO:
1. Create src/routes/upload.ts
2. POST /upload/presign → generate presigned PUT URL for R2
3. Return { upload_url, file_key }

DONE WHEN: Can get presigned URL and upload a file to R2
```

- [x] Completed

### Task 3.4 — Dashboard API

```
GOAL: Implement dashboard stats endpoint

READ: planning/final/04-api-routes.md (Dashboard Routes)

DO:
1. Create src/routes/dashboard.ts
2. GET /dashboard/stats → count vehicles today, repairing, ready, revenue, unpaid

DONE WHEN: Returns correct stats JSON
```

- [x] Completed

### Task 3.5 — Dashboard Page (Frontend)

```
GOAL: Build the main dashboard screen

READ: planning/final/05-ui-screens.md (Screen 3: Dashboard)

DO:
1. Create src/pages/dashboard/index.tsx
2. Greeting header + stat cards + quick actions
3. Hook up to GET /dashboard/stats with TanStack Query
4. Wire up bottom nav

DONE WHEN: Dashboard shows live stats and quick action buttons navigate correctly
```

- [x] Completed

### Task 3.6 — Vehicle List Page

```
GOAL: Build the vehicle list with filtering

READ: planning/final/05-ui-screens.md (Screen 4: Vehicle List)

DO:
1. Create src/pages/vehicles/list.tsx
2. Filter chips: All | Repairing | Ready | Delivered
3. Search bar
4. Vehicle cards with status badges
5. "Load More" pagination
6. Connect to GET /vehicles API

DONE WHEN: Vehicle list shows, filters work, pagination works
```

- [x] Completed

### Task 3.7 — Add Vehicle Page

```
GOAL: Build the add vehicle form

READ: planning/final/05-ui-screens.md (Screen 5: Add Vehicle)

DO:
1. Create src/pages/vehicles/add.tsx
2. Create src/components/domain/vehicle-search.tsx (autocomplete)
3. Create src/components/domain/contact-picker.tsx (progressive enhancement)
4. Create src/lib/contacts.ts (Contact Picker API wrapper)
5. Create src/lib/image.ts (client-side WebP compression)
6. Form: photo → reg number (with search) → vehicle name → customer name (with contact picker) → phone → complaint
7. Submit → POST /vehicles → navigate to details

DONE WHEN: Can add a vehicle with photo, customer auto-fill works
```

- [x] Completed

### Task 3.8 — Vehicle Details Page

```
GOAL: Build the single vehicle details screen

READ: planning/final/05-ui-screens.md (Screen 6: Vehicle Details)

DO:
1. Create src/pages/vehicles/details.tsx
2. Photo gallery (horizontal scroll)
3. Customer card, complaint card
4. Status change buttons
5. Financial summary (estimate + invoice totals)
6. Action buttons: Create Estimate, Generate Invoice

DONE WHEN: Vehicle details show correctly, status can be changed
```

- [x] Completed

---

## Phase 4: Estimates & Invoices

### Task 4.1 — Database: Estimate + Invoice Tables

```
GOAL: Add estimates, estimate_items, invoices, invoice_items tables

READ: planning/final/03-database.md (tables 9, 10, 11, 12)

DO:
1. Add tables to schema.ts
2. Add indexes
3. Generate and apply migration

DONE WHEN: New tables exist
```

- [x] Completed

### Task 4.2 — Estimate API Routes

```
GOAL: Implement estimate CRUD

READ: planning/final/04-api-routes.md (Estimate Routes)

DO:
1. Create src/routes/estimates.ts
2. GET /estimates/:id — get single estimate with items
3. GET /estimates?status=X&cursor=X — list all estimates with pagination
4. GET /estimates?visit_id=X — get estimate for a specific visit
5. All estimate endpoints including item management
6. Validate with shared Zod schemas

DONE WHEN: Can create, list, get by ID, update, add/remove items via API
```

- [ ] Completed

### Task 4.3 — Invoice API Routes

```
GOAL: Implement invoice CRUD + estimate import

READ: planning/final/04-api-routes.md (Invoice Routes)

DO:
1. Create src/routes/invoices.ts
2. POST /invoices/from-estimate/:id → copy items from estimate
3. PATCH /invoices/:id/pay → freeze total, set payment method
4. All other invoice endpoints

DONE WHEN: Can create invoice from estimate, mark as paid
```

- [ ] Completed

### Task 4.4 — Estimate Editor Page

```
GOAL: Build the estimate creation/editing screen

READ: planning/final/05-ui-screens.md (Screen 7: Estimate Editor)

DO:
1. Create src/pages/estimates/editor.tsx
2. Create src/components/domain/estimate-items.tsx
3. Line items: add, edit, remove
4. Optional tax toggle + tax % field
5. Discount (flat ₹ or %)
6. Total calculation (subtotal + tax - discount)
7. "Save" and "Convert to Invoice" buttons

DONE WHEN: Can create estimate with items, tax, discount. Total calculates correctly.
```

- [ ] Completed

### Task 4.5 — Invoice Editor Page

```
GOAL: Build the invoice editor with estimate import

READ: planning/final/05-ui-screens.md (Screen 8: Invoice Editor)

DO:
1. Create src/pages/invoices/editor.tsx
2. Create src/components/domain/invoice-items.tsx
3. If from_estimate query param → pre-fill items
4. "Mark as Paid" → bottom sheet modal → payment method selection
5. "PDF" and "Print" buttons (placeholder for now)
6. "Share on WhatsApp" button (wa.me link)

DONE WHEN: Invoice editor works, estimate import pre-fills items, payment flow works
```

- [ ] Completed

### Task 4.6 — PDF Generation

```
GOAL: Client-side PDF generation for invoices/estimates

READ: planning/final/01-tech-stack.md (cost optimization — client-side PDF)

DO:
1. Create src/lib/pdf.ts
2. PDF template: garage logo/name, customer details, items table, total, footer
3. Use @react-pdf/renderer
4. Wire up "PDF" button in invoice editor
5. Wire up "Share on WhatsApp" with wa.me link + invoice summary text

DONE WHEN: Clicking PDF downloads a properly formatted invoice PDF
```

- [ ] Completed

### Task 4.7 — Estimate + Invoice List Pages

```
GOAL: Build list pages for estimates and invoices

READ: planning/final/05-ui-screens.md (Screens 9 and 10)

DO:
1. Create src/pages/estimates/list.tsx
2. Create src/pages/invoices/list.tsx (with filter chips: All | Unpaid | Paid)
3. Connect to APIs with pagination

DONE WHEN: Both lists show data, filters work, tap navigates to editor
```

- [ ] Completed

---

## Phase 5: Staff Management

### Task 5.1 — Database: Staff Tables

```
GOAL: Add staff_invites table (tenant_members already exists from Task 1.1)

READ: planning/final/03-database.md (table 4: staff_invites)

DO:
1. Add staff_invites to schema.ts
2. Generate and apply migration

DONE WHEN: Table exists
```

- [x] Completed

### Task 5.2 — Staff API Routes

```
GOAL: Implement staff invitation and management

READ: planning/final/04-api-routes.md (Staff Routes)

DO:
1. Create src/routes/staff.ts
2. All staff endpoints: list, invite, accept, profile, update, remove, revoke

DONE WHEN: Full invite flow works via API (create invite → get invite → accept)
```

- [ ] Completed

### Task 5.3 — Staff List + Add Pages

```
GOAL: Build staff directory and invite screens

READ: planning/final/05-ui-screens.md (Screens 11 and 12)

DO:
1. Create src/pages/staff/list.tsx (staff directory with attendance badges)
2. Create src/pages/staff/add.tsx (invite form → generate link → copy/share)

DONE WHEN: Can see staff list, create invite, copy/share link
```

- [ ] Completed

### Task 5.4 — Staff Profile Page

```
GOAL: Build individual staff profile

READ: planning/final/05-ui-screens.md (Screen 13)

DO:
1. Create src/pages/staff/profile.tsx
2. Profile header, today's check-in/out, monthly stats, salary calculation

DONE WHEN: Staff profile shows attendance + salary data
```

- [ ] Completed

### Task 5.5 — Invite Acceptance Page

```
GOAL: Build the staff invite acceptance flow

READ: planning/final/05-ui-screens.md (Screen 16)

DO:
1. Create src/pages/invite/accept.tsx
2. Show invite details (garage name, role)
3. If not logged in → prompt Google sign in
4. "Accept" button → POST /staff/invite/:token/accept
5. Redirect to /checkin

DONE WHEN: Staff can click invite link, sign in, accept, and land on check-in page
```

- [ ] Completed

---

## Phase 6: Attendance System

### Task 6.1 — Database: Attendance Tables

```
GOAL: Add qr_codes and attendance_logs tables

READ: planning/final/03-database.md (tables 13 and 14)

DO:
1. Add tables to schema.ts
2. Generate and apply migration

DONE WHEN: Tables exist
```

- [x] Completed

### Task 6.2 — Attendance API Routes

```
GOAL: Implement QR + GPS attendance system

READ: planning/final/04-api-routes.md (Attendance Routes + Check-in Verification Logic)

DO:
1. Create src/routes/attendance.ts
2. QR management (get, regenerate)
3. Check-in (verify QR token + GPS distance)
4. Check-out (GPS)
5. Today's summary + monthly report
6. GPS distance calculation using Haversine formula

DONE WHEN: Full check-in/out flow works via API
```

- [x] Completed

### Task 6.3 — QR Attendance Page (Owner)

```
GOAL: Build the QR display screen for owners

READ: planning/final/05-ui-screens.md (Screen 14)

DO:
1. Create src/pages/staff/attendance.tsx
2. Create src/components/domain/qr-display.tsx
3. Large static QR code (using qrcode.react)
4. Today's present/absent stats
5. "Regenerate QR" button
6. Today's attendance list

DONE WHEN: QR displays, regeneration works, today's list shows
```

- [x] Completed

### Task 6.4 — Staff Check-In Page

```
GOAL: Build the QR scanner + check-in/out for staff

READ: planning/final/05-ui-screens.md (Screen 15)

DO:
1. Create src/pages/staff/checkin.tsx
2. Create src/components/domain/qr-scanner.tsx (using html5-qrcode)
3. Create src/lib/location.ts (geolocation helper)
4. States: not checked in → check in → checked in → check out → done
5. QR scan → extract token → get GPS → POST /attendance/checkin
6. Monthly attendance summary at bottom

DONE WHEN: Staff can scan QR, GPS is verified, check-in/out flow works end-to-end
```

- [x] Completed

---

## Phase 7: Settings + Polish

### Task 7.1 — Settings Page

```
GOAL: Build the garage settings/profile screen

READ: planning/final/05-ui-screens.md (Screen 17)

DO:
1. Create src/pages/settings/index.tsx
2. Google profile section (read-only)
3. Garage details form (editable)
4. "Update Location" button
5. "Save Changes" + "Sign Out"

DONE WHEN: Settings page loads, edits save, sign out works
```

- [x] Completed

### Task 7.2 — PWA Setup

```
GOAL: Make the app installable as a PWA

DO:
1. Create public/manifest.json (app name, colors, icons)
2. Create public/sw.js (cache static assets)
3. Generate PWA icons (192x192, 512x512)
4. Register service worker in main.tsx

DONE WHEN: App shows "Install" prompt on mobile Chrome
```

- [x] Completed

### Task 7.3 — Polish: Animations + Transitions

```
GOAL: Add micro-interactions and page transitions

READ: planning/final/05-ui-screens.md (Micro-Animations section)

DO:
1. Page enter animations (fade + slide up)
2. Button press scale effect
3. Toast animations
4. Loading skeleton shimmer
5. Smooth route transitions

DONE WHEN: App feels fluid and responsive
```

- [x] Completed

### Task 7.4 — Polish: Error Handling + Edge Cases

```
GOAL: Handle all error states and edge cases

DO:
1. Network error handling (offline banner or toast)
2. API error display (toast with message)
3. Form validation error display
4. Empty states on all list pages
5. Long text truncation
6. Loading states on all data-fetching pages

DONE WHEN: No blank screens, no unhandled errors, all edge cases covered
```

- [x] Completed

---

## Phase 7.5: Manual Local Testing

### Task 7.5.1 — Local End-to-End Testing

```
GOAL: Manually test all app flows locally before production deployment.

DO:
1. Start local dev server
2. Test Onboarding and Garage creation
3. Test adding a Vehicle and changing its status
4. Test creating an Estimate and converting it to an Invoice
5. Test Invoice payment flow and WhatsApp sharing
6. Test Staff invite generation and QR Check-in

DONE WHEN: The user has manually verified every flow works perfectly on their local machine.
```

- [ ] Completed

---

## Phase 8: Deploy

### Task 8.1 — GitHub Actions CI/CD

```
GOAL: Auto-deploy on push to main

DO:
1. Create .github/workflows/deploy.yml
2. Lint + type check + build
3. Deploy API via wrangler
4. Deploy frontend via Cloudflare Pages

DONE WHEN: Push to main auto-deploys both frontend and backend
```

- [ ] Completed

### Task 8.2 — Production Setup

```
GOAL: Configure production environment

DO:
1. Create D1 database in Cloudflare dashboard
2. Run migrations on production D1
3. Create R2 bucket
4. Set secrets in Cloudflare (GOOGLE_CLIENT_ID, etc.)
5. Configure custom domain (workshop.zeonweb.com)
6. Set up Google OAuth credentials for production domain

DONE WHEN: App is live at workshop.zeonweb.com
```

- [ ] Completed

### Task 8.3 — Final Audit

```
GOAL: Verify everything works in production

DO:
1. Full end-to-end test of all flows
2. Lighthouse audit (target: 90+ on all metrics)
3. Mobile responsiveness check
4. Test on real Android phone (Chrome)
5. Test PWA install
6. Verify no console errors

DONE WHEN: All flows work, Lighthouse passes, no errors
```

- [ ] Completed

---

## Summary

| Phase                       | Tasks        | Est. Days       |
| --------------------------- | ------------ | --------------- |
| Phase 0: Setup              | 5 tasks      | 1-2 days        |
| Phase 1: Auth               | 7 tasks      | 2-3 days        |
| Phase 2: Design System      | 4 tasks      | 1-2 days        |
| Phase 3: Vehicles           | 8 tasks      | 3-4 days        |
| Phase 4: Estimates/Invoices | 7 tasks      | 3-4 days        |
| Phase 5: Staff              | 5 tasks      | 3-4 days        |
| Phase 6: Attendance         | 4 tasks      | 2-3 days        |
| Phase 7: Polish             | 4 tasks      | 2-3 days        |
| Phase 7.5: Local Testing    | 1 task       | Manual          |
| Phase 8: Deploy             | 3 tasks      | 1-2 days        |
| **Total**                   | **47 tasks** | **~18-25 days** |
