// Invoice List — filterable list of all invoices
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Receipt, ChevronRight } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Badge,
  Button,
  FilterChips,
  EmptyState,
  Loading,
} from '@/components/ui'

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
    <PageShell title="Invoices" showBack wide>
      <div className="p-4 md:p-6 flex flex-col gap-4">
        {/* ── Filters ──────────────────────────────────────────── */}
        <FilterChips
          id="invoice-status-filter"
          chips={PAYMENT_FILTERS}
          selected={statusFilter}
          onChange={setStatusFilter}
        />

        {/* ── Invoice List ─────────────────────────────────────── */}
        {isLoading ? (
          <Loading rows={4} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt size={28} />}
            title="No invoices yet"
            description="Generate your first invoice from a vehicle's details page"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Mobile / Tablet grid (hidden on lg and up) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
              {invoices.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  onTap={() => navigate(`/invoices/${inv.id}`)}
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
                  {invoices.map((inv) => {
                    const badge = PAYMENT_BADGE[inv.payment_status]
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="hover:bg-bg/50 cursor-pointer transition-colors border-b border-border last:border-0"
                      >
                        <td className="py-4 px-5 text-row-title font-bold text-text">{inv.registration_number}</td>
                        <td className="py-4 px-5 text-row-sub text-text-secondary">
                          {inv.customer_name}
                          {inv.payment_method ? ` · ${inv.payment_method}` : ''}
                        </td>
                        <td className="py-4 px-5 text-row-title font-bold text-text">₹{inv.frozen_total.toLocaleString('en-IN')}</td>
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

// ── Invoice Card ──────────────────────────────────────────────────────────────

interface InvoiceCardProps {
  invoice: InvoiceListItem
  onTap: () => void
}

function InvoiceCard({ invoice, onTap }: InvoiceCardProps): React.JSX.Element {
  const badge = PAYMENT_BADGE[invoice.payment_status]

  return (
    <Card id={`invoice-${invoice.id}`} onClick={onTap}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center flex-shrink-0">
          <Receipt size={18} className="text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-row-title font-bold text-text truncate">
              {invoice.registration_number}
            </p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-row-sub text-text-secondary mt-0.5 truncate">
            {invoice.customer_name}
            {invoice.payment_method ? ` · ${invoice.payment_method}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-row-title font-bold text-text">
            ₹{invoice.frozen_total.toLocaleString('en-IN')}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </div>
    </Card>
  )
}
