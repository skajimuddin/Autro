// Vehicle List — searchable, status-filtered vehicle directory.
//
// Rebuilt 2026-08-20 for the rounded design system (see DESIGN.md): a toolbar
// (status pills + search) above one shared <VehicleListView> — table at md:+,
// rounded cards on mobile.
//
// Two fixes that came with the rebuild:
//   - "Load more" was a button with no onClick — the `cursor` the API returns
//     was never used, so the list was capped at the first 20 vehicles. It is
//     now a real useInfiniteQuery over that cursor.
//   - Search is debounced; it previously refetched on every keystroke.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Plus, Car } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Button, SearchBar, EmptyState, Loading, TableRowSkeleton } from '@/components/ui'
import { VehicleListView } from '@/components/domain/vehicle-list-view'
import type { VehicleListItem } from '@/components/domain/vehicle-list-view'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VehicleListResponse {
  vehicles: VehicleListItem[]
  cursor: string | null
}

// ── Filter config ────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'REPAIRING', label: 'Repairing' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Delivered' },
] as const

// ── Vehicle List Page ─────────────────────────────────────────────────────────

export default function VehicleListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const buildPath = (cursor: string | null): string => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (debouncedSearch.trim()) params.set('plate', debouncedSearch.trim())
    if (cursor) params.set('cursor', cursor)
    const qs = params.toString()
    return `/vehicles${qs ? `?${qs}` : ''}`
  }

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<VehicleListResponse>({
      queryKey: ['vehicles', statusFilter, debouncedSearch, tenant?.id],
      queryFn: ({ pageParam }) =>
        apiFetch<VehicleListResponse>(buildPath(pageParam as string | null), {
          tenantId: tenant?.id,
        }),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: Boolean(tenant?.id),
    })

  const vehicles = data?.pages.flatMap((page) => page.vehicles) ?? []

  return (
    <PageShell
      title="Vehicles"
      wide
      rightAction={
        <Button
          id="vehicles-add-btn"
          size="sm"
          fullWidth={false}
          leftIcon={<Plus size={15} />}
          onClick={() => navigate('/vehicles/add')}
        >
          Add vehicle
        </Button>
      }
    >
      <div className="px-4 md:px-7 pb-4 flex flex-col gap-4">
        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status pills — horizontally scrollable on narrow phones */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.value
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  aria-pressed={isActive}
                  className={[
                    'flex-shrink-0 px-3.5 py-2 rounded-button text-row-sub font-semibold transition-colors',
                    isActive
                      ? 'bg-primary text-white shadow-[var(--shadow-primary)]'
                      : 'bg-card border border-divider text-text-secondary hover:text-text',
                  ].join(' ')}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>

          <div className="md:w-[260px] md:flex-shrink-0">
            <SearchBar
              id="vehicle-search"
              value={search}
              onChange={setSearch}
              placeholder="Search plate"
            />
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <>
            <div className="md:hidden">
              <Loading rows={5} />
            </div>
            <div className="hidden md:block rounded-card border border-divider bg-card overflow-hidden">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          </>
        ) : isError ? (
          <ErrorState />
        ) : vehicles.length === 0 ? (
          <div className="md:rounded-card md:border md:border-divider md:bg-card">
            <EmptyState
              icon={<Car size={24} />}
              title="No vehicles found"
              description={
                search
                  ? 'No plate matches that search'
                  : statusFilter !== 'ALL'
                    ? 'No vehicles at this stage right now'
                    : 'Add your first vehicle to start tracking repairs'
              }
              action={
                !search && statusFilter === 'ALL' ? (
                  <Button
                    size="sm"
                    fullWidth={false}
                    leftIcon={<Plus size={16} />}
                    onClick={() => navigate('/vehicles/add')}
                  >
                    Add vehicle
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="md:rounded-card md:border md:border-divider md:bg-card md:shadow-[var(--shadow-card)] md:overflow-hidden">
              <VehicleListView vehicles={vehicles} onSelect={(id) => navigate(`/vehicles/${id}`)} />
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-1">
                <Button
                  id="vehicles-load-more"
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
          </>
        )}
      </div>
    </PageShell>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center mb-3">
        <Car size={24} className="text-danger-deep" />
      </div>
      <p className="text-row-title font-semibold text-text">Failed to load vehicles</p>
      <p className="text-row-sub text-text-muted mt-1">Check your connection and try again</p>
    </div>
  )
}
