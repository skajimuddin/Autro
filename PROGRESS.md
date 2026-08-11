# Workshop — Progress Tracker

> **AI Agent:** Read this first. Then read the task spec from `planning/final/06-tasks.md`.
> After each task: mark `[x]` in `06-tasks.md` and update the two sections below.

---

## 🔴 Next Task

**All Phase 6 Tasks Completed!**
(Stopped here as per user request to not start Phase 7 yet)

> ⚠️ **CHECKPOINT NOTE FOR NEW SESSION:**
> The UI pages for Dashboard, Vehicles, Estimates, Invoices, Staff, Attendance, and Settings have been **IMPLEMENTED** using mock/pending TanStack Query hooks. They are verified with `tsc` and `vite build`.
> We are now returning to the backend API implementation starting with the Database tables for Vehicles.
> **Before starting Task 3.1**, please review `planning/final/03-database.md` for exact table schemas.

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
| 3.x — Vehicle Pages UI (Dashboard, List, Add, Details) | 2026-08-11 |
| 4.x — Estimate & Invoice Pages UI (List, Editor) | 2026-08-11 |
| 5.x/6.x — Staff & Attendance Pages UI (List, Profile, Add, Checkin, Settings) | 2026-08-11 |
| 3.1 — Database: Vehicle Tables | 2026-08-11 |
| 3.2 — Vehicle API Routes | 2026-08-11 |
| 3.3 — Upload API (R2 Presigned URLs) | 2026-08-11 |
| 3.4 — Dashboard API | 2026-08-11 |
| 4.1 — Database: Estimate + Invoice Tables | 2026-08-11 |
| 4.2 — Estimate API Routes | 2026-08-11 |
| 4.3 — Invoice API Routes | 2026-08-11 |
| 5.1 — Database: Staff Tables | 2026-08-11 |
| 5.2 — Staff API Routes | 2026-08-11 |
| 6.1 — Database: Attendance Tables | 2026-08-11 |
| 6.2 — Attendance API Routes | 2026-08-11 |
| 6.3 — QR Attendance Page (Owner) | 2026-08-11 |
| 6.4 — Staff Check-In Page | 2026-08-11 |

---

## 📋 Key Implementation Notes (for next agent)

### What exists and works
- **`apps/web/src/index.css`** — Tailwind v4 `@theme` block with all design tokens (colors, shadows, radius, animations). Build verified.
- **`apps/web/src/components/layout/`** — `mobile-container.tsx`, `topbar.tsx`, `bottom-nav.tsx`, `page-shell.tsx` + `index.ts`
- **`apps/web/src/components/ui/`** — All 17 component files implemented + `index.ts` barrel
- **`apps/web/src/lib/`** — `config.ts`, `auth.ts`, `api.ts` (apiFetch wrapper with JWT + X-Tenant-ID)
- **`apps/web/src/providers/`** — `auth-provider.tsx` (useAuth hook), `tenant-provider.tsx` (useTenant hook), `query-provider.tsx`
- **`apps/web/src/pages/`** — All UI pages (Auth, Onboarding, Dashboard, Vehicles, Estimates, Invoices, Staff, Attendance, Settings) are built with Lucide icons and TanStack query hooks!
- **`apps/api/src/`** — auth routes, tenant routes, auth middleware, Drizzle schema all implemented

### Tailwind v4 Note
Project uses `@tailwindcss/vite` plugin (v4). There is NO `tailwind.config.ts`. All tokens are defined via `@theme {}` CSS block in `src/index.css`. Custom classes use `bg-primary`, `text-text-secondary`, `shadow-[var(--shadow-card)]` etc.

### Next tasks in order
1. **Task 7.1** — Settings Page
2. Continue through `planning/final/06-tasks.md` as requested.
