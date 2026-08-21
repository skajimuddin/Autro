// Login — the only way into the app.
//
// Migrated 2026-08-20 onto the MUI design system. A centred column on the page
// ground: logo, wordmark, one line of value, one action. Nothing else belongs
// on a screen whose only job is to start OAuth.
//
// The Google mark stays raw inline SVG with its own fixed colours on purpose —
// it is Google's brand asset, not a design-system colour, and is one of the two
// documented exceptions to "never hard-code a hex" in DESIGN.md.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Box, Button, Stack, Typography } from '@mui/material'

import { getToken, redirectToGoogleLogin } from '@/lib/auth'

function GoogleMark(): React.JSX.Element {
  return (
    <Box component="svg" width={18} height={18} viewBox="0 0 24 24" aria-hidden="true" sx={{ flexShrink: 0 }}>
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
    </Box>
  )
}

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const alreadyLoggedIn = Boolean(getToken())

  useEffect(() => {
    if (alreadyLoggedIn) {
      void navigate('/', { replace: true })
    }
  }, [alreadyLoggedIn, navigate])

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'grid',
        placeItems: 'center',
        p: 3,
      }}
    >
      <Stack alignItems="center" textAlign="center" sx={{ width: '100%', maxWidth: 380 }}>
        <Box component="img" src="/apple-touch-icon.png" alt="" sx={{ width: 64, height: 64, mb: 3, borderRadius: 2 }} />

        <Typography component="h1" sx={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.025em' }}>
          Autro
        </Typography>

        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6, mt: 1, mb: 4.5, maxWidth: '32ch' }}>
          Garage management, simplified. Vehicles, estimates and invoices in one place.
        </Typography>

        {alreadyLoggedIn ? (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            Redirecting you to your dashboard…
          </Typography>
        ) : (
          <>
            <Button
              id="google-signin-btn"
              variant="contained"
              fullWidth
              startIcon={<GoogleMark />}
              onClick={redirectToGoogleLogin}
              sx={{ height: 48, fontSize: 14 }}
            >
              Continue with Google
            </Button>
            <Typography sx={{ fontSize: 12.5, color: 'text.disabled', mt: 2 }}>
              Owner login only. Staff sign in for attendance.
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  )
}
