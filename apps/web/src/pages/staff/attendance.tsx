// Attendance — who has checked in today.
//
// Migrated 2026-08-20 onto the MUI design system. The QR code + regenerate
// control used to live in this page's left column; it moved to Settings →
// QR code — a setup task done once and rarely touched again, not something
// that belongs mixed in with today's log — with a link below pointing there
// for anyone who comes looking for it out of habit.
//
// Every figure comes from GET /attendance/today, which returns present, absent
// and the entries. The endpoint only returns members who have a log row for
// today, so "present + absent" is not the team size and is not presented as
// one — there is no "x of y" here.
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import QrIcon from '@mui/icons-material/QrCode2Rounded'
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'
import LoginIcon from '@mui/icons-material/LoginRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { formatTime } from '@/lib/format'

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
  const navigate = useNavigate()
  const { tenant } = useTenant()

  const { data: today, isLoading: todayLoading } = useQuery<TodayAttendance>({
    queryKey: ['attendance', 'today', tenant?.id],
    queryFn: () => apiFetch<TodayAttendance>('/attendance/today', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
    refetchInterval: 30_000,
  })

  const entries = today?.entries ?? []

  return (
    <PageShell title="Attendance" mobileTitle="Attendance" showBack hideNav>
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

        <Button
          id="attendance-qr-settings-link"
          variant="text"
          startIcon={<QrIcon sx={{ fontSize: 18 }} />}
          onClick={() => void navigate('/settings/qr')}
          sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
        >
          Manage the check-in QR code
        </Button>
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
