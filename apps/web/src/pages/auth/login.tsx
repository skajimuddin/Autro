// Login — the only way into the app.
//
// A centred column on the page ground: logo, one line of value, the one action,
// then three lines on what the app does so a first-time owner knows what they
// are signing in to.
//
// The Google mark stays raw inline SVG with its own fixed colours on purpose —
// it is Google's brand asset, not a design-system colour, and is one of the two
// documented exceptions to "never hard-code a hex" in DESIGN.md.
import { useEffect } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined'
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import QrIcon from '@mui/icons-material/QrCodeScannerRounded'

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

const FEATURES = [
  { icon: DirectionsCarIcon, title: 'Every vehicle, every stage', text: 'From drop-off to delivery, with photos and complaints.' },
  { icon: ReceiptIcon, title: 'Estimates & GST invoices', text: 'Build a bill on your phone and share the PDF on WhatsApp.' },
  { icon: QrIcon, title: 'Staff attendance', text: 'Check in by scanning the code at your workshop door.' },
]

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const alreadyLoggedIn = Boolean(getToken())

  // RequireAuth (App.tsx) bounces an unauthenticated visitor here with the
  // page they were headed to in router state — carry it through the OAuth
  // round trip so /auth/callback can send them on to it instead of always
  // landing on the dashboard.
  const from = (location.state as { from?: Location } | null)?.from
  const returnTo = from ? `${from.pathname}${from.search}` : undefined

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 5,
      }}
    >
      <Stack alignItems="center" textAlign="center" sx={{ width: '100%', maxWidth: 380 }}>
        <Box component="img" src="/apple-touch-icon.png" alt="" sx={{ width: 64, height: 64, mb: 2.5, borderRadius: 2 }} />

        <Typography component="h1" sx={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.025em' }}>
          Sign in to Autro
        </Typography>

        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6, mt: 1, mb: 3.5 }}>
          Run your workshop from your phone.
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
              onClick={() => redirectToGoogleLogin(returnTo)}
              sx={{ height: 48, fontSize: 14 }}
            >
              Continue with Google
            </Button>
            <Typography sx={{ fontSize: 12.5, color: 'text.disabled', mt: 2, lineHeight: 1.5 }}>
              Garage owners sign in here. Staff: open the invite link your owner sent you.
            </Typography>
          </>
        )}

        <Stack spacing={2} sx={{ mt: 5, width: '100%', textAlign: 'left' }}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Stack key={title} direction="row" spacing={1.75} alignItems="flex-start">
              <Box
                sx={(t) => ({
                  width: 36, height: 36, flexShrink: 0, borderRadius: 1.5, display: 'grid', placeItems: 'center',
                  bgcolor: alpha(t.palette.primary.main, 0.1), color: 'primary.main',
                })}
              >
                <Icon sx={{ fontSize: 19 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{title}</Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>{text}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
