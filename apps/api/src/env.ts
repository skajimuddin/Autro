import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

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
}

/**
 * Validates all required env vars/bindings at request time.
 * Call this at the start of each handler to get a typed, validated env.
 *
 * Throws a 500 error with a clear message if any required value is missing.
 */
export function validateEnv(env: Env): Env {
  const required: (keyof Env)[] = [
    'DB',
    'BUCKET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'JWT_SECRET',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ]

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required env binding: ${key}`)
    }
  }

  return env
}
