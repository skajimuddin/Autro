import { useEffect } from 'react'
import { redirectToGoogleLogin } from '@/lib/auth'
import { getToken } from '@/lib/auth'

/**
 * Login page — Screen 1
 *
 * Simple centered layout: App name + subtitle + Google sign-in button.
 * Redirects to dashboard if user is already logged in.
 */
export default function LoginPage(): React.JSX.Element {
  useEffect(() => {
    // If user already has a token, let the auth provider handle redirect
    // This component doesn't redirect — the router does that via protected routes
  }, [])

  const alreadyLoggedIn = Boolean(getToken())

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
        }}
      >
        {/* App logo / icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px -8px rgba(37, 99, 235, 0.4)',
            marginBottom: '28px',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        {/* App name */}
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Workshop
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: '8px 0 40px',
            textAlign: 'center',
            lineHeight: '1.5',
          }}
        >
          Garage Management Made Simple
        </p>

        {/* Google Sign In button */}
        {!alreadyLoggedIn && (
          <button
            id="google-signin-btn"
            onClick={redirectToGoogleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '14px 24px',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = '0 10px 20px -4px rgba(0,0,0,0.1)'
              el.style.transform = 'translateY(-1px)'
              el.style.borderColor = '#94a3b8'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'
              el.style.transform = 'translateY(0)'
              el.style.borderColor = '#cbd5e1'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
          >
            {/* Google icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        )}

        {alreadyLoggedIn && (
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Redirecting you to your dashboard…
          </p>
        )}

        {/* Footer */}
        <p
          style={{
            marginTop: '48px',
            fontSize: '0.75rem',
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  )
}
