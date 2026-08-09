# Workshop — Folder Structure

---

```
workshop/
├── .env.example                  # Required env vars (NO defaults, app crashes without them)
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions → Wrangler deploy
├── package.json                  # Root package.json (npm workspaces)
├── tsconfig.base.json            # Shared TS config
│
├── packages/
│   └── shared/                   # Shared between frontend & backend
│       ├── src/
│       │   ├── schemas/          # Zod validation schemas
│       │   │   ├── auth.ts
│       │   │   ├── tenant.ts
│       │   │   ├── vehicle.ts
│       │   │   ├── customer.ts
│       │   │   ├── estimate.ts
│       │   │   ├── invoice.ts
│       │   │   ├── staff.ts
│       │   │   └── attendance.ts
│       │   ├── types/            # TypeScript types derived from Zod
│       │   │   └── index.ts
│       │   └── constants/
│       │       ├── roles.ts      # OWNER, STAFF
│       │       └── status.ts     # Vehicle statuses, payment statuses
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── web/                      # React Frontend (Vite + Tailwind)
│   │   ├── public/
│   │   │   ├── manifest.json     # PWA manifest
│   │   │   ├── sw.js             # Service Worker
│   │   │   └── icons/            # PWA icons (192x192, 512x512)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.tsx          # Entry point
│   │       ├── app.tsx           # Router + providers
│   │       ├── index.css         # Tailwind directives + design tokens
│   │       │
│   │       ├── lib/              # Utility modules
│   │       │   ├── api.ts        # Fetch wrapper (strict, typed)
│   │       │   ├── auth.ts       # Google OAuth + JWT storage
│   │       │   ├── image.ts      # Client-side WebP compression
│   │       │   ├── pdf.ts        # PDF templates + generation
│   │       │   ├── contacts.ts   # Contact Picker API (progressive enhancement)
│   │       │   ├── location.ts   # Geolocation helper
│   │       │   └── config.ts     # Strict env config (throws if missing)
│   │       │
│   │       ├── hooks/            # Custom React hooks
│   │       │   ├── use-auth.ts
│   │       │   ├── use-tenant.ts
│   │       │   ├── use-vehicles.ts
│   │       │   ├── use-staff.ts
│   │       │   └── use-debounce.ts
│   │       │
│   │       ├── components/       # Reusable UI components
│   │       │   ├── layout/
│   │       │   │   ├── topbar.tsx
│   │       │   │   ├── bottom-nav.tsx
│   │       │   │   ├── page-shell.tsx
│   │       │   │   └── mobile-container.tsx
│   │       │   ├── ui/
│   │       │   │   ├── button.tsx
│   │       │   │   ├── card.tsx
│   │       │   │   ├── badge.tsx
│   │       │   │   ├── input.tsx
│   │       │   │   ├── textarea.tsx
│   │       │   │   ├── select.tsx
│   │       │   │   ├── search-bar.tsx
│   │       │   │   ├── photo-upload.tsx
│   │       │   │   ├── stat-card.tsx
│   │       │   │   ├── list-item.tsx
│   │       │   │   ├── price-row.tsx
│   │       │   │   ├── total-row.tsx
│   │       │   │   ├── empty-state.tsx
│   │       │   │   ├── loading.tsx
│   │       │   │   ├── modal.tsx
│   │       │   │   ├── toast.tsx
│   │       │   │   └── filter-chips.tsx
│   │       │   └── domain/       # Business-specific components
│   │       │       ├── vehicle-search.tsx
│   │       │       ├── contact-picker.tsx
│   │       │       ├── qr-display.tsx
│   │       │       ├── qr-scanner.tsx
│   │       │       ├── estimate-items.tsx
│   │       │       └── invoice-items.tsx
│   │       │
│   │       ├── pages/            # One component per route
│   │       │   ├── auth/
│   │       │   │   ├── login.tsx
│   │       │   │   └── callback.tsx
│   │       │   ├── onboarding/
│   │       │   │   └── setup.tsx
│   │       │   ├── dashboard/
│   │       │   │   └── index.tsx
│   │       │   ├── vehicles/
│   │       │   │   ├── list.tsx
│   │       │   │   ├── add.tsx
│   │       │   │   └── details.tsx
│   │       │   ├── estimates/
│   │       │   │   ├── list.tsx
│   │       │   │   └── editor.tsx
│   │       │   ├── invoices/
│   │       │   │   ├── list.tsx
│   │       │   │   └── editor.tsx
│   │       │   ├── staff/
│   │       │   │   ├── list.tsx
│   │       │   │   ├── profile.tsx
│   │       │   │   ├── add.tsx
│   │       │   │   ├── attendance.tsx
│   │       │   │   └── checkin.tsx
│   │       │   ├── settings/
│   │       │   │   └── index.tsx
│   │       │   └── invite/
│   │       │       └── accept.tsx
│   │       │
│   │       └── providers/
│   │           ├── auth-provider.tsx
│   │           ├── tenant-provider.tsx
│   │           └── query-provider.tsx
│   │
│   └── api/                      # Hono Backend (Cloudflare Workers)
│       ├── src/
│       │   ├── index.ts          # Hono app entry + middleware chain
│       │   ├── env.ts            # Strict env bindings type
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.ts       # JWT verification
│       │   │   ├── tenant.ts     # Tenant context injection
│       │   │   └── cors.ts       # CORS config
│       │   │
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── tenants.ts
│       │   │   ├── vehicles.ts
│       │   │   ├── customers.ts
│       │   │   ├── estimates.ts
│       │   │   ├── invoices.ts
│       │   │   ├── staff.ts
│       │   │   ├── attendance.ts
│       │   │   ├── upload.ts
│       │   │   └── dashboard.ts
│       │   │
│       │   └── db/
│       │       ├── schema.ts     # Drizzle schema (all tables)
│       │       └── migrations/   # SQL migration files
│       │
│       ├── wrangler.toml
│       └── package.json
│
└── plan/                         # Planning docs (stays, not deployed)
    ├── index.txt
    ├── 00-the-plan.txt
    ├── 01-note.txt
    ├── old.req.md
    └── final/                    # Finalized plan docs
        ├── 00-overview.md
        ├── 01-tech-stack.md
        ├── 02-folder-structure.md
        ├── 03-database.md
        ├── 04-api-routes.md
        └── 05-ui-screens.md
```

---

## Key Structural Decisions

| Decision | Why |
|---|---|
| **Monorepo with npm workspaces** | Frontend + backend share Zod schemas from `packages/shared`. Zero extra tools. |
| **`packages/shared`** | Single source of truth for validation schemas and types. No duplication. |
| **`components/ui/` vs `components/domain/`** | Generic UI primitives (Button, Card) separate from business components (VehicleSearch, QRDisplay). |
| **`pages/` = one file per route** | Simple mapping: URL → file. Easy to find things. |
| **`lib/` for utilities** | All standalone logic (API client, image compression, PDF) lives here. Not mixed into components. |
| **`providers/` for React context** | Auth, tenant, and query providers wrap the app. Clean separation. |
| **`db/schema.ts` single file** | All Drizzle tables in one file. For a project this size, splitting is unnecessary. |
