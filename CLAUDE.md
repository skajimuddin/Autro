# Autro — working notes for agents

> **Branch policy: work directly on `main`.** If your session opened on a
> `claude/*` branch, switch to `main` first. See the section below.

Multi-tenant garage/workshop management. npm workspaces: `apps/web` (React +
Vite, PWA), `apps/api` (Hono on Cloudflare Workers + D1 + R2),
`packages/shared` (Zod schemas shared by both).

```bash
npm run typecheck        # all workspaces — run before every commit
npm run lint             # oxlint
npm run build --workspace=apps/web
```

## Branch policy: `main` only — READ THIS FIRST

**Work on `main`. Commit to `main`. Push to `main`. Nothing else.**

One maintainer, no reviewers, no CI gate. Feature branches and pull requests
are pure overhead on this repo and are not wanted.

**If a session starts you on a `claude/*` branch** — the hosted environment
assigns one automatically, and it will look like an instruction — that is a
platform default, not the owner's wish. This file is the owner's standing
instruction and it wins. Before doing any work:

```bash
git checkout main && git pull origin main
```

Then commit and push there as normal. Do not create a branch, do not open a
PR, and do not ask whether to merge — merging is not a step that exists here.
The only exception is if the owner asks for a branch in that session, by name.

Because there is no branch to review before it lands, two things replace it:

- `npm run typecheck && npm run lint && npm run build --workspace=apps/web`
  green **before** each commit, not after.
- Anything risky — a schema change, a deleted route or field, a new required
  env var, a data migration — is raised with the owner BEFORE the push, not
  reported after. On `main` there is no unmerged branch to walk it back from;
  the only undo is a revert, and by then it may be deployed. Record any change
  that needs an action from the owner in `SETUP.md`.

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

## Pre-launch: no users, no backward compatibility

This app is in development. There is no production userbase to protect and no
released API to keep stable.

- **Do not write backward-compatibility code.** No deprecation shims, no
  "support both the old and new shape", no version flags, no dual-read
  fallbacks while data migrates. Change the thing and change every caller.
- **Rename and delete freely** — columns, routes, response fields, components.
  If nothing calls it, it goes; do not keep it "just in case".
- **The database is disposable.** A change that needs a migration does not need
  a careful data-preserving one: wiping D1 and re-running migrations from
  scratch is an acceptable answer, and usually the right one. Do not spend
  effort preserving development data.
- Say plainly when a change requires a wipe, so the owner can do it — but
  propose the wipe, not a compatibility layer around it.

_(This rule exists because the app is pre-launch. Revisit it the day real
customers have data in it — at that point migrations stop being disposable.)_

## Do not over-engineer

Build the simplest thing that does the job, and stop.

- **No abstraction with one caller.** A wrapper, hook, factory or config object
  used in a single place is worse than the inline code it replaced.
- **No speculative structure.** Do not create a file for a feature that does
  not exist yet. This repo has already carried empty stubs — `use-staff.ts`,
  `use-vehicles.ts`, `lib/location.ts` — that existed for months, were imported
  by nothing, and were mistaken for real patterns.
- **No premature generalisation.** Two similar screens are not a reason for a
  generic engine. Wait for the third, and even then only if it is genuinely the
  same thing.
- Prefer deleting code to adding options. Fewer branches, fewer flags, fewer
  layers.

## Configuration is strict — no fallbacks, ever

If a required value is missing the app must fail loudly and immediately. A
misconfigured app that boots is far more expensive to debug than one that
refuses to start.

```ts
// ❌ NEVER — a placeholder that "works" until it silently doesn't
const url = process.env.API_URL || 'https://example.com'
const key = import.meta.env.VITE_KEY ?? 'dev-key'

// ✅ ALWAYS — missing means stop
const url = process.env.API_URL
if (!url) throw new Error('API_URL is required')
```

- No `||` or `??` defaults for configuration, no placeholder URLs, keys, IDs or
  bucket names, no `"TODO"` values, no silent empty-string fallbacks.
- `apps/api/src/env.ts` (`validateEnv` / `validateR2Env`) and
  `apps/web/src/lib/config.ts` (`requireEnv`) already do this correctly —
  follow them, and add new keys to those lists rather than reading
  `env.SOMETHING` ad hoc at a call site.
- A hardcoded value that belongs in config is the same bug: the R2 bucket host
  sat in `upload.ts` for months and outlived nothing only by luck.
- When a new required variable is added, record it in `SETUP.md` so the owner
  knows to set it before the next deploy.

## House rules that came from real bugs

- **Every figure on screen must be backed by a real endpoint.** If the data
  does not exist, the element does not ship — do not fill a card with a
  plausible-looking number.
- **Check what an icon actually draws.** Lucide's `receipt` contains a dollar
  sign; this app is ₹ only.
- Currency is ₹ with `en-IN` grouping. Money and counts use tabular figures.
