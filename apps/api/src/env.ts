import type { D1Database, R2Bucket } from '@cloudflare/workers-types'
import type { Role } from '@autro/shared'

/**
 * Typed Cloudflare Workers bindings.
 * - DB and BUCKET are Wrangler bindings (from wrangler.toml) — injected at runtime.
 * - Secrets are from .dev.vars locally / wrangler secrets in production.
 *
 * IMPORTANT: All fields are required. The app throws if any are missing.
 * This is intentional — silent misconfigurations are worse than crashes.
 */
export interface Env {
  // ── Wrangler bindings ───────────────────────────────────────────────────────
  DB: D1Database
  BUCKET: R2Bucket

  // ── Secrets ─────────────────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URI: string
  JWT_SECRET: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
}

/**
 * Context variables injected by auth + tenant middleware.
 * Passed as the Variables generic to Hono so c.set()/c.get() are typed.
 */
export interface Variables {
  userId: string
  tenantId: string
  /** Caller's role in the current tenant. Set by tenantMiddleware. */
  role: Role
}

/**
 * Env keys every request needs regardless of which route it hits.
 */
const CORE_KEYS: (keyof Env)[] = [
  'DB',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'JWT_SECRET',
]

/**
 * Env keys only the R2 presign route needs. Kept separate so a deployment
 * without upload credentials still serves the rest of the API instead of
 * failing every request — while the upload route itself still fails loudly.
 */
const R2_KEYS: (keyof Env)[] = [
  'BUCKET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
]

function assertKeys(env: Env, keys: (keyof Env)[]): void {
  const missing = keys.filter((key) => !env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required env binding: ${missing.join(', ')}`)
  }
}

/**
 * Validates the env vars/bindings every route depends on.
 * Applied as global middleware in index.ts.
 *
 * Throws (→ 500 via app.onError) if any required value is missing. There are
 * deliberately no fallback defaults: a silent misconfiguration is worse than a
 * crash.
 */
export function validateEnv(env: Env): Env {
  assertKeys(env, CORE_KEYS)
  return env
}

/**
 * Validates the R2 credentials used to sign upload URLs.
 * Call this at the top of any handler that signs R2 requests.
 */
export function validateR2Env(env: Env): Env {
  assertKeys(env, R2_KEYS)
  return env
}
