// Dashboard — main landing page for garage owners
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Car,
  Wrench,
  CheckCircle2,
  IndianRupee,
  AlertCircle,
  Plus,
  FileText,
  Receipt,
  Users,
  Settings,
  ChevronRight,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Card, StatCard, StatCardSkeleton } from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  vehicles_today: number
  repairing: number
  ready: number
  revenue_today: number
  unpaid_invoices: number
}

// ── Quick Action Config ───────────────────────────────────────────────────────

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  to: string
  color: string
  iconBg: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'qa-new-vehicle',
    label: 'New Vehicle',
    icon: Plus,
    to: '/vehicles/add',
    color: 'text-primary',
    iconBg: 'bg-primary-light',
  },
  {
    id: 'qa-new-estimate',
    label: 'New Estimate',
    icon: FileText,
    to: '/estimates',
    color: 'text-warning',
    iconBg: 'bg-warning-light',
  },
  {
    id: 'qa-generate-invoice',
    label: 'Generate Invoice',
    icon: Receipt,
    to: '/invoices',
    color: 'text-success',
    iconBg: 'bg-success-light',
  },
  {
    id: 'qa-staff',
    label: 'Staff',
    icon: Users,
    to: '/staff',
    color: 'text-primary',
    iconBg: 'bg-primary-light',
  },
]

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()
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

  // Derive greeting based on time of day
  const greeting = getGreeting()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <PageShell
      title="Workshop"
      rightAction={
        <button
          id="dashboard-settings-btn"
          type="button"
          onClick={() => navigate('/settings')}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} className="text-text-secondary" />
        </button>
      }
    >
      <div className="p-4 flex flex-col gap-5">
        {/* ── Greeting ──────────────────────────────────────────── */}
        <div id="dashboard-greeting">
          <p className="text-text-secondary text-sm font-medium">{greeting}</p>
          <h2 className="text-xl font-bold text-text mt-0.5">{firstName}</h2>
          {tenant && (
            <p className="text-xs text-text-muted mt-1 truncate">
              {tenant.name}
            </p>
          )}
        </div>

        {/* ── Hero Stat Card ──────────────────────────────────── */}
        {isLoading ? (
          <HeroSkeleton />
        ) : (
          <Card id="dashboard-hero-card" className="!p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <Car size={28} className="text-primary" />
              </div>
              <div>
                <p className="text-[2rem] font-bold text-text leading-none">
                  {stats?.vehicles_today ?? 0}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Vehicles Today
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Stats Grid (2x2) ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
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
                icon={<Wrench size={18} className="text-warning" />}
                iconBg="bg-warning-light"
                value={stats?.repairing ?? 0}
                label="Repairing"
              />
              <StatCard
                id="stat-ready"
                icon={<CheckCircle2 size={18} className="text-success" />}
                iconBg="bg-success-light"
                value={stats?.ready ?? 0}
                label="Ready"
              />
              <StatCard
                id="stat-revenue"
                icon={<IndianRupee size={18} className="text-primary" />}
                iconBg="bg-primary-light"
                value={`₹${(stats?.revenue_today ?? 0).toLocaleString('en-IN')}`}
                label="Today's Revenue"
              />
              <StatCard
                id="stat-unpaid"
                icon={<AlertCircle size={18} className="text-danger" />}
                iconBg="bg-danger-light"
                value={stats?.unpaid_invoices ?? 0}
                label="Unpaid Invoices"
              />
            </>
          )}
        </div>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </div>
        </section>

        {/* ── Recent Activity Teaser ──────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Recent Vehicles
            </h3>
            <button
              id="dashboard-view-all-vehicles"
              type="button"
              onClick={() => navigate('/vehicles')}
              className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              View All
              <ChevronRight size={14} />
            </button>
          </div>
          <Card className="!p-0 overflow-hidden">
            <RecentVehiclesPlaceholder />
          </Card>
        </section>
      </div>
    </PageShell>
  )
}

// ── Quick Action Card ─────────────────────────────────────────────────────────

function QuickActionCard({ action }: { action: QuickAction }): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <button
      id={action.id}
      type="button"
      onClick={() => navigate(action.to)}
      className="bg-card rounded-card p-4 flex flex-col items-start gap-3 shadow-[var(--shadow-card)] text-left active:scale-[0.98] transition-transform hover:shadow-md cursor-pointer border-0"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.iconBg}`}
      >
        <action.icon size={20} className={action.color} />
      </div>
      <span className="text-sm font-semibold text-text">{action.label}</span>
    </button>
  )
}

// ── Hero Skeleton ─────────────────────────────────────────────────────────────

function HeroSkeleton(): React.JSX.Element {
  return (
    <Card className="!p-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-divider animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-8 w-16 rounded bg-divider animate-pulse" />
          <div className="h-4 w-28 rounded bg-divider animate-pulse" />
        </div>
      </div>
    </Card>
  )
}

// ── Recent Vehicles Placeholder ───────────────────────────────────────────────
// Shown until vehicle API is connected — displays a tasteful empty state

function RecentVehiclesPlaceholder(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center mb-3">
        <Car size={22} className="text-text-muted" />
      </div>
      <p className="text-sm font-medium text-text-secondary">
        No vehicles yet
      </p>
      <p className="text-xs text-text-muted mt-1">
        Add your first vehicle to get started
      </p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning,'
  if (hour < 17) return 'Good afternoon,'
  return 'Good evening,'
}
