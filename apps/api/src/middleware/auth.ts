import type { Context, Next } from 'hono'
import * as jose from 'jose'
import type { Env, Variables } from '@/env'

/**
 * Auth middleware — validates the Bearer JWT in Authorization header.
 * Injects `userId` and `tenantId` into context variables.
 *
 * Returns 401 if token is missing or invalid.
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } },
      401,
    )
  }

  const token = authHeader.slice(7)

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)

    if (typeof payload.sub !== 'string' || typeof payload.tenantId !== 'string') {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } }, 401)
    }

    c.set('userId', payload.sub)
    c.set('tenantId', payload.tenantId as string)
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
  }

  await next()
}
