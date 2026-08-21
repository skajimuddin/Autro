// OAuth callback — Google redirects here with ?code=… which the backend
// exchanges for a JWT.
//
// Migrated 2026-08-20 onto the MUI design system. Two states only: a spinner
// while the exchange is in flight, and a failure with a way back. There is no
// success state — a successful exchange navigates away immediately.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'

import { handleOAuthCallback } from '@/lib/auth'
import { useAuth } from '@/providers/auth-provider'

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
        // `state` carries where the user was headed before login — an invite
        // link, usually. Only same-origin paths, so it cannot be used to
        // bounce someone off-site.
        if (state && state.startsWith('/')) {
          void navigate(state, { replace: true })
        } else {
          void navigate('/', { replace: true })
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      })
  }, [navigate, onLoginSuccess])

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
      {error ? (
        <Stack alignItems="center" textAlign="center" spacing={2} sx={{ maxWidth: 320 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: (t) => alpha(t.palette.error.main, 0.14),
              color: 'error.main',
            }}
          >
            <ErrorIcon sx={{ fontSize: 26 }} />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 600 }}>Login failed</Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>{error}</Typography>
          <Button
            id="callback-back-to-login"
            variant="contained"
            onClick={() => void navigate('/login', { replace: true })}
            sx={{ mt: 1 }}
          >
            Back to login
          </Button>
        </Stack>
      ) : (
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={34} thickness={4} />
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>Signing you in…</Typography>
        </Stack>
      )}
    </Box>
  )
}
