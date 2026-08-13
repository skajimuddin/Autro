import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Wrench } from '@/components/ui/icons'

import { getToken, redirectToGoogleLogin } from '@/lib/auth'

/**
 * Login page — Screen 1
 *
 * Centered layout: app name + subtitle + Google sign-in button.
 * Redirects to dashboard if the user is already logged in.
 *
 * Converted off inline styles 2026-08-13 (UI-6). Changes beyond the mechanical
 * conversion, all to bring it back in line with the plan:
 *   - dropped a 3-stop `linear-gradient` page background and a second gradient on
 *     the logo tile; neither exists in the design system (05-ui-screens.md
 *     prescribes solid primary + shadow, and `bg` is a flat #f1f5f9)
 *   - replaced a hand-rolled wrench <svg> with Lucide's Wrench
 *   - replaced four onMouse* handlers that mutated element styles imperatively
 *     with hover:/active: utilities
 *   - removed a "By signing in, you agree to our Terms of Service." line. Screen 1
 *     says "Nothing else — dead simple", and there is no Terms page anywhere in
 *     the app, so the sentence pointed at a document that does not exist.
 *
 * The Google mark stays raw inline SVG on purpose: it is Google's brand asset with
 * fixed brand colours, so it is not a design-system colour and Lucide has no
 * equivalent.
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
      <div className="w-full max-w-[380px] flex flex-col items-center">
        {/* App mark */}
        <div className="w-[72px] h-[72px] rounded-[20px] bg-primary flex items-center justify-center shadow-[var(--shadow-primary)] mb-7">
          <Wrench size={36} strokeWidth={2.5} className="text-white" />
        </div>

        <h1 className="text-[2rem] font-bold text-text tracking-tight">
          Workshop
        </h1>

        <p className="text-base text-text-secondary text-center leading-normal mt-2 mb-10">
          Garage Management Made Simple
        </p>

        {alreadyLoggedIn ? (
          <p className="text-sm text-text-secondary">
            Redirecting you to your dashboard…
          </p>
        ) : (
          <button
            id="google-signin-btn"
            type="button"
            onClick={redirectToGoogleLogin}
            className={[
              'w-full flex items-center justify-center gap-3',
              'bg-card text-text text-base font-semibold',
              'border-[1.5px] border-border rounded-button px-6 py-3.5',
              'shadow-[var(--shadow-card)] cursor-pointer',
              'transition-all duration-150',
              'hover:-translate-y-px hover:border-text-muted hover:shadow-md',
              'active:translate-y-0 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            ].join(' ')}
          >
            {/* Google brand mark — fixed brand colours, not design tokens */}
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
      </div>
    </div>
  )
}
