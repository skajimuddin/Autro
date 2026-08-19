import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { getToken, redirectToGoogleLogin } from '@/lib/auth'

/**
 * Login page — Screen 1, restyled 2026-08-19 to match
 * planning/design_handoff_autro_ui: centred column, 64px logo mark, 32px/700
 * "Autro", one-line value prop (max ~32ch), full-width solid primary button,
 * footnote about owner-only login. Flat system: zero radius, no card shadow
 * on the button — see DESIGN.md.
 *
 * Uses the real Autro logo (public/apple-touch-icon.png, the asset the
 * handoff bundled for exactly this screen) instead of a generic icon tile.
 * The Google mark stays raw inline SVG on purpose: it is Google's brand
 * asset with fixed brand colours, not a design-system colour.
 */
export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const alreadyLoggedIn = Boolean(getToken())

  useEffect(() => {
    // If user already has a token, redirect to dashboard/onboarding
    if (alreadyLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [alreadyLoggedIn, navigate])

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[380px] flex flex-col items-center text-center">
        <img
          src="/apple-touch-icon.png"
          alt=""
          className="w-16 h-16 mb-6"
        />

        <h1 className="text-[2rem] font-bold text-text tracking-tight">
          Autro
        </h1>

        <p className="text-row-title text-text-secondary leading-normal mt-2 mb-9 max-w-[32ch]">
          Garage management, simplified. Vehicles, estimates and invoices in one place.
        </p>

        {alreadyLoggedIn ? (
          <p className="text-row-sub text-text-secondary">
            Redirecting you to your dashboard…
          </p>
        ) : (
          <>
            <button
              id="google-signin-btn"
              type="button"
              onClick={redirectToGoogleLogin}
              className={[
                'w-full flex items-center justify-center gap-3',
                'bg-primary text-white text-row-title font-semibold',
                'rounded-button px-6 py-3.5 cursor-pointer',
                'transition-colors duration-150 hover:bg-primary-hover active:scale-press',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              ].join(' ')}
            >
              {/* Google brand mark — fixed brand colours, not design tokens */}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#fff"
                  fillOpacity="0.92"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#fff"
                  fillOpacity="0.75"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#fff"
                  fillOpacity="0.6"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#fff"
                />
              </svg>
              Continue with Google
            </button>
            <p className="text-row-sub text-text-muted mt-4">
              Owner login only. Staff sign in for attendance.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
