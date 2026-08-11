// Vehicle List — paginated, filterable vehicle directory
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Car,
  Search,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Button,
  Card,
  Badge,
  FilterChips,
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

// ── Filter Chips Config ───────────────────────────────────────────────────────

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
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg transition-colors"
          aria-label="Add vehicle"
        >
          <Plus size={20} className="text-primary" />
        </button>
      }
    >
      <div className="p-4 flex flex-col gap-4">
        {/* ── Filters ──────────────────────────────────────────── */}
        <FilterChips
          id="vehicle-status-filter"
          chips={STATUS_FILTERS}
          selected={statusFilter}
          onChange={setStatusFilter}
        />

        {/* ── Search ───────────────────────────────────────────── */}
        <SearchBar
          id="vehicle-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by registration number…"
        />

        {/* ── Vehicle List ─────────────────────────────────────── */}
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
          <div className="flex flex-col gap-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onTap={handleVehicleTap}
              />
            ))}

            {/* Load More */}
            {data?.cursor && (
              <div className="flex justify-center pt-2">
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

// ── Vehicle Card ──────────────────────────────────────────────────────────────

interface VehicleCardProps {
  vehicle: VehicleListItem
  onTap: (id: string) => void
}

function VehicleCard({ vehicle, onTap }: VehicleCardProps): React.JSX.Element {
  const badge = STATUS_BADGE_MAP[vehicle.status]

  return (
    <Card
      id={`vehicle-${vehicle.id}`}
      onClick={() => onTap(vehicle.id)}
      className="!p-0 overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        {/* Vehicle Icon */}
        <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
          <Car size={20} className="text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-text truncate">
              {vehicle.registration_number}
            </p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            {vehicle.name ? `${vehicle.name} · ` : ''}
            {vehicle.customer_name}
          </p>
        </div>

        {/* Chevron */}
        <Search size={14} className="text-text-muted flex-shrink-0 opacity-0" />
      </div>
    </Card>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center mb-3">
        <Car size={24} className="text-danger" />
      </div>
      <p className="text-sm font-semibold text-text">
        Failed to load vehicles
      </p>
      <p className="text-xs text-text-muted mt-1">
        Check your connection and try again
      </p>
    </div>
  )
}
