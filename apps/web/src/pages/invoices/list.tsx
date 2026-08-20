// Invoice List — filterable list of all invoices
//
// Rebuilt 2026-08-19: segmented filter (matching the handoff's `.seg`, not
// pill chips) and one flat thin-divider row list at every width instead of
// a separate mobile-card / desktop-table pair. See DESIGN.md.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
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

  // Paginated over the `cursor` the API returns. Was a single useQuery whose
  // "Load More" button had no onClick — the list silently stopped at the
  // first page. Fixed 2026-08-20.
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<InvoiceListResponse>({
      queryKey: ['invoices', statusFilter, tenant?.id],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams(queryString)
        if (pageParam) params.set('cursor', pageParam as string)
        const qs = params.toString()
        return apiFetch<InvoiceListResponse>(`/invoices${qs ? `?${qs}` : ''}`, {
          tenantId: tenant?.id,
        })
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: Boolean(tenant?.id),
    })

  const invoices = data?.pages.flatMap((page) => page.invoices) ?? []

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
          <div className="flex flex-col gap-2">
            {invoices.map((inv) => {
              const badge = PAYMENT_BADGE[inv.payment_status]
              return (
                <button
                  key={inv.id}
                  id={`invoice-${inv.id}`}
                  type="button"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[14px] bg-card border border-divider shadow-[var(--shadow-card)] text-left cursor-pointer hover:border-border active:scale-[0.99] transition-all"
                >
                  <div className="w-12 h-12 rounded-tile bg-success-light flex items-center justify-center flex-shrink-0">
                    <Receipt size={18} className="text-success-deep" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-row-title font-semibold text-text truncate">
                      {inv.registration_number}
                    </p>
                    <p className="text-row-sub text-text-muted truncate mt-0.5">
                      {inv.customer_name}
                      {inv.payment_method ? ` · ${inv.payment_method}` : ''}
                    </p>
                  </div>
                  <span className="text-row-title font-bold text-text flex-shrink-0 tabular">
                    ₹{inv.frozen_total.toLocaleString('en-IN')}
                  </span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <ChevronRight
                    size={16}
                    className="text-text-muted flex-shrink-0 hidden md:block"
                  />
                </button>
              )
            })}

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  id="invoices-load-more"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  isLoading={isFetchingNextPage}
                  onClick={() => {
                    void fetchNextPage()
                  }}
                >
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}
