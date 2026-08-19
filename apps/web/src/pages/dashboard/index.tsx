// Dashboard — main landing page for garage owners
//
// Rebuilt 2026-08-19 to match planning/design_handoff_autro_ui's actual
// dashboard markup: a stat-card row, "+ Add vehicle" / "View all vehicles"
// buttons, then a "Recent vehicles" list — no hero card, no quick-actions
// grid (those belonged to an earlier, different spec, see git history if
// needed). The handoff's own stat row only shows 3 cards (Active repairs /
// Ready / This month); this app also has a real, backend-computed Unpaid
// Invoices count the handoff never modeled — dropping it would be a
// functional regression, so it stays as a 4th tile in the same flat style
// rather than being invented copy. See DESIGN.md.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Car, Settings, ChevronRight, Plus } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Button, StatCard, StatCardSkeleton, Badge, ListItemSkeleton } from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  vehicles_today: number
  repairing: number
  ready: number
  revenue_today: number
  unpaid_invoices: number
}

type VehicleStatus = 'NEW' | 'REPAIRING' | 'READY' | 'DELIVERED'

interface RecentVehicle {
  id: string
  registration_number: string
  name: string | null
  customer_name: string
  status: VehicleStatus
}

interface VehicleListResponse {
  vehicles: RecentVehicle[]
}

const STATUS_BADGE: Record<VehicleStatus, { variant: 'warning' | 'success' | 'default'; label: string }> = {
  NEW: { variant: 'default', label: 'New' },
  REPAIRING: { variant: 'warning', label: 'Repairing' },
  READY: { variant: 'success', label: 'Ready' },
  DELIVERED: { variant: 'default', label: 'Delivered' },
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () =>
      apiFetch<DashboardStats>('/dashboard/stats', {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(tenant?.id),
    // Refresh every 30 seconds for live feel
    refetchInterval: 30_000,
  })

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery<VehicleListResponse>({
    queryKey: ['vehicles', 'recent', tenant?.id],
    queryFn: () => apiFetch<VehicleListResponse>('/vehicles', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })
  const recentVehicles = (vehiclesData?.vehicles ?? []).slice(0, 3)

  // App Badging API integration
  useEffect(() => {
    if (stats) {
      const pendingCount = stats.repairing + stats.unpaid_invoices
      if ('setAppBadge' in navigator) {
        if (pendingCount > 0) {
          // @ts-ignore - TS might not know setAppBadge yet
          navigator.setAppBadge(pendingCount).catch(console.error)
        } else {
          // @ts-ignore
          navigator.clearAppBadge().catch(console.error)
        }
      }
    }
  }, [stats])

  return (
    <PageShell
      title="Dashboard"
      rightAction={
        <button
          id="dashboard-settings-btn"
          type="button"
          onClick={() => navigate('/settings')}
          className="w-8 h-8 flex items-center justify-center hover:bg-divider transition-colors md:hidden"
          aria-label="Settings"
        >
          <Settings size={18} className="text-text-secondary" />
        </button>
      }
    >
      <div className="p-4 md:p-6 flex flex-col gap-6">
        {/* ── Stats: Active repairs / Ready / Today's revenue / Unpaid ──── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                id="stat-repairing"
                tone="warning"
                value={stats?.repairing ?? 0}
                label="Active repairs"
              />
              <StatCard
                id="stat-ready"
                tone="success"
                value={stats?.ready ?? 0}
                label="Ready"
              />
              <StatCard
                id="stat-revenue"
                tone="primary"
                value={`₹${(stats?.revenue_today ?? 0).toLocaleString('en-IN')}`}
                label="Today's revenue"
              />
              <StatCard
                id="stat-unpaid"
                tone="danger"
                value={stats?.unpaid_invoices ?? 0}
                label="Unpaid invoices"
              />
            </>
          )}
        </div>

        {/* ── Primary actions ─────────────────────────────────── */}
        <div className="flex gap-3 flex-wrap">
          <Button
            id="dashboard-add-vehicle"
            fullWidth={false}
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/vehicles/add')}
          >
            Add vehicle
          </Button>
          <Button
            id="dashboard-view-vehicles"
            variant="outline"
            fullWidth={false}
            onClick={() => navigate('/vehicles')}
          >
            View all vehicles
          </Button>
        </div>

        {/* ── Recent vehicles ─────────────────────────────────── */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-kicker font-bold text-text-secondary uppercase tracking-[0.08em]">
              Recent vehicles
            </span>
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="text-row-sub text-primary font-medium hover:text-primary-hover"
            >
              See all
            </button>
          </div>
          <div className="border-t-2 border-divider" />

          {vehiclesLoading ? (
            <>
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </>
          ) : recentVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Car size={24} className="text-text-muted" />
              <p className="text-row-sub text-text-muted">No vehicles yet — add your first one above</p>
            </div>
          ) : (
            recentVehicles.map((v) => {
              const badge = STATUS_BADGE[v.status]
              return (
                <button
                  key={v.id}
                  id={`recent-vehicle-${v.id}`}
                  type="button"
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                  className="w-full flex items-center gap-3 py-3 border-b border-divider last:border-b-0 text-left cursor-pointer hover:bg-bg/60 transition-colors"
                >
                  <div className="w-14 h-14 flex-shrink-0 border-2 border-divider flex items-center justify-center text-text/30">
                    <Car size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-row-title font-semibold text-text truncate">{v.registration_number}</p>
                    <p className="text-row-sub text-text-secondary/70 truncate mt-0.5">
                      {v.customer_name}{v.name ? ` · ${v.name}` : ''}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0 hidden md:block" />
                </button>
              )
            })
          )}
        </section>
      </div>
    </PageShell>
  )
}
