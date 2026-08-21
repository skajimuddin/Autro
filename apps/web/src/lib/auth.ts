import { config } from '@/lib/config'

// ── JWT Storage ───────────────────────────────────────────────────────────────
// Tokens stored in localStorage under this key.
const TOKEN_KEY = 'autro_jwt'

/**
 * Save JWT to localStorage.
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Retrieve JWT from localStorage. Returns null if not logged in.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Remove JWT from localStorage (logout).
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * Redirect the browser to the backend's Google OAuth initiation URL.
 * The backend handles the redirect to Google and manages the callback.
 *
 * This keeps OAuth secrets on the server (not exposed to the browser).
 *
 * `returnTo` is an optional same-origin path — where the app should land the
 * visitor after a successful login (an invite link, a page they were
 * bounced from by RequireAuth). It round-trips through Google as the OAuth
 * `state` param and comes back on /auth/callback's query string, where it's
 * only ever treated as a path (never a full URL), so it can't be used to
 * bounce someone off-site.
 */
export function redirectToGoogleLogin(returnTo?: string): void {
  const url = new URL(`${config.apiBaseUrl}/auth/google`)
  if (returnTo) url.searchParams.set('state', returnTo)
  window.location.href = url.toString()
}

/**
 * Exchange the OAuth callback code for a JWT by calling the backend.
 * Called from the /auth/callback page after Google redirects back.
 *
 * Returns the user info and token on success.
 * Throws on failure.
 */
export async function handleOAuthCallback(code: string): Promise<{
  token: string
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
}> {
  const res = await fetch(
    `${config.apiBaseUrl}/auth/google/callback?code=${encodeURIComponent(code)}`,
  )

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(data?.error?.message ?? 'OAuth login failed')
  }

  return res.json() as Promise<{
    token: string
    user: { id: string; email: string; name: string; avatar_url: string | null }
  }>
}
