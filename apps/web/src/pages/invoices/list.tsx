// Invoice List — filterable list of all invoices
//
// Rebuilt 2026-08-19: segmented filter (matching the handoff's `.seg`, not
// pill chips) and one flat thin-divider row list at every width instead of
// a separate mobile-card / desktop-table pair. See DESIGN.md.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Receipt, ChevronRight } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Badge, Button, SegmentedControl, EmptyState, Loading } from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = 'UNPAID' | 'PAID'

interface InvoiceListItem {
  id: string
  visit_id: string
  registration_number: string
  customer_name: string
  frozen_total: number
  payment_status: PaymentStatus
  payment_method: string | null
  created_at: string
}

interface InvoiceListResponse {
  invoices: InvoiceListItem[]
  cursor: string | null
}

const PAYMENT_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
]

const PAYMENT_BADGE: Record<PaymentStatus, { variant: 'success' | 'danger'; label: string }> = {
  PAID: { variant: 'success', label: 'Paid' },
  UNPAID: { variant: 'danger', label: 'Unpaid' },
}

// ── Invoice List Page ─────────────────────────────────────────────────────────

export default function InvoiceListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [statusFilter, setStatusFilter] = useState('ALL')

  const queryParams = new URLSearchParams()
  if (statusFilter !== 'ALL') queryParams.set('status', statusFilter)
  const queryString = queryParams.toString()

  const { data, isLoading } = useQuery<InvoiceListResponse>({
    queryKey: ['invoices', statusFilter, tenant?.id],
    queryFn: () =>
      apiFetch<InvoiceListResponse>(
        `/invoices${queryString ? `?${queryString}` : ''}`,
        { tenantId: tenant?.id },
      ),
    enabled: Boolean(tenant?.id),
  })

  const invoices = data?.invoices ?? []

  return (
    <PageShell title="Invoices" showBack>
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <SegmentedControl
          id="invoice-status-filter"
          aria-label="Payment status filter"
          value={statusFilter}
          onChange={setStatusFilter}
          options={PAYMENT_FILTERS}
        />

        {isLoading ? (
          <Loading rows={4} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt size={28} />}
            title="No invoices yet"
            description="Generate your first invoice from a vehicle's details page"
          />
        ) : (
          <div>
            {invoices.map((inv) => {
              const badge = PAYMENT_BADGE[inv.payment_status]
              return (
                <button
                  key={inv.id}
                  id={`invoice-${inv.id}`}
                  type="button"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full flex items-center gap-3 py-3 border-b border-divider last:border-b-0 text-left cursor-pointer hover:bg-bg/60 transition-colors"
                >
                  <div className="w-11 h-11 bg-success-light flex items-center justify-center flex-shrink-0">
                    <Receipt size={18} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-row-title font-semibold text-text truncate">
                      {inv.registration_number}
                    </p>
                    <p className="text-row-sub text-text-secondary/70 truncate mt-0.5">
                      {inv.customer_name}
                      {inv.payment_method ? ` · ${inv.payment_method}` : ''}
                    </p>
                  </div>
                  <span className="text-row-title font-bold text-text flex-shrink-0">
                    ₹{inv.frozen_total.toLocaleString('en-IN')}
                  </span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0 hidden md:block" />
                </button>
              )
            })}

            {data?.cursor && (
              <div className="flex justify-center pt-4">
                <Button
                  id="invoices-load-more"
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
