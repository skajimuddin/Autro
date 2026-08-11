import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { handleOAuthCallback, saveToken } from '@/lib/auth'

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
 */
export default function AuthCallbackPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setError('No authorization code received from Google.')
      return
    }

    handleOAuthCallback(code)
      .then(({ token }) => {
        saveToken(token)
        // Navigate to root — the auth provider will check for garage and redirect
        navigate('/', { replace: true })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
        setError(message)
      })
  }, [navigate])

  if (error) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', system-ui, sans-serif",
          background: '#f8fafc',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '320px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: '#fee2e2',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#0f172a',
              margin: '0 0 8px',
            }}
          >
            Login Failed
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px' }}>{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#f8fafc',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Spinning loader */}
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Signing you in…</p>
      </div>
    </div>
  )
}
