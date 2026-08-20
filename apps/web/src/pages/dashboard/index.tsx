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
  Box, Card, Chip, Typography, Stack, Button, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, Avatar, LinearProgress, Skeleton,
  useMediaQuery, useTheme, ButtonBase, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/SettingsOutlined'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { stageChipSx } from '@/theme'

// ── Types ─────────────────────────────────────────────────────────────────────

type VehicleStatus = 'NEW' | 'REPAIRING' | 'READY' | 'DELIVERED'

interface DashboardStats {
  vehicles_today: number
  repairing: number
  ready: number
  revenue_today: number
  unpaid_invoices: number
}

interface VehicleRow {
  id: string
  registration_number: string
  name: string | null
  customer_name: string
  customer_phone: string
  status: VehicleStatus
  created_at: string
  complaint: string | null
  visit_started_at: string | null
}

interface StaffRow {
  id: string
  name: string
  avatar_url: string | null
  role: 'OWNER' | 'STAFF'
  attendance_status: 'PRESENT' | 'ABSENT' | 'NOT_YET'
  check_in_at: string | null
}

const STAGE_LABEL: Record<VehicleStatus, string> = {
  NEW: 'New', REPAIRING: 'Repairing', READY: 'Ready', DELIVERED: 'Delivered',
}

/** A job sitting this long without handover is worth surfacing. */
const STALE_AFTER_DAYS = 5
const WORKSHOP_LIMIT = 6

// ── Helpers ───────────────────────────────────────────────────────────────────

const inr = (n: number): string => `₹${n.toLocaleString('en-IN')}`

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

function daysInShop(iso: string | null): number | null {
  if (!iso) return null
  const started = new Date(iso)
  if (Number.isNaN(started.getTime())) return null
  const midnight = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.max(0, Math.round((midnight(new Date()) - midnight(started)) / 86_400_000))
}

function durationLabel(d: number): string {
  return d === 0 ? 'Today' : d === 1 ? '1 day' : `${d} days`
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
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const { tenant, role } = useTenant()
  const { user } = useAuth()
  const isOwner = role === 'OWNER'

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiFetch<DashboardStats>('/dashboard/stats', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
    refetchInterval: 30_000,
  })

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery<{ vehicles: VehicleRow[] }>({
    queryKey: ['vehicles', 'recent', tenant?.id],
    queryFn: () => apiFetch<{ vehicles: VehicleRow[] }>('/vehicles', { tenantId: tenant?.id }),
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
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled', letterSpacing: '.09em', textTransform: 'uppercase' }}>
          {tenant?.name ? `${today()} · ${tenant.name}` : today()}
        </Typography>
      }
      wide
      rightAction={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vehicles/add')}>
          Add vehicle
        </Button>
      }
      mobileAction={
        <IconButton aria-label="Settings" onClick={() => navigate('/settings')} sx={{ color: 'text.secondary' }}>
          <SettingsIcon sx={{ fontSize: 21 }} />
        </IconButton>
      }
    >
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ── Stat row ───────────────────────────────────────────────── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5 }}>
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

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: isOwner ? '1.85fr 1fr' : '1fr' }, gap: 2.5, alignItems: 'start' }}>
          {/* ── In the workshop ─────────────────────────────────────── */}
          <Card>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.25, py: 1.75 }}>
              <Typography variant="subtitle2">In the workshop</Typography>
              <Button size="small" onClick={() => navigate('/vehicles')} sx={{ minWidth: 0, height: 28, px: 1, fontSize: 12 }}>
                View all
              </Button>
            </Stack>
            <Divider />

            {vehiclesLoading ? (
              <Box sx={{ px: 2.25, py: 1 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                  <Skeleton key={i} height={44} />
                ))}
              </Box>
            ) : vehicles.length === 0 ? (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 6, px: 3, textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'action.hover', color: 'text.disabled', width: 48, height: 48 }}>
                  <CarIcon />
                </Avatar>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>No vehicles yet</Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>
                  Add your first vehicle to start tracking repairs
                </Typography>
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/vehicles/add')} sx={{ mt: 1 }}>
                  Add vehicle
                </Button>
              </Stack>
            ) : desktop ? (
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <colgroup>
                  {/* Stage needs room for a "Repairing" chip and In shop for
                      "6 days" — at 14%/11% both truncated mid-word. */}
                  <col width="24%" /><col width="21%" /><col width="27%" /><col width="16%" /><col width="12%" />
                </colgroup>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['Vehicle', 'Customer', 'Job', 'Stage', 'In shop'].map((h) => (
                      <TableCell key={h} sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'text.disabled', py: 1.25, whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((v) => {
                    const d = daysInShop(v.visit_started_at)
                    const stale = d !== null && d >= STALE_AFTER_DAYS && v.status !== 'DELIVERED'
                    return (
                      <TableRow
                        key={v.id}
                        hover
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                      >
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>{v.registration_number}</Typography>
                          {v.name && <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>{v.name}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography noWrap sx={{ fontSize: 13 }}>{v.customer_name}</Typography>
                          <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>{v.customer_phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography noWrap title={v.complaint ?? undefined} sx={{ fontSize: 12.5, color: v.complaint ? 'text.secondary' : 'text.disabled' }}>
                            {v.complaint ?? 'Not inspected'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={STAGE_LABEL[v.status]} sx={stageChipSx(v.status)} />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12.5, whiteSpace: 'nowrap', fontWeight: stale ? 700 : 400, color: stale ? 'warning.main' : 'text.secondary' }}>
                            {v.status === 'DELIVERED' || d === null ? '—' : durationLabel(d)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <Box>
                {vehicles.map((v, i) => {
                  const d = daysInShop(v.visit_started_at)
                  const stale = d !== null && d >= STALE_AFTER_DAYS && v.status !== 'DELIVERED'
                  return (
                    <Box key={v.id}>
                      {i > 0 && <Divider />}
                      <ButtonBase
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2.25, py: 1.75, textAlign: 'left' }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>{v.registration_number}</Typography>
                          <Typography noWrap sx={{ fontSize: 12, color: 'text.disabled' }}>
                            {[v.customer_name, v.name].filter(Boolean).join(' · ')}
                          </Typography>
                          <Typography noWrap sx={{ fontSize: 12, color: v.complaint ? 'text.secondary' : 'text.disabled', mt: 0.5 }}>
                            {v.complaint ?? 'Not inspected'}
                          </Typography>
                        </Box>
                        <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
                          <Chip size="small" label={STAGE_LABEL[v.status]} sx={stageChipSx(v.status)} />
                          <Typography sx={{ fontSize: 12, fontWeight: stale ? 700 : 400, color: stale ? 'warning.main' : 'text.disabled' }}>
                            {v.status === 'DELIVERED' || d === null ? '—' : durationLabel(d)}
                          </Typography>
                        </Stack>
                      </ButtonBase>
                    </Box>
                  )
                })}
              </Box>
            )}
          </Card>

          {/* ── Attendance (owner only) ─────────────────────────────── */}
          {isOwner && (
            <Card>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.25, py: 1.75 }}>
                <Typography variant="subtitle2">Attendance today</Typography>
                {!staffLoading && staff.length > 0 && (
                  <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                    {presentCount} / {staff.length} in
                  </Typography>
                )}
              </Stack>
              {!staffLoading && staff.length > 0 && (
                <Box sx={{ px: 2.25, pb: 1.75 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(presentCount / staff.length) * 100}
                    sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }}
                  />
                </Box>
              )}
              <Divider />

              {staffLoading ? (
                <Box sx={{ px: 2.25, py: 1.5 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                    <Skeleton key={i} height={40} />
                  ))}
                </Box>
              ) : staff.length === 0 ? (
                <Stack alignItems="center" spacing={1} sx={{ py: 4, px: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>No team members yet</Typography>
                  <Button size="small" onClick={() => navigate('/staff/add')}>Invite staff</Button>
                </Stack>
              ) : (
                staff.map((s, i) => (
                  <Box key={s.id}>
                    {i > 0 && <Divider />}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.25, py: 1.75 }}>
                      <Avatar
                        src={s.avatar_url ?? undefined}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        sx={{ width: 34, height: 34, fontSize: 13.5, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: 'text.disabled', textTransform: 'capitalize' }}>
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
            </Card>
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
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase', color: 'text.disabled' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 30, fontWeight: 700, mt: 1, lineHeight: 1, letterSpacing: '-.025em', fontVariantNumeric: 'tabular-nums', color: hero ? 'primary.main' : 'text.primary' }}>
        {value}
      </Typography>
    </Card>
  )
}
