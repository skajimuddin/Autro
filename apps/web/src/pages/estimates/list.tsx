// Estimate List — all estimates with status filtering
//
// Rebuilt 2026-08-19: one flat thin-divider row list at every width instead
// of a separate mobile-card / desktop-table pair — see DESIGN.md and the
// same change in vehicles/list.tsx.
import { useNavigate } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { FileText, ChevronRight } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Badge, Button, EmptyState, Loading } from '@/components/ui'

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

const STATUS_BADGE: Record<
  EstimateStatus,
  { variant: 'warning' | 'success' | 'default'; label: string }
> = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'warning', label: 'Sent' },
  CONVERTED: { variant: 'success', label: 'Converted' },
}

// ── Estimate List Page ────────────────────────────────────────────────────────

export default function EstimateListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()

  // Paginated over the `cursor` the API returns. Was a single useQuery whose
  // "Load More" button had no onClick — the list silently stopped at the
  // first page. Fixed 2026-08-20.
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<EstimateListResponse>({
      queryKey: ['estimates', tenant?.id],
      queryFn: ({ pageParam }) =>
        apiFetch<EstimateListResponse>(
          `/estimates${pageParam ? `?cursor=${pageParam as string}` : ''}`,
          { tenantId: tenant?.id },
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: Boolean(tenant?.id),
    })

  const estimates = data?.pages.flatMap((page) => page.estimates) ?? []

  return (
    <PageShell title="Estimates" showBack>
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
          <div className="flex flex-col gap-2">
            {estimates.map((est) => {
              const badge = STATUS_BADGE[est.status]
              return (
                <button
                  key={est.id}
                  id={`estimate-${est.id}`}
                  type="button"
                  onClick={() => navigate(`/estimates/${est.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[14px] bg-card border border-divider shadow-[var(--shadow-card)] text-left cursor-pointer hover:border-border active:scale-[0.99] transition-all"
                >
                  <div className="w-12 h-12 rounded-tile bg-warning-light flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-warning-deep" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-row-title font-semibold text-text truncate">
                      {est.registration_number}
                    </p>
                    <p className="text-row-sub text-text-muted truncate mt-0.5">
                      {est.customer_name}
                    </p>
                  </div>
                  <span className="text-row-title font-bold text-text flex-shrink-0 tabular">
                    ₹{est.total.toLocaleString('en-IN')}
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
                  id="estimates-load-more"
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
