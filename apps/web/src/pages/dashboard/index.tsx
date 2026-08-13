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
} from '@/components/ui/icons'

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
// No per-item colors: these are actions, not statuses. Color is reserved for real
// state — see the stats grid below, where amber/green/blue/red are prescribed by
// 05-ui-screens.md Screen 3. Every action icon is primary.

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  to: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-new-vehicle', label: 'New Vehicle', icon: Plus, to: '/vehicles/add' },
  { id: 'qa-new-estimate', label: 'New Estimate', icon: FileText, to: '/estimates' },
  { id: 'qa-generate-invoice', label: 'Generate Invoice', icon: Receipt, to: '/invoices' },
  { id: 'qa-staff', label: 'Staff', icon: Users, to: '/staff' },
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
          <Settings size={20} strokeWidth={2.5} className="text-text-secondary" />
        </button>
      }
    >
      <div className="p-4 md:p-6 flex flex-col gap-5">
        {/* ── Greeting ──────────────────────────────────────────── */}
        {/* Demo .greeting is 1.5rem/700 — was text-xl (1.25rem) */}
        <div id="dashboard-greeting">
          <p className="text-row-sub text-text-secondary font-medium">{greeting}</p>
          <h2 className="text-value font-bold text-text mt-0.5">{firstName}</h2>
          {tenant && (
            <p className="text-row-sub text-text-muted mt-1 truncate">
              {tenant.name}
            </p>
          )}
        </div>

        {/* ── Hero Stat Card ──────────────────────────────────── */}
        {isLoading ? (
          <HeroSkeleton />
        ) : (
          <Card id="dashboard-hero-card">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <Car size={28} strokeWidth={2.5} className="text-primary" />
              </div>
              <div>
                {/* Demo .stat-value 2rem/700 primary, .stat-label 1.1rem/600 */}
                <p className="text-value-xl font-bold text-primary leading-none tabular-nums">
                  {stats?.vehicles_today ?? 0}
                </p>
                <p className="text-row-title font-semibold text-text mt-1">
                  Vehicles Today
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Stats Grid: 2x2 on mobile, single row of 4 at md:+ ──── */}
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
                icon={<Wrench size={18} strokeWidth={2.5} className="text-warning" />}
                tone="warning"
                value={stats?.repairing ?? 0}
                label="Repairing"
              />
              <StatCard
                id="stat-ready"
                icon={<CheckCircle2 size={18} strokeWidth={2.5} className="text-success" />}
                tone="success"
                value={stats?.ready ?? 0}
                label="Ready"
              />
              <StatCard
                id="stat-revenue"
                icon={<IndianRupee size={18} strokeWidth={2.5} className="text-primary" />}
                tone="primary"
                value={`₹${(stats?.revenue_today ?? 0).toLocaleString('en-IN')}`}
                label="Today's Revenue"
              />
              <StatCard
                id="stat-unpaid"
                icon={<AlertCircle size={18} strokeWidth={2.5} className="text-danger" />}
                tone="danger"
                value={stats?.unpaid_invoices ?? 0}
                label="Unpaid Invoices"
              />
            </>
          )}
        </div>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <section>
          <h3 className="text-label font-bold text-text-secondary uppercase tracking-[1px] mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </div>
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
      className="bg-card rounded-card p-5 flex flex-col items-start gap-3 shadow-[var(--shadow-card)] text-left active:scale-[0.98] transition-transform hover:shadow-md cursor-pointer border-0"
    >
      {/* Demo .btn-white: icon at 1.4rem in primary, label 1.1rem/600 */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-light"
      >
        <action.icon size={22} strokeWidth={2.5} className="text-primary" />
      </div>
      <span className="text-row-title font-semibold text-text">{action.label}</span>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning,'
  if (hour < 17) return 'Good afternoon,'
  return 'Good evening,'
}
