import type { Context, Next } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, isNull } from 'drizzle-orm'
import type { Role } from '@autro/shared'
import type { Env, Variables } from '@/env'
import { tenant_members } from '@/db/schema'

/**
 * Tenant middleware — reads X-Tenant-ID header, verifies the authenticated
 * user is an active member of that tenant, then injects tenantId into context.
 *
 * MUST run AFTER authMiddleware (which injects userId into context).
 *
 * Returns 400 if header is missing.
 * Returns 403 if user is not a member of the tenant.
 */
export async function tenantMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
): Promise<Response | void> {
  const tenantId = c.req.header('X-Tenant-ID')

  if (!tenantId) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing X-Tenant-ID header' } }, 400)
  }

  const userId = c.get('userId')

  // Verify user is an active member of this tenant
  const db = drizzle(c.env.DB)
  const member = await db
    .select()
    .from(tenant_members)
    .where(
      and(
        eq(tenant_members.tenant_id, tenantId),
        eq(tenant_members.user_id, userId),
        isNull(tenant_members.removed_at),
      ),
    )
    .get()

  if (!member) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'You are not a member of this garage' } },
      403,
    )
  }

  c.set('tenantId', tenantId)
  c.set('role', member.role as Role)

  await next()
}

/**
 * requireOwner — rejects the request unless the caller's role in the current
 * tenant is OWNER.
 *
 * MUST run AFTER tenantMiddleware (which sets `role` on context). Route
 * groups that are Owner-only per 05-ui-screens.md's Access column (e.g. all
 * of /staff/*, aside from the public invite view and the accept endpoint —
 * which run before tenant context even exists) use this instead of every
 * handler re-checking role itself.
 */
export async function requireOwner(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
): Promise<Response | void> {
  if (c.get('role') !== 'OWNER') {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Only the garage owner can do this' } },
      403,
    )
  }

  await next()
}
