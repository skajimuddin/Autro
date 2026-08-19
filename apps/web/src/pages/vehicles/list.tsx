// Vehicle List — paginated, filterable vehicle directory
//
// Rebuilt 2026-08-19 to match planning/design_handoff_autro_ui: search input
// + a `.seg` status filter (not pill chips), then flat thin-divider rows
// (56px bordered thumbnail + row-title/row-sub + status tag) — one markup
// tree at every width, not a separate mobile-card / desktop-table pair. The
// handoff is explicit about this: "One markup tree, CSS-driven — do not
// build separate mobile and desktop screens." `Delivered` stays as a 4th
// filter option (real status the API supports; the handoff's own filter
// only shows 3 as a demo simplification). See DESIGN.md.
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Car, ChevronRight } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Button,
  Badge,
  SegmentedControl,
  SearchBar,
  EmptyState,
  Loading,
} from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

type VehicleStatus = 'NEW' | 'REPAIRING' | 'READY' | 'DELIVERED'

interface VehicleListItem {
  id: string
  registration_number: string
  name: string | null
  customer_name: string
  customer_phone: string
  status: VehicleStatus
  created_at: string
}

interface VehicleListResponse {
  vehicles: VehicleListItem[]
  cursor: string | null
}

// ── Filter config ────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'REPAIRING', label: 'Repairing' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Delivered' },
]

const STATUS_BADGE_MAP: Record<VehicleStatus, { variant: 'warning' | 'success' | 'default' | 'danger'; label: string }> = {
  NEW: { variant: 'default', label: 'New' },
  REPAIRING: { variant: 'warning', label: 'Repairing' },
  READY: { variant: 'success', label: 'Ready' },
  DELIVERED: { variant: 'default', label: 'Delivered' },
}

// ── Vehicle List Page ─────────────────────────────────────────────────────────

export default function VehicleListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const queryParams = new URLSearchParams()
  if (statusFilter !== 'ALL') queryParams.set('status', statusFilter)
  if (search.trim()) queryParams.set('plate', search.trim())
  const queryString = queryParams.toString()

  const { data, isLoading, isError } = useQuery<VehicleListResponse>({
    queryKey: ['vehicles', statusFilter, search, tenant?.id],
    queryFn: () =>
      apiFetch<VehicleListResponse>(
        `/vehicles${queryString ? `?${queryString}` : ''}`,
        { tenantId: tenant?.id },
      ),
    enabled: Boolean(tenant?.id),
  })

  const vehicles = data?.vehicles ?? []

  const handleVehicleTap = useCallback(
    (id: string) => {
      navigate(`/vehicles/${id}`)
    },
    [navigate],
  )

  return (
    <PageShell
      title="Vehicles"
      showBack
      rightAction={
        <button
          id="vehicles-add-btn"
          type="button"
          onClick={() => navigate('/vehicles/add')}
          className="w-8 h-8 flex items-center justify-center hover:bg-divider transition-colors"
          aria-label="Add vehicle"
        >
          <Plus size={18} className="text-primary" />
        </button>
      }
    >
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <SearchBar
          id="vehicle-search"
          value={search}
          onChange={setSearch}
          placeholder="Search plate or owner"
        />

        <div className="max-w-[480px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SegmentedControl
            id="vehicle-status-filter"
            aria-label="Status filter"
            fill
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS}
          />
        </div>

        {isLoading ? (
          <Loading rows={5} />
        ) : isError ? (
          <ErrorState />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={<Car size={28} />}
            title="No vehicles found"
            description={
              search
                ? 'Try a different search term'
                : 'Add your first vehicle to start tracking'
            }
            action={
              !search ? (
                <Button
                  size="sm"
                  fullWidth={false}
                  leftIcon={<Plus size={16} />}
                  onClick={() => navigate('/vehicles/add')}
                >
                  Add Vehicle
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div>
            {vehicles.map((vehicle) => {
              const badge = STATUS_BADGE_MAP[vehicle.status]
              return (
                <button
                  key={vehicle.id}
                  id={`vehicle-${vehicle.id}`}
                  type="button"
                  onClick={() => handleVehicleTap(vehicle.id)}
                  className="w-full flex items-center gap-3 py-3 border-b border-divider last:border-b-0 text-left cursor-pointer hover:bg-bg/60 transition-colors"
                >
                  <div className="w-14 h-14 flex-shrink-0 border-2 border-divider flex items-center justify-center text-text/30">
                    <Car size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-row-title font-semibold text-text truncate">
                      {vehicle.registration_number}
                    </p>
                    <p className="text-row-sub text-text-secondary/70 truncate mt-0.5">
                      {vehicle.customer_name}{vehicle.name ? ` · ${vehicle.name}` : ''}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <ChevronRight size={16} className="text-text-muted flex-shrink-0 hidden md:block" />
                </button>
              )
            })}

            {data?.cursor && (
              <div className="flex justify-center pt-4">
                <Button
                  id="vehicles-load-more"
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

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-danger-light flex items-center justify-center mb-3">
        <Car size={24} className="text-danger" />
      </div>
      <p className="text-row-title font-semibold text-text">
        Failed to load vehicles
      </p>
      <p className="text-row-sub text-text-muted mt-1">
        Check your connection and try again
      </p>
    </div>
  )
}
