# Workshop — Product Overview

> **App Name:** Workshop  
> **Domain:** workshop.zeonweb.com  
> **Type:** Multi-tenant SaaS — Garage/Workshop Management  
> **Target Users:** Small local automobile workshops replacing paper notebooks  
> **MVP Philosophy:** "Will this save time for a small garage owner?" — If no, don't build it.

---

## What This App Does

A simple, mobile-first web app for small garage/workshop owners to:
- Register vehicles (any type — car, bike, truck, auto)
- Track customers and their vehicle history
- Create estimates and convert them to final invoices
- Generate PDF invoices (client-side, zero server cost)
- Manage staff attendance with QR + GPS verification
- Share invoices via WhatsApp

---

## Design Principles

| # | Principle | What it means |
|---|---|---|
| 1 | **Google Pay simplicity** | Clean, minimal, zero clutter. Each screen does ONE thing well |
| 2 | **3-tap rule** | Any common action completable in ≤ 3 taps |
| 3 | **No wheel reinvention** | Use existing libraries. Less code = less bugs |
| 4 | **Strict code** | No fallback hardcoding. If env/config missing → crash, don't silently break |
| 5 | **Cost-effective** | Client-side PDF, client-side WebP, paginated queries, minimal server compute |
| 6 | **Mobile-first PWA** | Designed for phone screens. Desktop is secondary |

### Code Philosophy

```typescript
// ❌ NEVER
const baseUrl = process.env.BASE_URL || "https://placeholder.cc";

// ✅ ALWAYS
const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error("BASE_URL is required");
```

---

## User Roles

### Owner
- Full access to everything
- Manages garage, vehicles, estimates, invoices, staff
- Generates QR for staff attendance
- Views all reports and stats

### Staff
- Login is **only for attendance**
- Can: Check-in via QR scan, check-out, view own attendance
- Cannot: Access vehicles, estimates, invoices, or any garage management
- This keeps it dead simple — no audit logs, no permissions complexity

---

## MVP Scope — What's IN

- Google Auth login (only method)
- Garage onboarding (name, phone, address, location, logo)
- Vehicle registration with customer details
- Vehicle photo upload (client-side WebP compression)
- Vehicle status tracking (Repairing → Ready → Delivered)
- Estimate creation with line items (description + amount, no types)
- Invoice creation (import from estimate or fresh)
- Optional tax toggle with % field
- Discount (flat ₹ or %)
- Client-side PDF generation
- WhatsApp sharing (wa.me link)
- Staff invitation via shareable link (no expiry, revokable)
- Staff QR attendance (static QR + GPS verification)
- Monthly attendance + salary summary
- Garage settings / profile editing
- Toast notifications (success/error)
- Payment tracking (Cash, UPI, Card, Other)
- PWA (installable on phone)
- Light mode only
- English only
- ₹ INR hardcoded

## MVP Scope — What's OUT (Future)

- Dark mode
- Multi-language
- Multi-garage per user (DB supports it, UI doesn't expose it yet)
- Push notifications
- WhatsApp API integration
- Inventory management
- Online booking
- Customer portal
- AI features (OCR, voice notes)
- Reports/analytics beyond dashboard stats
- Staff doing anything beyond attendance

---

## Success Criteria

| Action | Target Time |
|---|---|
| Add a vehicle + customer | < 1 minute |
| Create an estimate | < 2 minutes |
| Convert estimate → invoice | < 30 seconds |
| Generate & share invoice PDF | < 30 seconds |
| Staff check-in | < 10 seconds |
| New user learns the app | < 15 minutes |

---

## Plan Files Index

| File | What it covers |
|---|---|
| `00-overview.md` | This file — product vision, principles, scope |
| `01-tech-stack.md` | Full tech stack with rationale |
| `02-folder-structure.md` | Complete project directory tree |
| `03-database.md` | Database schema, ER diagram, indexes |
| `04-api-routes.md` | All backend API endpoints |
| `05-ui-screens.md` | All screens, components, design system, user flows |
