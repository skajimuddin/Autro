# Workshop — AI Agent Rules

> This file is automatically read by AI coding agents (Antigravity, Cursor, Claude Code, Copilot, etc.)
> It is the single source of truth for how agents should behave in this project.

---

## 🚨 CRITICAL RULES (NEVER BREAK THESE)

### 0. START EVERY SESSION BY READING PROGRESS.md

**This is the most important rule.**

- The FIRST thing you do in any session is: `read PROGRESS.md` at the project root
- It tells you exactly what was done, what is next, and all the context you need
- After completing a task, UPDATE `PROGRESS.md`:
  - Move the finished task to the ✅ Completed table with today's date
  - Set the new "🔴 NEXT TASK TO DO" block to the next uncompleted task
  - Update the phase status table
- Also mark the task `[x]` in `planning/final/06-tasks.md`
- Never skip this. It's how sessions hand off to each other.


### 1. ONE TASK AT A TIME

- You are working on ONE specific task from `planning/final/06-tasks.md`
- Do NOT build multiple features at once
- Do NOT "also add" things that weren't asked for
- If you finish early, STOP. Do not add bonus features.

### 2. READ BEFORE WRITE

- Before writing ANY code, first READ the existing files you'll be modifying
- Use grep/search to understand what already exists
- NEVER assume what a file contains — always check first
- If a function/component already exists, use it. Don't create a duplicate.

### 3. NO GUESSING

- If you're unsure about something, say "I don't know" or ask
- Do NOT invent API endpoints, library methods, or config options
- Do NOT assume a dependency exists — check `package.json` first
- If you need a library, check if it's already installed before suggesting `npm install`

### 4. NO FALLBACK HARDCODING

```typescript
// ❌ NEVER DO THIS
const baseUrl = process.env.BASE_URL || 'https://placeholder.cc'
const apiKey = process.env.API_KEY ?? 'default-key'

// ✅ ALWAYS DO THIS
const baseUrl = process.env.BASE_URL
if (!baseUrl) throw new Error('Missing required env: BASE_URL')
```

- If a config/env value is required, the app must CRASH without it
- No silent fallbacks, no placeholder defaults, no "just in case" values

### 5. VERIFY AFTER WRITING

- After writing code, run the relevant build/lint/test command
- If there are errors, fix them before marking the task done
- Do not leave broken imports, unused variables, or TypeScript errors

---

## 📁 PROJECT REFERENCE

### Plan Files (Source of Truth)

All decisions have been made. Do NOT deviate from these:

| File                                    | What it defines                                |
| --------------------------------------- | ---------------------------------------------- |
| `planning/final/00-overview.md`         | Product scope, user roles, MVP boundaries      |
| `planning/final/01-tech-stack.md`       | Every technology choice and why                |
| `planning/final/02-folder-structure.md` | Exact folder/file structure to follow          |
| `planning/final/03-database.md`         | All 14 tables, columns, types, indexes         |
| `planning/final/04-api-routes.md`       | All API endpoints with request/response shapes |
| `planning/final/05-ui-screens.md`       | All 17 screens, design system, components      |
| `planning/final/06-tasks.md`            | Atomic task breakdown — work from this         |

### How to Use Plan Files

- Before starting a task, read the RELEVANT plan file (not all of them)
- For a database task → read `03-database.md`
- For an API task → read `04-api-routes.md`
- For a UI task → read `05-ui-screens.md`
- The plan files are the AUTHORITY. Your training data is NOT.

---

## 🏗️ TECH STACK (Do Not Change)

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Frontend     | React 19 + Vite + TypeScript (strict) |
| Styling      | Tailwind CSS v4                       |
| Routing      | React Router v7                       |
| Server State | TanStack Query v5                     |
| Forms        | React Hook Form + Zod                 |
| PDF          | @react-pdf/renderer                   |
| Icons        | Any icon library (e.g., FontAwesome, Lucide) |
| Backend      | Hono on Cloudflare Workers            |
| Database     | Cloudflare D1 + Drizzle ORM           |
| Storage      | Cloudflare R2                         |
| Auth         | Google OAuth 2.0 → JWT                |
| Validation   | Zod (shared between frontend/backend) |
| Monorepo     | npm workspaces                        |



---

## ✍️ CODE STYLE

### TypeScript

- Strict mode always (`"strict": true`)
- No `any` type — ever. Use `unknown` if truly needed.
- Prefer `const` over `let`. Never use `var`.
- Use explicit return types on exported functions
- Use Zod schemas from `packages/shared` for all validation

### React

- Functional components only (no class components)
- Use hooks for state and effects
- Keep components small — if a component exceeds ~150 lines, split it
- Colocate: hooks in `/hooks`, utils in `/lib`, components in `/components`
- Don't create a component for something used only once

### CSS / Tailwind

- Use Tailwind utility classes. No inline `style={}` props.
- Follow the design tokens defined in `planning/final/05-ui-screens.md`
- Primary color: `#2563eb` — do not use other blues
- Font: Inter — do not use other fonts
- All cards: `rounded-2xl` with soft shadow
- All buttons: `rounded-2xl`
- All inputs: `rounded-xl`

### File Naming

- Components: `kebab-case.tsx` (e.g., `bottom-nav.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-auth.ts`)
- Utils: `kebab-case.ts` (e.g., `api.ts`)
- Pages: `kebab-case.tsx` matching the route

### Imports

**Rule: `@/` in app packages, relative imports in library packages.**

| Package                  | Style                | Reason                                                                                                                                                                                                                       |
| ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/**`        | Always `@/`          | Alias configured, stays within app                                                                                                                                                                                           |
| `apps/api/src/**`        | Always `@/`          | Alias configured, stays within app                                                                                                                                                                                           |
| `packages/shared/src/**` | Always `./` or `../` | Cannot use `@/` — consuming apps (`apps/web`, `apps/api`) also have their own `@/` alias pointing to their own `src/`. If shared uses `@/` internally, those apps will try to resolve it against **their** `src/` and break. |

```ts
// ✅ apps/web or apps/api — always @/
import { Button } from '@/components/ui/button'
import type { Env } from '@/env'

// ❌ Never relative inside app packages
import { Button } from '../components/ui/button'

// ✅ packages/shared — always relative (./  or ../)
export * from './schemas/auth'
import type { AuthResponseSchema } from '../schemas/auth'

// ❌ Never @/ inside packages/shared — it will break consuming apps
import type { AuthResponseSchema } from '@/schemas/auth'
```

**Import group order** (enforced, one blank line between groups):

1. External libraries (`react`, `hono`, `zod`, etc.)
2. Shared package (`@workshop/shared`)
3. Internal project files (`@/...`)

```ts
// ✅ Correct order
import { useState } from 'react'
import { z } from 'zod'

import type { CreateVehicle } from '@workshop/shared'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
```

- No circular imports — ever
- No barrel re-exports that cause circular chains

---

## 🗄️ DATABASE RULES

- All IDs are UUIDs (use `crypto.randomUUID()`)
- All dates are ISO 8601 strings (TEXT in SQLite)
- Every tenant-scoped table has `tenant_id` — ALWAYS filter by it
- Soft deletes: set `deleted_at`, never use `DELETE FROM`
- Filter with `WHERE deleted_at IS NULL` in all queries
- Paginate all list queries (cursor-based, 20 items per page)
- Use the exact table/column names from `planning/final/03-database.md`

---

## 🌐 API RULES

- All routes defined in `planning/final/04-api-routes.md`
- Do NOT create routes that aren't in the plan
- Validate all request bodies with Zod schemas from shared package
- Return consistent error format: `{ error: { code, message } }`
- Auth middleware on all routes except `/auth/*` and `GET /staff/invite/:token`
- Tenant middleware injects `tenant_id` from `X-Tenant-ID` header

---

## 🖥️ UI RULES

### Responsive (amended 2026-08-13 — supersedes the old mobile-only 414px rule)

Mobile-first, but the app must work at every width. Build the mobile layout first,
then add breakpoints upward. **Never ship a screen with zero breakpoints.**

| Width | Nav | Content | Modal |
| ----- | --- | ------- | ----- |
| `< 640px` (base) | Fixed bottom nav, 4 tabs | 1 column, full-bleed cards | Bottom sheet |
| `≥ 768px` (`md:`) | Left sidebar, labels visible | 2-column grid, max-width constrained | Centered dialog |
| `≥ 1024px` (`lg:`) | Left sidebar | Sidebar + content + detail pane; **lists render as tables**, not stacked cards | Centered dialog |

- The old `max-w-[414px]` hard cap is **removed**. Do not reintroduce it.
- Use `env(safe-area-inset-bottom)` on the bottom nav for notched phones.
- Support down to **360px** (small Android) with no horizontal scroll.
- Check every screen at 360 / 414 / 768 / 1024 / 1440 before marking a task done.

### Color — semantic only (this rule exists because it was broken)

**Color carries meaning. It is never decoration.**

- `success` / `warning` / `danger` are reserved for **real status** — paid vs unpaid,
  present vs absent, repairing vs ready.
- Every non-status icon is `text-primary`. Full stop.
- ❌ Never assign different colors to sibling items for visual variety. Four quick
  actions get four identical blue icons, not blue/amber/green. This was the single
  biggest "AI-generated" tell in the first build (`dashboard/index.tsx`
  `QUICK_ACTIONS` gave every action its own color for no reason).

### Icons

- **The project uses FontAwesome 6 solid**, via `react-icons/fa6` (decided
  2026-08-13). The demo's filled glyphs read with far more mass than outline
  icons; a first build using Lucide's 2px strokes was rejected as too thin.
- **Import icons from `@/components/ui/icons` — never from `react-icons` directly.**
  That module re-exports each glyph under a stable semantic name, so the whole app
  can be re-skinned from one file. Importing the library directly defeats this.
- Need an icon that isn't exported yet? Add it to `icons.tsx` with a comment, then
  import it from there.
- `strokeWidth` has no effect on a filled glyph. Don't add it, and don't churn
  files to remove existing ones — they are harmless.
- Check `planning/demo-ui/*.html` for intended icon choice; where the demo used a
  specific glyph, that glyph wins.

### Typography — use the semantic scale, not Tailwind's defaults

The type tokens in `index.css` are calibrated to `planning/demo-ui/styles.css`.
The first build used Tailwind's default scale and rendered every screen 20–38%
smaller and lighter than the approved demo — the single biggest reason production
looked worse. Prefer these over raw `text-sm`/`text-xs`:

| Token | Size | Use |
| ----- | ---- | --- |
| `text-value-xl` | `2rem` | hero stat numbers |
| `text-value` | `1.5rem` | stat tile values, page greeting |
| `text-row-title` | `1.1rem` | list row titles, stat labels, button text |
| `text-detail` | `1.05rem` | detail rows |
| `text-label` | `0.95rem` | form labels, uppercase section headers |
| `text-row-sub` | `0.9rem` | row subtitles, stat tile labels |

- Row titles and stat values are **bold (700)**, not semibold. The demo is heavy.
- Do **not** add `-webkit-font-smoothing: antialiased`. It thins every glyph; the
  demo never set it and reads sturdier without it.

### No emoji in UI

- ❌ No emoji in any rendered string — not in labels, buttons, headings, toasts,
  or empty states. Use an icon instead.
- This includes the friendly ones (`👋`, `🚀`, `📍`). The demo HTML containing an
  emoji is not licence to ship one.

### General

- Every page uses `<PageShell>` wrapper (topbar + content + nav)
- Nav tabs: 4 — Home, Vehicles, Staff, Settings
- Light mode only. No dark mode.
- English only. Currency hardcoded ₹ (INR).
- Toast for success/error feedback
- Empty states for all lists (not blank screens)
- Loading skeletons (not spinners) for data fetching
- `planning/demo-ui/` is the **visual authority**. If production diverges from it,
  production is wrong unless a plan file says otherwise.

---

## 🧪 COMMANDS

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev --workspace=apps/web

# Run backend dev server (wrangler)
npm run dev --workspace=apps/api

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

---

## 🚫 THINGS TO NEVER DO

1. Never build multiple features in one go
2. Never modify plan files **without explicit owner approval, logged in `PROGRESS.md`**
   (amended 2026-08-13: the responsive scope change was approved this way)
4. Never use `any` type
5. Never hardcode fallback values for config/env
6. Never create files outside the folder structure in `planning/final/02-folder-structure.md`
7. Never skip error handling
8. Never leave `console.log` in production code (use proper error handling)
9. Never store images in the database (use R2)
10. Never load all records without pagination
11. Never write SQL directly — use Drizzle ORM
12. Never create duplicate components — search existing ones first
13. **Never mark a task `[x]` you have not run and watched work.** Three tasks were
    falsely marked complete in the first build — their deliverable was a decorative
    placeholder (an icon standing in for a scannable QR code, a
    `window.prompt` standing in for a camera scanner, an error toast standing in for
    PDF export). A false `[x]` silently deletes the work from the plan. If part of a
    task is stubbed, leave it `[ ]` and write down which step is missing.
14. **Never create an empty placeholder file** for work you are not doing in this
    task. The first build left 12 two-line stub files, and a later audit
    recommended deleting them as dead scaffolding — which would have erased four
    genuinely unbuilt features. Either build the file or leave it absent.
