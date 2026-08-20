// Dashboard — the garage owner's landing screen.
//
// Rebuilt 2026-08-20 on MUI, matching the approved design (see theme.ts).
//
// Every figure on this page is backed by a real endpoint:
//   stat row      → GET /dashboard/stats
//   workshop list → GET /vehicles (plate, model, customer, complaint, stage,
//                   visit_started_at)
//   attendance    → GET /staff, which returns every member with
//                   attendance_status ('PRESENT' | 'ABSENT' | 'NOT_YET') and
//                   check_in_at — so both the roster and the "x / y in" count
//                   are real, not derived from a guess.
//
// Deliberately absent: a per-vehicle money column. Estimate and invoice totals
// are computed per record in GET /vehicles/:id (item sum + discount + tax) and
// are not on the list endpoint, so that column could only be faked.
//
// The attendance panel is OWNER-only: /staff is behind RequireOwner.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Card,
  Typography,
  Stack,
  Button,
  Divider,
  Avatar,
  LinearProgress,
  Skeleton,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/SettingsOutlined'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'

import { apiFetch } from '@/lib/api'
import { inr } from '@/lib/format'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Kicker } from '@/components/ui/kicker'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { VehicleList } from '@/components/domain/vehicle-list'
import type { VehicleListItem } from '@/components/domain/vehicle-list'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  vehicles_today: number
  repairing: number
  ready: number
  revenue_today: number
  unpaid_invoices: number
}

interface StaffRow {
  id: string
  name: string
  avatar_url: string | null
  role: 'OWNER' | 'STAFF'
  attendance_status: 'PRESENT' | 'ABSENT' | 'NOT_YET'
  check_in_at: string | null
}

/** Enough rows to see the shape of the day without becoming the list page. */
const WORKSHOP_LIMIT = 6

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function today(): string {
  const d = new Date()
  // en-IN renders "Thursday 20 August"; the approved header reads
  // "Thursday, 20 August", so the weekday is joined explicitly.
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' })
  const rest = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
  return `${weekday}, ${rest}`
}

function checkInLabel(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant, role } = useTenant()
  const { user } = useAuth()
  const isOwner = role === 'OWNER'

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiFetch<DashboardStats>('/dashboard/stats', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
    refetchInterval: 30_000,
  })

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery<{
    vehicles: VehicleListItem[]
  }>({
    queryKey: ['vehicles', 'recent', tenant?.id],
    queryFn: () => apiFetch<{ vehicles: VehicleListItem[] }>('/vehicles', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })
  const vehicles = (vehiclesData?.vehicles ?? []).slice(0, WORKSHOP_LIMIT)

  const { data: staffData, isLoading: staffLoading } = useQuery<{ staff: StaffRow[] }>({
    queryKey: ['staff', 'today', tenant?.id],
    queryFn: () => apiFetch<{ staff: StaffRow[] }>('/staff', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id) && isOwner,
  })
  const staff = staffData?.staff ?? []
  const presentCount = staff.filter((s) => s.attendance_status === 'PRESENT').length

  // App Badging API
  useEffect(() => {
    if (!stats) return
    const pending = stats.repairing + stats.unpaid_invoices
    if ('setAppBadge' in navigator) {
      const nav = navigator as Navigator & {
        setAppBadge?: (n: number) => Promise<void>
        clearAppBadge?: () => Promise<void>
      }
      const run = pending > 0 ? nav.setAppBadge?.(pending) : nav.clearAppBadge?.()
      run?.catch(console.error)
    }
  }, [stats])

  const firstName = user?.name?.trim().split(/\s+/)[0]

  return (
    <PageShell
      title={firstName ? `${greeting()}, ${firstName}` : greeting()}
      // The app bar wants the page's name, not a greeting — the greeting is a
      // desktop-header flourish and would crowd a 390px bar.
      mobileTitle="Dashboard"
      subtitle={
        <Typography
          sx={{
            fontSize: 11.5,
            color: 'text.disabled',
            letterSpacing: '.09em',
            textTransform: 'uppercase',
          }}
        >
          {tenant?.name ? `${today()} · ${tenant.name}` : today()}
        </Typography>
      }
      wide
      rightAction={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/vehicles/add')}
        >
          Add vehicle
        </Button>
      }
      mobileAction={
        <IconButton
          aria-label="Settings"
          onClick={() => navigate('/settings')}
          sx={{ color: 'text.secondary' }}
        >
          <SettingsIcon sx={{ fontSize: 21 }} />
        </IconButton>
      }
    >
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ── Stat row ───────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' },
            gap: 1.5,
          }}
        >
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
              <Card key={i} sx={{ p: 2.25 }}>
                <Skeleton width={90} height={12} />
                <Skeleton width={110} height={34} sx={{ mt: 1 }} />
              </Card>
            ))
          ) : (
            <>
              <Stat
                id="stat-revenue"
                label="Revenue today"
                value={inr(stats?.revenue_today ?? 0)}
                hero
              />
              <Stat id="stat-repairing" label="In the bay" value={stats?.repairing ?? 0} />
              <Stat id="stat-ready" label="Ready" value={stats?.ready ?? 0} />
              <Stat id="stat-unpaid" label="Unpaid" value={stats?.unpaid_invoices ?? 0} />
            </>
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: isOwner ? '1.85fr 1fr' : '1fr' },
            gap: 2.5,
            alignItems: 'start',
          }}
        >
          {/* ── In the workshop ─────────────────────────────────────── */}
          {/* Same component the /vehicles page renders — see vehicle-list.tsx. */}
          <SectionCard
            title="In the workshop"
            action={
              <Button
                size="small"
                onClick={() => navigate('/vehicles')}
                sx={{ minWidth: 0, height: 28, px: 1, fontSize: 12 }}
              >
                View all
              </Button>
            }
          >
            {vehiclesLoading ? (
              <Box sx={{ px: 2.25, py: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                  <Skeleton key={i} height={44} />
                ))}
              </Box>
            ) : vehicles.length === 0 ? (
              <EmptyPanel
                icon={<CarIcon />}
                title="No vehicles yet"
                description="Add your first vehicle to start tracking repairs"
                action={{
                  label: 'Add vehicle',
                  icon: <AddIcon />,
                  onClick: () => navigate('/vehicles/add'),
                }}
              />
            ) : (
              <VehicleList vehicles={vehicles} onSelect={(id) => navigate(`/vehicles/${id}`)} />
            )}
          </SectionCard>

          {/* ── Attendance (owner only) ─────────────────────────────── */}
          {isOwner && (
            <SectionCard
              title="Attendance today"
              action={
                !staffLoading && staff.length > 0 ? (
                  <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                    {presentCount} / {staff.length} in
                  </Typography>
                ) : undefined
              }
              headerExtra={
                !staffLoading && staff.length > 0 ? (
                  <Box sx={{ px: 2.25, pb: 1.75 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(presentCount / staff.length) * 100}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { bgcolor: 'success.main' },
                      }}
                    />
                  </Box>
                ) : undefined
              }
            >
              {staffLoading ? (
                <Box sx={{ px: 2.25, py: 1.5 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                    <Skeleton key={i} height={40} />
                  ))}
                </Box>
              ) : staff.length === 0 ? (
                <EmptyPanel
                  dense
                  icon={<PeopleIcon />}
                  title="No team members yet"
                  description="Invite your mechanics so their attendance shows up here"
                  action={{ label: 'Invite staff', onClick: () => navigate('/staff/add') }}
                />
              ) : (
                staff.map((s, i) => (
                  <Box key={s.id}>
                    {i > 0 && <Divider />}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{ px: 2.25, py: 1.75 }}
                    >
                      <Avatar
                        src={s.avatar_url ?? undefined}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: 13.5,
                          fontWeight: 600,
                          bgcolor: 'action.hover',
                          color: 'text.secondary',
                        }}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
                          {s.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            color: 'text.disabled',
                            textTransform: 'capitalize',
                          }}
                        >
                          {s.role.toLowerCase()}
                        </Typography>
                      </Box>
                      {s.attendance_status === 'PRESENT' ? (
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'success.main' }}>
                          {checkInLabel(s.check_in_at)}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>
                          {s.attendance_status === 'ABSENT' ? 'Absent' : 'Not in'}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                ))
              )}
            </SectionCard>
          )}
        </Box>
      </Box>
    </PageShell>
  )
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

interface StatProps {
  id: string
  label: string
  value: string | number
  hero?: boolean
}

function Stat({ id, label, value, hero = false }: StatProps): React.JSX.Element {
  return (
    <Card id={id} sx={{ p: 2.25 }}>
      <Kicker>{label}</Kicker>
      <Typography
        sx={{
          fontSize: 30,
          fontWeight: 700,
          mt: 1,
          lineHeight: 1,
          letterSpacing: '-.025em',
          fontVariantNumeric: 'tabular-nums',
          color: hero ? 'primary.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Card>
  )
}
