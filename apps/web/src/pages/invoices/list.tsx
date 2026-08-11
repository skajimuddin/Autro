// Invoice List — filterable list of all invoices
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Receipt, ChevronRight } from 'lucide-react'

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
    <PageShell title="Invoices" showBack>
      <div className="p-4 flex flex-col gap-4">
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
            {invoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                onTap={() => navigate(`/invoices/${inv.id}`)}
              />
            ))}

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
            <p className="text-sm font-bold text-text truncate">
              {invoice.registration_number}
            </p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            {invoice.customer_name}
            {invoice.payment_method ? ` · ${invoice.payment_method}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-sm font-bold text-text">
            ₹{invoice.frozen_total.toLocaleString('en-IN')}
          </span>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
      </div>
    </Card>
  )
}
