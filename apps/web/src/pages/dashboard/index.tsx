// Dashboard — the garage owner's landing screen.
//
// Rebuilt 2026-08-20 for the rounded design system (see DESIGN.md):
//   - a compact stat strip instead of a four-tile grid, so the vehicle list
//     starts above the fold
//   - recent vehicles as a table at md:+ and rounded cards on mobile, both
//     from <VehicleListView>
//
// What is deliberately NOT here, because no endpoint backs it: a revenue
// trend/delta (GET /dashboard/stats returns today's total only, with nothing
// to compare against), a total vehicle count (GET /vehicles is cursor
// paginated and returns no total), and status filter tabs (the dashboard
// fetches one unfiltered page — filtering it client-side would silently
// filter only the loaded page). Filtering lives on /vehicles, which filters
// server-side.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Car, Settings, ChevronRight, Plus } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Button, StatPill, StatPillSkeleton, ListItemSkeleton, EmptyState } from '@/components/ui'
import { VehicleListView } from '@/components/domain/vehicle-list-view'
import type { VehicleListItem } from '@/components/domain/vehicle-list-view'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  vehicles_today: number
  repairing: number
  ready: number
  revenue_today: number
  unpaid_invoices: number
}

interface VehicleListResponse {
  vehicles: VehicleListItem[]
  cursor: string | null
}

const RECENT_LIMIT = 6

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { user } = useAuth()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiFetch<DashboardStats>('/dashboard/stats', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
    // Refresh every 30 seconds for live feel
    refetchInterval: 30_000,
  })

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery<VehicleListResponse>({
    queryKey: ['vehicles', 'recent', tenant?.id],
    queryFn: () => apiFetch<VehicleListResponse>('/vehicles', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })
  const recentVehicles = (vehiclesData?.vehicles ?? []).slice(0, RECENT_LIMIT)

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

  const firstName = user?.name?.trim().split(/\s+/)[0]

  return (
    <PageShell
      title={firstName ? `${greeting()}, ${firstName}` : greeting()}
      subtitle={formatToday()}
      wide
      rightAction={
        <button
          id="dashboard-settings-btn"
          type="button"
          onClick={() => navigate('/settings')}
          className="w-9 h-9 flex items-center justify-center rounded-tile bg-card border border-divider shadow-[var(--shadow-card)] md:hidden"
          aria-label="Settings"
        >
          <Settings size={17} className="text-text-secondary" />
        </button>
      }
    >
      <div className="px-4 md:px-7 pb-4 flex flex-col gap-5">
        {/* ── Stat strip ──────────────────────────────────────────────── */}
        {/* 2x2 on a phone: flex-wrap left a ragged 1/2/1 stagger because the
            revenue pill is much wider than the counts. */}
        <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-wrap">
          {isLoading ? (
            <>
              <StatPillSkeleton />
              <StatPillSkeleton />
              <StatPillSkeleton />
              <StatPillSkeleton />
            </>
          ) : (
            <>
              <StatPill
                id="stat-revenue"
                featured
                value={`₹${(stats?.revenue_today ?? 0).toLocaleString('en-IN')}`}
                label="today's revenue"
              />
              <StatPill
                id="stat-repairing"
                tone="warning"
                value={stats?.repairing ?? 0}
                label="in the bay"
              />
              <StatPill
                id="stat-ready"
                tone="success"
                value={stats?.ready ?? 0}
                label="ready for pickup"
              />
              <StatPill
                id="stat-unpaid"
                tone="danger"
                value={stats?.unpaid_invoices ?? 0}
                label="unpaid invoices"
              />
            </>
          )}
        </div>

        {/* ── Primary actions ─────────────────────────────────────────── */}
        <div className="flex gap-2.5 flex-wrap">
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
            leftIcon={<Car size={16} />}
            onClick={() => navigate('/vehicles')}
          >
            All vehicles
          </Button>
        </div>

        {/* ── Recent vehicles ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-row-title font-bold text-text">Recent vehicles</h2>
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="inline-flex items-center gap-0.5 text-row-sub text-primary font-semibold hover:text-primary-hover"
            >
              See all
              <ChevronRight size={14} />
            </button>
          </div>

          {vehiclesLoading ? (
            <div className="flex flex-col gap-2">
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </div>
          ) : recentVehicles.length === 0 ? (
            <div className="rounded-card border border-divider bg-card shadow-[var(--shadow-card)]">
              <EmptyState
                icon={<Car size={24} />}
                title="No vehicles yet"
                description="Add your first vehicle to start tracking repairs"
                action={
                  <Button
                    size="sm"
                    fullWidth={false}
                    leftIcon={<Plus size={16} />}
                    onClick={() => navigate('/vehicles/add')}
                  >
                    Add vehicle
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="md:rounded-card md:border md:border-divider md:bg-card md:shadow-[var(--shadow-card)] md:overflow-hidden">
              <VehicleListView
                vehicles={recentVehicles}
                onSelect={(id) => navigate(`/vehicles/${id}`)}
              />
            </div>
          )}
        </section>
      </div>
    </PageShell>
  )
}
