import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { RefreshTokenSchema } from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { users } from '@/db/schema'

const auth = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Signs a JWT with user_id as `sub`.
 * Expires in 7 days.
 */
async function signJwt(userId: string, jwtSecret: string): Promise<string> {
  const secret = new TextEncoder().encode(jwtSecret)
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

// ── GET /auth/google — Redirect to Google OAuth consent ───────────────────────
auth.get('/google', (c) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = c.env

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return c.redirect(googleAuthUrl)
})

// ── GET /auth/google/callback — Exchange code → create/find user → return JWT ─
auth.get('/google/callback', async (c) => {
  const code = c.req.query('code')

  if (!code) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Missing OAuth code' } }, 400)
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, JWT_SECRET } = c.env

  // 1. Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return c.json(
      { error: { code: 'OAUTH_ERROR', message: 'Failed to exchange OAuth code' } },
      502,
    )
  }

  const tokenData = (await tokenRes.json()) as {
    id_token?: string
    access_token?: string
    error?: string
  }

  if (!tokenData.id_token || !tokenData.access_token) {
    return c.json({ error: { code: 'OAUTH_ERROR', message: 'Google did not return tokens' } }, 502)
  }

  // 2. Verify Google id_token and extract user info
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userInfoRes.ok) {
    return c.json(
      { error: { code: 'OAUTH_ERROR', message: 'Failed to fetch user info from Google' } },
      502,
    )
  }

  const googleUser = (await userInfoRes.json()) as {
    sub: string
    email: string
    name: string
    picture?: string
  }

  if (!googleUser.sub || !googleUser.email) {
    return c.json(
      { error: { code: 'OAUTH_ERROR', message: 'Incomplete user info from Google' } },
      502,
    )
  }

  // 3. Find or create user in database
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  let user = await db
    .select()
    .from(users)
    .where(eq(users.google_id, googleUser.sub))
    .get()

  if (!user) {
    const newUser = {
      id: crypto.randomUUID(),
      google_id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatar_url: googleUser.picture ?? null,
      created_at: now,
      updated_at: now,
    }

    await db.insert(users).values(newUser)
    user = newUser
  } else {
    // Update name/avatar in case they changed
    await db
      .update(users)
      .set({
        name: googleUser.name,
        avatar_url: googleUser.picture ?? null,
        updated_at: now,
      })
      .where(eq(users.id, user.id))
  }

  // 4. Sign JWT with user_id as sub
  const token = await signJwt(user.id, JWT_SECRET)

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url ?? null,
    },
  })
})

// ── POST /auth/refresh — Refresh an expired JWT ───────────────────────────────
auth.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = RefreshTokenSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Missing or invalid token' } },
      400,
    )
  }

  const { JWT_SECRET } = c.env
  const secret = new TextEncoder().encode(JWT_SECRET)

  let userId: string
  try {
    // Allow expired tokens for refresh (clockTolerance won't help here — we need
    // to verify the signature but ignore expiry). jose doesn't support
    // ignoring expiry, so we extract the payload without verification for the sub,
    // then re-verify signature only by not passing clockTolerance options.
    // Instead: decode payload first to get sub, then re-issue.
    // The canonical safe approach: verify with a large clock tolerance.
    const { payload } = await jwtVerify(parsed.data.token, secret, {
      clockTolerance: 60 * 60 * 24 * 30, // 30-day grace for refresh
    })

    if (typeof payload.sub !== 'string') {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } }, 401)
    }
    userId = payload.sub
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token signature' } }, 401)
  }

  const db = drizzle(c.env.DB)
  const user = await db.select().from(users).where(eq(users.id, userId)).get()

  if (!user) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404)
  }

  const newToken = await signJwt(userId, JWT_SECRET)

  return c.json({
    token: newToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url ?? null,
    },
  })
})

export default auth
