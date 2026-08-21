// Staff — the garage's people, with today's attendance beside each name.
//
// Migrated 2026-08-21 onto the MUI design system, matching /vehicles: one
// hairline card, a five-column table at md:+ and stacked rows below, EmptyPanel
// for the empty and error states.
//
// Every column comes from a field GET /staff actually returns — name, email,
// avatar_url, role, monthly_salary, attendance_status and check_in_at, the
// last two resolved server-side against today's attendance log. There is no
// "Load more": that endpoint returns the whole roster in one response, so the
// search below filters what is already here rather than asking again.
//
// The header action differs by width on purpose. The md:+ sidebar already
// links Attendance, so the page header only adds "Add staff"; the mobile tab
// bar carries neither, so the app bar gets both as icon buttons.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import QrCodeIcon from '@mui/icons-material/QrCode2Rounded'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { inr, formatTime } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'NOT_YET'

interface StaffMember {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'OWNER' | 'STAFF'
  monthly_salary: number | null
  attendance_status: AttendanceStatus
  check_in_at: string | null
}

const COLUMNS = ['Name', 'Role', 'Salary', 'Today', 'In at'] as const

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  // The dashboard's roster says "Not in" for the same state; one wording.
  NOT_YET: 'Not in',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  // noSsr: client-rendered SPA, so the query can be answered on first render.
  // Without it every load paints the mobile layout for a frame.
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  const { tenant } = useTenant()

  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch } = useQuery<{ staff: StaffMember[] }>({
    queryKey: ['staff', tenant?.id],
    queryFn: () => apiFetch<{ staff: StaffMember[] }>('/staff', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })

  // The roster arrives whole, so this filters in place — no debounce, because
  // there is no request to spare.
  const query = search.trim().toLowerCase()
  const staff = (data?.staff ?? []).filter(
    (s) => !query || s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query),
  )

  const open = (id: string): void => {
    void navigate(`/staff/${id}`)
  }

  const toolbar = (
    <Box sx={{ px: { xs: 0, md: 2 }, py: { xs: 0, md: 1.5 } }}>
      <TextField
        id="staff-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name or email"
        inputProps={{ 'aria-label': 'Search staff by name or email' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 1.5, mr: -0.5 }}>
              <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ width: { xs: '100%', md: 260 } }}
      />
    </Box>
  )

  return (
    <PageShell
      title="Staff"
      wide
      rightAction={
        <Button
          id="staff-add-btn"
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/staff/add')}
        >
          Add staff
        </Button>
      }
      mobileAction={
        <Stack direction="row" spacing={0.5}>
          <IconButton
            id="staff-qr-btn"
            aria-label="QR attendance"
            onClick={() => navigate('/staff/attendance')}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, color: 'text.primary' }}
          >
            <QrCodeIcon sx={{ fontSize: 19 }} />
          </IconButton>
          <IconButton
            id="staff-add-btn-mobile"
            aria-label="Add staff"
            onClick={() => navigate('/staff/add')}
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1.5 }}
          >
            <PersonAddIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Stack>
      }
    >
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* On a phone the search sits on the page ground — inside the card it
            would push the first name below the fold. */}
        {!desktop && toolbar}

        <Card sx={{ overflow: 'hidden' }}>
          {desktop && (
            <>
              {toolbar}
              <Divider />
            </>
          )}

          {isLoading ? (
            <Box sx={{ px: 2.25, py: 1 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={44} />
              ))}
            </Box>
          ) : isError ? (
            <EmptyPanel
              icon={<ErrorIcon />}
              title="Could not load staff"
              description="Check your connection and try again"
              action={{ label: 'Retry', onClick: () => void refetch() }}
            />
          ) : staff.length === 0 ? (
            <EmptyPanel
              icon={<PeopleIcon />}
              title={query ? 'Nobody matches that' : 'No staff yet'}
              description={
                query
                  ? 'Try a different name or email'
                  : 'Invite your mechanics so their attendance shows up here'
              }
              action={
                query
                  ? undefined
                  : {
                      label: 'Add staff',
                      icon: <PersonAddIcon />,
                      onClick: () => navigate('/staff/add'),
                    }
              }
            />
          ) : desktop ? (
            <DesktopTable staff={staff} onSelect={open} />
          ) : (
            <MobileRows staff={staff} onSelect={open} />
          )}
        </Card>
      </Box>
    </PageShell>
  )
}

// ── Attendance chip ───────────────────────────────────────────────────────────

/**
 * Only Present carries a hue — it is the answer the owner opened this screen
 * for. Absent is settled information, so it takes the hollow outline a
 * DELIVERED vehicle carries, and "Not in" is a neutral tint: at 9am that is
 * every row, and painting the whole roster red would say nothing.
 */
function AttendanceChip({ status }: { status: AttendanceStatus }): React.JSX.Element {
  return (
    <Chip
      size="small"
      label={ATTENDANCE_LABEL[status]}
      sx={(t) =>
        ({
          PRESENT: {
            bgcolor: alpha(t.palette.success.main, 0.16),
            color: t.palette.success.main,
          },
          ABSENT: {
            bgcolor: 'transparent',
            color: t.palette.text.disabled,
            border: `1px solid ${t.palette.divider}`,
          },
          NOT_YET: {
            bgcolor: alpha(t.palette.text.primary, 0.06),
            color: t.palette.text.secondary,
          },
        })[status]
      }
    />
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

/** Google profile picture when there is one, initial when there is not. */
function StaffAvatar({ member, size }: { member: StaffMember; size: number }): React.JSX.Element {
  return (
    <Avatar
      src={member.avatar_url ?? undefined}
      imgProps={{ referrerPolicy: 'no-referrer' }}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        bgcolor: 'action.hover',
        color: 'text.secondary',
      }}
    >
      {member.name.charAt(0).toUpperCase()}
    </Avatar>
  )
}

// ── Desktop ───────────────────────────────────────────────────────────────────

interface RowsProps {
  staff: StaffMember[]
  onSelect: (id: string) => void
}

function DesktopTable({ staff, onSelect }: RowsProps): React.JSX.Element {
  return (
    <Table size="small" sx={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col width="34%" />
        <col width="14%" />
        <col width="18%" />
        <col width="18%" />
        <col width="16%" />
      </colgroup>

      <TableHead>
        <TableRow sx={{ bgcolor: 'action.hover' }}>
          {COLUMNS.map((heading) => (
            <TableCell
              key={heading}
              align={heading === 'Salary' ? 'right' : 'left'}
              sx={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'text.disabled',
                py: 1.25,
                whiteSpace: 'nowrap',
              }}
            >
              {heading}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {staff.map((member) => (
          <TableRow
            key={member.id}
            id={`staff-${member.id}`}
            hover
            tabIndex={0}
            aria-label={`${member.name}, ${member.role.toLowerCase()}`}
            onClick={() => onSelect(member.id)}
            onKeyDown={(e) => {
              // A clickable row is unreachable by keyboard without this.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(member.id)
              }
            }}
            sx={{
              cursor: 'pointer',
              '&:last-child td': { border: 0 },
              '&:focus-visible': {
                outline: (t) => `2px solid ${t.palette.primary.main}`,
                outlineOffset: -2,
              },
            }}
          >
            <TableCell sx={{ py: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <StaffAvatar member={member} size={32} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
                    {member.name}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                    {member.email}
                  </Typography>
                </Box>
              </Stack>
            </TableCell>

            <TableCell>
              <Typography noWrap sx={{ fontSize: 13, textTransform: 'capitalize' }}>
                {member.role.toLowerCase()}
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography
                noWrap
                sx={{
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                  color: member.monthly_salary === null ? 'text.disabled' : 'text.primary',
                }}
              >
                {member.monthly_salary === null ? '—' : inr(member.monthly_salary)}
              </Typography>
            </TableCell>

            <TableCell>
              <AttendanceChip status={member.attendance_status} />
            </TableCell>

            <TableCell>
              <Typography
                noWrap
                sx={{
                  fontSize: 12.5,
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(member.check_in_at)}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileRows({ staff, onSelect }: RowsProps): React.JSX.Element {
  return (
    <Box>
      {staff.map((member, i) => (
        <Box key={member.id}>
          {i > 0 && <Divider />}
          <ButtonBase
            id={`staff-${member.id}`}
            onClick={() => onSelect(member.id)}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2.25,
              py: 1.75,
              textAlign: 'left',
            }}
          >
            <StaffAvatar member={member} size={38} />

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                {member.name}
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: 12,
                  color: 'text.disabled',
                  textTransform: 'capitalize',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {member.monthly_salary === null
                  ? member.role.toLowerCase()
                  : `${member.role.toLowerCase()} · ${inr(member.monthly_salary)}`}
              </Typography>
            </Box>

            <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
              <AttendanceChip status={member.attendance_status} />
              {member.attendance_status === 'PRESENT' && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: 'text.disabled',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatTime(member.check_in_at)}
                </Typography>
              )}
            </Stack>
          </ButtonBase>
        </Box>
      ))}
    </Box>
  )
}
