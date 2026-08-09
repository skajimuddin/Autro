# Workshop — AI Agent Rules

> This file is automatically read by AI coding agents (Antigravity, Cursor, Claude Code, Copilot, etc.)
> It is the single source of truth for how agents should behave in this project.

---

## 🚨 CRITICAL RULES (NEVER BREAK THESE)

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
const baseUrl = process.env.BASE_URL || "https://placeholder.cc";
const apiKey = process.env.API_KEY ?? "default-key";

// ✅ ALWAYS DO THIS
const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error("Missing required env: BASE_URL");
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

| File | What it defines |
|---|---|
| `planning/final/00-overview.md` | Product scope, user roles, MVP boundaries |
| `planning/final/01-tech-stack.md` | Every technology choice and why |
| `planning/final/02-folder-structure.md` | Exact folder/file structure to follow |
| `planning/final/03-database.md` | All 14 tables, columns, types, indexes |
| `planning/final/04-api-routes.md` | All API endpoints with request/response shapes |
| `planning/final/05-ui-screens.md` | All 17 screens, design system, components |
| `planning/final/06-tasks.md` | Atomic task breakdown — work from this |

### How to Use Plan Files
- Before starting a task, read the RELEVANT plan file (not all of them)
- For a database task → read `03-database.md`
- For an API task → read `04-api-routes.md`
- For a UI task → read `05-ui-screens.md`
- The plan files are the AUTHORITY. Your training data is NOT.

---

## 🏗️ TECH STACK (Do Not Change)

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer |
| Icons | Lucide React |
| Backend | Hono on Cloudflare Workers |
| Database | Cloudflare D1 + Drizzle ORM |
| Storage | Cloudflare R2 |
| Auth | Google OAuth 2.0 → JWT |
| Validation | Zod (shared between frontend/backend) |
| Monorepo | npm workspaces |

### Do NOT:
- Suggest or install alternative libraries (e.g. don't suggest Prisma instead of Drizzle)
- Add new dependencies without being explicitly asked
- Switch from Tailwind to styled-components or CSS modules
- Use Material UI, Chakra UI, Ant Design, or any component library
- Use axios (use native fetch)

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
- Use path aliases if configured (`@/` prefix)
- Group imports: external libs → shared package → project files
- No circular imports

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

- Mobile-first. Max-width 414px container centered on desktop.
- Every page uses `<PageShell>` wrapper (topbar + content + bottom nav)
- Bottom nav: 4 tabs — Home, Vehicles, Staff, Settings
- Light mode only. No dark mode.
- English only. Currency hardcoded ₹ (INR).
- Use Lucide icons, not FontAwesome
- Toast for success/error feedback
- Empty states for all lists (not blank screens)
- Loading skeletons (not spinners) for data fetching

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
2. Never modify plan files
3. Never add dependencies without asking
4. Never use `any` type
5. Never hardcode fallback values for config/env
6. Never create files outside the folder structure in `planning/final/02-folder-structure.md`
7. Never skip error handling
8. Never leave `console.log` in production code (use proper error handling)
9. Never store images in the database (use R2)
10. Never load all records without pagination
11. Never write SQL directly — use Drizzle ORM
12. Never create duplicate components — search existing ones first
