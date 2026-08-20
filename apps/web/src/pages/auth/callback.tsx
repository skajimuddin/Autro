import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle } from '@/components/ui/icons'

import { handleOAuthCallback } from '@/lib/auth'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'

/**
 * OAuth callback page.
 *
 * Google redirects here after the user grants consent.
 * URL will contain ?code=... which we send to the backend to exchange for a JWT.
 *
 * Flow:
 *   1. Extract `code` from URL search params
 *   2. Call handleOAuthCallback(code) → backend exchanges code for JWT
 *   3. Save the JWT
 *   4. Redirect to dashboard (or let auth provider handle routing)
 *
 * Converted off inline styles 2026-08-13 (UI-6). It previously hardcoded seven hex
 * colours, hand-rolled an SVG that duplicates Lucide's AlertCircle, redefined
 * `@keyframes spin` in an inline <style> tag (index.css already ships it as
 * `animate-spin-fast`), and painted the page `#f8fafc` where the design token is
 * `#f1f5f9`.
 */
export default function AuthCallbackPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { onLoginSuccess } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (!code) {
      setError('No authorization code received from Google.')
      return
    }

    handleOAuthCallback(code)
      .then(({ token, user }) => {
        onLoginSuccess(token, user)
        // Navigate to state if provided (e.g., returning to an invite link), else root
        if (state && state.startsWith('/')) {
          navigate(state, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
        setError(message)
      })
  }, [navigate, onLoginSuccess])

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
        <div className="text-center max-w-[320px]">
          <div className="w-14 h-14 rounded-card bg-danger-light flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} strokeWidth={2.5} className="text-danger" />
          </div>
          <h2 className="text-[1.1rem] font-semibold text-text mb-2">Login Failed</h2>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <Button
            id="callback-back-to-login"
            fullWidth={false}
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-divider border-t-primary animate-spin-fast mx-auto mb-4" />
        <p className="text-sm text-text-secondary">Signing you in…</p>
      </div>
    </div>
  )
}
