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
 */
export function redirectToGoogleLogin(): void {
  window.location.href = `${config.apiBaseUrl}/auth/google`
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
