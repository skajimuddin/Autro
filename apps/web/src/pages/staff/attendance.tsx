// Attendance — the QR an owner displays at the entrance, and who has come in.
//
// Migrated 2026-08-20 onto the MUI design system. Two columns at md:+: the QR
// is the thing that gets printed and stuck on a wall, so it keeps its own
// column rather than scrolling away above the log.
//
// Every figure comes from GET /attendance/today, which returns present, absent
// and the entries. The endpoint only returns members who have a log row for
// today, so "present + absent" is not the team size and is not presented as
// one — there is no "x of y" here.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Avatar, Box, Button, Card, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import QrIcon from '@mui/icons-material/QrCode2Rounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'
import LoginIcon from '@mui/icons-material/LoginRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { QRDisplay } from '@/components/domain/qr-display'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { Kicker } from '@/components/ui/kicker'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { formatTime } from '@/lib/format'

interface QRData {
  // Must match GET /attendance/qr exactly. apiFetch<T> only asserts the type
  // and does no runtime validation, so a wrong field name here fails silently
  // and the QR never renders — which is exactly what happened once already.
  qr_token: string
}

interface AttendanceEntry {
  member_id: string
  name: string
  avatar_url: string | null
  check_in_at: string | null
  check_out_at: string | null
  status: 'PRESENT' | 'ABSENT'
}

interface TodayAttendance {
  present: number
  absent: number
  entries: AttendanceEntry[]
}

export default function StaffAttendancePage(): React.JSX.Element {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const { data: qr, isLoading: qrLoading } = useQuery<QRData>({
    queryKey: ['attendance', 'qr', tenant?.id],
    queryFn: () => apiFetch<QRData>('/attendance/qr', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })

  const { data: today, isLoading: todayLoading } = useQuery<TodayAttendance>({
    queryKey: ['attendance', 'today', tenant?.id],
    queryFn: () => apiFetch<TodayAttendance>('/attendance/today', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
    refetchInterval: 30_000,
  })

  const regenerate = useMutation({
    mutationFn: () => apiFetch('/attendance/qr/regenerate', { method: 'POST', tenantId: tenant?.id }),
    onSuccess: () => {
      showToast('success', 'QR code regenerated')
      queryClient.invalidateQueries({ queryKey: ['attendance', 'qr'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to regenerate QR'),
  })

  const entries = today?.entries ?? []

  return (
    <PageShell title="Attendance" mobileTitle="Attendance" showBack hideNav wide>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box
        sx={{
          px: { xs: 2, md: 3.5 },
          pb: 4,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* ── The QR ──────────────────────────────────────────── */}
        <Stack spacing={1.5}>
          <Card sx={{ p: 3 }}>
            <Stack alignItems="center" spacing={2} textAlign="center">
              <Kicker>Display at the entrance</Kicker>

              {qrLoading ? (
                <Skeleton variant="rounded" width={192} height={192} />
              ) : qr?.qr_token ? (
                <QRDisplay id="attendance-qr" token={qr.qr_token} />
              ) : (
                <Box
                  sx={{
                    width: 192, height: 192, display: 'grid', placeItems: 'center',
                    bgcolor: 'action.hover', borderRadius: 2, color: 'text.disabled',
                  }}
                >
                  <QrIcon sx={{ fontSize: 44 }} />
                </Box>
              )}

              <Typography sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.6 }}>
                Staff scan this to check in. It only works within range of the workshop location.
              </Typography>
            </Stack>
          </Card>

          <Button
            id="attendance-regenerate-qr"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={regenerate.isPending}
            onClick={() => regenerate.mutate()}
          >
            {regenerate.isPending ? 'Regenerating…' : 'Regenerate QR'}
          </Button>
        </Stack>

        {/* ── Who has come in ─────────────────────────────────── */}
        <SectionCard
          title="Today"
          action={
            todayLoading ? undefined : (
              <Stack direction="row" spacing={1}>
                <Chip
                  size="small"
                  label={`${today?.present ?? 0} present`}
                  sx={(t) => ({ bgcolor: alpha(t.palette.success.main, 0.16), color: t.palette.success.main })}
                />
                {(today?.absent ?? 0) > 0 && (
                  <Chip
                    size="small"
                    label={`${today?.absent} absent`}
                    sx={(t) => ({ bgcolor: alpha(t.palette.error.main, 0.14), color: t.palette.error.main })}
                  />
                )}
              </Stack>
            )
          }
        >
          {todayLoading ? (
            <Box sx={{ px: 2.25, py: 1.5 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                <Skeleton key={i} height={48} />
              ))}
            </Box>
          ) : entries.length === 0 ? (
            <EmptyPanel
              icon={<PeopleIcon />}
              title="Nobody has checked in yet"
              description="Scans appear here as staff arrive"
            />
          ) : (
            entries.map((entry, i) => (
              <Box key={entry.member_id}>
                {i > 0 && <Divider />}
                <AttendanceRow entry={entry} />
              </Box>
            ))
          )}
        </SectionCard>
      </Box>
    </PageShell>
  )
}

function AttendanceRow({ entry }: { entry: AttendanceEntry }): React.JSX.Element {
  const isPresent = entry.status === 'PRESENT'

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.25, py: 1.75 }}>
      <Avatar
        src={entry.avatar_url ?? undefined}
        imgProps={{ referrerPolicy: 'no-referrer' }}
        sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }}
      >
        {entry.name.charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>{entry.name}</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
          {entry.check_in_at && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <LoginIcon sx={{ fontSize: 12, color: 'success.main' }} />
              <Typography sx={{ fontSize: 11.5, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(entry.check_in_at)}
              </Typography>
            </Stack>
          )}
          {entry.check_out_at && (
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <LogoutIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(entry.check_out_at)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>

      <Chip
        size="small"
        label={isPresent ? 'Present' : 'Absent'}
        sx={(t) =>
          isPresent
            ? { bgcolor: alpha(t.palette.success.main, 0.16), color: t.palette.success.main }
            : { bgcolor: alpha(t.palette.error.main, 0.14), color: t.palette.error.main }
        }
      />
    </Stack>
  )
}
