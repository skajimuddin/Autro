// Estimate List — all estimates with status filtering
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { FileText, ChevronRight } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Badge,
  Button,
  EmptyState,
  Loading,
} from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

type EstimateStatus = 'DRAFT' | 'SENT' | 'CONVERTED'

interface EstimateListItem {
  id: string
  visit_id: string
  registration_number: string
  customer_name: string
  total: number
  status: EstimateStatus
  created_at: string
}

interface EstimateListResponse {
  estimates: EstimateListItem[]
  cursor: string | null
}

const STATUS_BADGE: Record<EstimateStatus, { variant: 'warning' | 'success' | 'default'; label: string }> = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'warning', label: 'Sent' },
  CONVERTED: { variant: 'success', label: 'Converted' },
}

// ── Estimate List Page ────────────────────────────────────────────────────────

export default function EstimateListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()

  const { data, isLoading } = useQuery<EstimateListResponse>({
    queryKey: ['estimates', tenant?.id],
    queryFn: () =>
      apiFetch<EstimateListResponse>('/estimates', {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(tenant?.id),
  })

  const estimates = data?.estimates ?? []

  return (
    <PageShell title="Estimates" showBack wide>
      <div className="p-4 md:p-6 flex flex-col gap-4">
        {isLoading ? (
          <Loading rows={4} />
        ) : estimates.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="No estimates yet"
            description="Create your first estimate from a vehicle's details page"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Mobile / Tablet grid (hidden on lg and up) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
              {estimates.map((est) => (
                <EstimateCard
                  key={est.id}
                  estimate={est}
                  onTap={() => navigate(`/estimates/${est.id}`)}
                />
              ))}
            </div>

            {/* Desktop table (visible on lg and up) */}
            <div className="hidden lg:block bg-card rounded-card shadow-[var(--shadow-card)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/50 border-b border-border">
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Reg No</th>
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Customer</th>
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Amount</th>
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((est) => {
                    const badge = STATUS_BADGE[est.status]
                    return (
                      <tr
                        key={est.id}
                        onClick={() => navigate(`/estimates/${est.id}`)}
                        className="hover:bg-bg/50 cursor-pointer transition-colors border-b border-border last:border-0"
                      >
                        <td className="py-4 px-5 text-row-title font-bold text-text">{est.registration_number}</td>
                        <td className="py-4 px-5 text-row-sub text-text-secondary">{est.customer_name}</td>
                        <td className="py-4 px-5 text-row-title font-bold text-text">₹{est.total.toLocaleString('en-IN')}</td>
                        <td className="py-4 px-5">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {data?.cursor && (
              <div className="flex justify-center pt-2">
                <Button
                  id="estimates-load-more"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}

// ── Estimate Card ─────────────────────────────────────────────────────────────

interface EstimateCardProps {
  estimate: EstimateListItem
  onTap: () => void
}

function EstimateCard({ estimate, onTap }: EstimateCardProps): React.JSX.Element {
  const badge = STATUS_BADGE[estimate.status]

  return (
    <Card id={`estimate-${estimate.id}`} onClick={onTap}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning-light flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-row-title font-bold text-text truncate">
              {estimate.registration_number}
            </p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-row-sub text-text-secondary mt-0.5 truncate">
            {estimate.customer_name}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-row-title font-bold text-text">
            ₹{estimate.total.toLocaleString('en-IN')}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </div>
    </Card>
  )
}
