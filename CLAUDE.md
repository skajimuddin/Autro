# Autro — working notes for agents

Multi-tenant garage/workshop management. npm workspaces: `apps/web` (React +
Vite, PWA), `apps/api` (Hono on Cloudflare Workers + D1 + R2),
`packages/shared` (Zod schemas shared by both).

```bash
npm run typecheck        # all workspaces — run before every commit
npm run lint             # oxlint
npm run build --workspace=apps/web
```

## `planning/` is HISTORY, not a specification

**`planning/final/` and `planning/notes/` describe the app as it was scoped
before the first build. It is out of date and the product has moved past it.
Do not treat it as a contract and do not implement from it line by line.**

Read it for background — what a screen was originally for, why a table looks
the way it does — then decide from the code that actually exists. Where the two
disagree, **the codebase wins**.

In particular, do not restore a route, field or screen only because a planning
document lists it. If nothing calls it today, it is dead surface: leave it out
and add it when the feature is actually built. `planning/final/05-ui-screens.md`
also carries an old visual spec (Inter, `#2563EB`, rounded cards) that
`DESIGN.md` supersedes entirely.

## `DESIGN.md` is the design authority

Colour, type, spacing and component rules live there, and it is current. The
one brand colour is defined in `apps/web/src/theme.ts`; never hard-code a hex
at a call site.

## House rules that came from real bugs

- **Every figure on screen must be backed by a real endpoint.** If the data
  does not exist, the element does not ship — do not fill a card with a
  plausible-looking number.
- **No fallback defaults for config.** Missing env var → throw at startup, per
  `apps/api/src/env.ts`. Never `process.env.X || 'some-default'`.
- **Check what an icon actually draws.** Lucide's `receipt` contains a dollar
  sign; this app is ₹ only.
- Currency is ₹ with `en-IN` grouping. Money and counts use tabular figures.
