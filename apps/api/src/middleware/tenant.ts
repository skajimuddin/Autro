import type { Context, Next } from 'hono'
import type { Env, Variables } from '@/env'

/**
 * Tenant middleware — reads X-Tenant-ID header and injects it into context.
 * Must run AFTER authMiddleware (which validates the token).
 *
 * Returns 400 if the header is missing.
 */
export async function tenantMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
): Promise<Response | void> {
  const tenantId = c.req.header('X-Tenant-ID')

  if (!tenantId) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing X-Tenant-ID header' } }, 400)
  }

  c.set('tenantId', tenantId)

  await next()
}
