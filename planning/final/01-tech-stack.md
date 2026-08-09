# Workshop — Tech Stack

---

## Frontend

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 19** + **Vite** | Fast builds, modern React |
| Language | **TypeScript** (strict mode) | Type safety, zero `any` |
| Styling | **Tailwind CSS v4** | Utility-first, matches demo UI, rapid development |
| Routing | **React Router v7** | Simple client-side routing |
| Server State | **TanStack Query v5** | Caching, auto-refetch, loading/error states |
| Forms | **React Hook Form** + **Zod** | Minimal re-renders, schema validation |
| PDF | **@react-pdf/renderer** | Client-side PDF generation (zero server cost) |
| Image Compression | **browser-image-compression** | Client-side WebP conversion before upload |
| Icons | **Lucide React** | Clean, consistent, tree-shakable (lighter than FontAwesome) |
| QR Generate | **qrcode.react** | Static QR code display for owner |
| QR Scan | **html5-qrcode** | Camera-based QR scanner for staff |
| Font | **Inter** (Google Fonts) | Clean, modern, matches demo UI |

## Backend

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Cloudflare Workers** | Edge computing, pay-per-request, global |
| Framework | **Hono** | Lightweight, typed, built for Workers |
| Database | **Cloudflare D1** (SQLite) | Zero cost at small scale, embedded |
| ORM | **Drizzle ORM** | Type-safe, lightweight, D1-compatible, easy migration to Postgres later |
| File Storage | **Cloudflare R2** | S3-compatible, zero egress fees |
| Auth | **Google OAuth 2.0** → **JWT** | Only login method, simple |
| Validation | **Zod** | Shared schemas between frontend and backend |

## Infrastructure

| Layer | Choice |
|---|---|
| Frontend hosting | **Cloudflare Pages** |
| API hosting | **Cloudflare Workers** |
| Domain | `workshop.zeonweb.com` |
| CI/CD | **GitHub Actions** → Wrangler deploy on push to main |

## Shared (Monorepo)

| Layer | Choice | Why |
|---|---|---|
| Monorepo | **npm workspaces** | Zero extra dependencies, built into npm |
| Shared package | `packages/shared` | Zod schemas + TypeScript types used by both frontend and backend |

---

## Estimated Monthly Cost (First ~100 Garages)

| Service | Free Tier Limit | Expected Usage | Monthly Cost |
|---|---|---|---|
| Workers | 100K requests/day | ~50K req/day | **$0** |
| D1 | 5M reads + 100K writes/day | ~500K reads + 10K writes/day | **$0** |
| R2 | 10GB storage + 10M reads/mo | ~5GB (compressed images) | **$0** |
| Pages | Unlimited static hosting | — | **$0** |
| **Total** | | | **$0/month** |

> Costs only start at serious scale (~1000+ active garages).

---

## Key Cost Optimizations

| Optimization | How |
|---|---|
| Client-side PDF | `@react-pdf/renderer` — PDF built in browser, zero server compute |
| Client-side WebP | `browser-image-compression` — images compressed before upload |
| Presigned R2 uploads | Worker generates signed URL, browser uploads directly to R2 |
| Paginated queries | Cursor-based, 20 items per page. Never load 1000 records |
| No WebSockets | QR is static (no real-time refresh needed). Eliminates Durable Objects cost |
| Soft deletes | `deleted_at` column. No data recovery headaches |
