import type { Context, Next } from 'hono'
import { jwtVerify } from 'jose'
import type { Env, Variables } from '@/env'

/**
 * Auth middleware — validates the Bearer JWT in Authorization header.
 *
 * JWT payload: { sub: user_id }
 * Injects `userId` into context variables for downstream handlers.
 *
 * Returns 401 if token is missing, malformed, or expired.
 *
 * Usage: apply BEFORE tenant middleware on all protected routes.
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
    const { payload } = await jwtVerify(token, secret)

    if (typeof payload.sub !== 'string') {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } }, 401)
    }

    // Inject user_id into context for all downstream handlers
    c.set('userId', payload.sub)
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
  }

  await next()
}
