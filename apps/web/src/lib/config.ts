/**
 * Strict environment configuration for the frontend.
 *
 * RULE: If a required env var is missing, the app CRASHES immediately
 * with a clear error message. Never use fallback/default values.
 *
 * Vite exposes VITE_* variables to the browser bundle.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined
  if (!value) {
    throw new Error(
      `[Workshop] Missing required environment variable: ${key}\n` +
        `Please check your .env file and ensure ${key} is set.`,
    )
  }
  return value
}

export const config = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
  googleClientId: requireEnv('VITE_GOOGLE_CLIENT_ID'),
} as const
