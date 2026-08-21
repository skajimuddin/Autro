// Check-in — the staff member's entire app.
//
// Migrated 2026-08-20 onto the MUI design system. Staff have no nav: a mechanic
// signs in to mark attendance and nothing else, so this is one screen with one
// action on it, and the action changes with the time of day.
//
// Order is deliberate: scan the QR, then read GPS, then post. Scanning first
// means location is never requested from someone who backed out of the scanner.
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Card, Divider, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ScanIcon from '@mui/icons-material/QrCodeScannerRounded'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import PinIcon from '@mui/icons-material/MyLocationRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { QRScanner } from '@/components/domain/qr-scanner'
import { SectionCard } from '@/components/ui/section-card'
import { Kicker } from '@/components/ui/kicker'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { formatTime } from '@/lib/format'

interface MyTodayAttendance {
  check_in_at: string | null
  check_out_at: string | null
  status: 'PRESENT' | 'ABSENT' | null
}

interface MonthlySummary {
  present: number
  absent: number
}

export default function StaffCheckinPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()
  const [isLocating, setIsLocating] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const { data: myToday } = useQuery<MyTodayAttendance>({
    queryKey: ['attendance', 'my-today'],
    queryFn: () => apiFetch<MyTodayAttendance>('/attendance/my-today'),
    refetchInterval: 10_000,
  })

  const { data: monthly } = useQuery<MonthlySummary>({
    queryKey: ['attendance', 'monthly-self'],
    queryFn: () => {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return apiFetch<MonthlySummary>(`/attendance/monthly?month=${month}`)
    },
  })

  const checkin = useMutation({
    mutationFn: (data: { qr_token: string; latitude: number; longitude: number }) =>
      apiFetch('/attendance/checkin', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      showToast('success', 'Checked in')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Check-in failed'),
  })

  const checkout = useMutation({
    mutationFn: (data: { latitude: number; longitude: number }) =>
      apiFetch('/attendance/checkout', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      showToast('success', 'Checked out')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Check-out failed'),
  })

  /** Reads GPS once and hands the fix to `then`. Both directions need it. */
  const withPosition = useCallback(
    (then: (lat: number, lng: number) => void) => {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false)
          then(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          setIsLocating(false)
          showToast('error', 'Could not get your location. Please enable GPS.')
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      )
    },
    [showToast],
  )

  const onScanned = useCallback(
    (qr_token: string) => {
      setShowScanner(false)
      withPosition((latitude, longitude) => checkin.mutate({ qr_token, latitude, longitude }))
    },
    [withPosition, checkin],
  )

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there'
  const busy = isLocating || checkin.isPending || checkout.isPending
  const state = !myToday?.check_in_at ? 'out' : myToday.check_out_at ? 'done' : 'in'

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showScanner && (
        <QRScanner
          onScan={onScanned}
          onError={(m) => {
            setShowScanner(false)
            showToast('error', m)
          }}
          onCancel={() => setShowScanner(false)}
        />
      )}

      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 2, minHeight: 62, borderBottom: 1, borderColor: 'divider' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.015em' }}>
            Hi, {firstName}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>Attendance</Typography>
        </Box>
        <IconButton id="checkin-logout" onClick={logout} aria-label="Sign out" sx={{ color: 'text.disabled' }}>
          <LogoutIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ p: 2, maxWidth: 480, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Card id="checkin-action-card" sx={{ p: 3 }}>
          <Stack alignItems="center" spacing={2.5} textAlign="center">
            <Box
              sx={{
                width: 76, height: 76, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: (t) =>
                  state === 'out'
                    ? alpha(t.palette.primary.main, 0.12)
                    : alpha(t.palette.success.main, 0.14),
                color: state === 'out' ? 'primary.main' : 'success.main',
              }}
            >
              {state === 'out' ? <ScanIcon sx={{ fontSize: 34 }} /> : <CheckIcon sx={{ fontSize: 34 }} />}
            </Box>

            {state === 'out' && (
              <>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Ready to check in?</Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.disabled', mt: 0.5 }}>
                    Scan the QR code at the workshop
                  </Typography>
                </Box>
                <Button
                  id="checkin-scan-btn"
                  variant="contained"
                  fullWidth
                  startIcon={<ScanIcon />}
                  disabled={busy}
                  onClick={() => setShowScanner(true)}
                  sx={{ height: 48 }}
                >
                  {busy ? 'Checking in…' : 'Check in'}
                </Button>
              </>
            )}

            {state === 'in' && (
              <>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Checked in</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'success.main', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(myToday?.check_in_at ?? null)}
                  </Typography>
                </Box>
                <Button
                  id="checkout-btn"
                  variant="outlined"
                  fullWidth
                  startIcon={<PinIcon />}
                  disabled={busy}
                  onClick={() => withPosition((latitude, longitude) => checkout.mutate({ latitude, longitude }))}
                  sx={{ height: 48 }}
                >
                  {busy ? 'Checking out…' : 'Check out'}
                </Button>
              </>
            )}

            {state === 'done' && (
              <>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Done for today</Typography>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box>
                    <Kicker>In</Kicker>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(myToday?.check_in_at ?? null)}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Kicker>Out</Kicker>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(myToday?.check_out_at ?? null)}
                    </Typography>
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </Card>

        <SectionCard title="This month" padded>
          <Stack direction="row" spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Kicker>Present</Kicker>
              <Typography sx={{ fontSize: 26, fontWeight: 700, color: 'success.main', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {monthly?.present ?? 0}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Kicker>Absent</Kicker>
              <Typography sx={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {monthly?.absent ?? 0}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>
      </Box>
    </Box>
  )
}
