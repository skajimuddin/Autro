// Task 3.7 — Registration number autocomplete (Screen 5 step 2)
//
// Sits under the Registration Number field on Add Vehicle. As the owner
// types, it searches existing vehicles by plate; tapping a match hands the
// whole record back so the caller can prefill the rest of the form — the
// point being a returning vehicle never needs its details typed twice.
import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api'
import { ListItem } from '@/components/ui'
import { Car } from '@/components/ui/icons'

export interface VehicleSearchResult {
  id: string
  registration_number: string
  name: string | null
  customer_id: string
  customer_name: string
  customer_phone: string
}

interface VehicleSearchResponse {
  vehicles: VehicleSearchResult[]
}

interface VehicleSearchProps {
  /** Current value of the Registration Number field. */
  query: string
  tenantId: string | undefined
  onSelect: (vehicle: VehicleSearchResult) => void
}

export function VehicleSearch({
  query,
  tenantId,
  onSelect,
}: VehicleSearchProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(false)
  const previousQuery = useRef(query)

  // Typing again after a selection re-opens the dropdown; the dismissal only
  // covers the exact match that was just picked.
  useEffect(() => {
    if (query !== previousQuery.current) {
      previousQuery.current = query
      setDismissed(false)
    }
  }, [query])

  const trimmed = query.trim()
  const { data } = useQuery<VehicleSearchResponse>({
    queryKey: ['vehicle-search', trimmed, tenantId],
    queryFn: () =>
      apiFetch<VehicleSearchResponse>(
        `/vehicles/search?plate=${encodeURIComponent(trimmed)}`,
        { tenantId },
      ),
    enabled: Boolean(tenantId) && trimmed.length >= 2,
  })

  const results = data?.vehicles ?? []

  if (dismissed || trimmed.length < 2 || results.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-card rounded-card border border-border shadow-[var(--shadow-card)] overflow-hidden max-h-64 overflow-y-auto">
      {results.map((vehicle) => (
        <ListItem
          key={vehicle.id}
          id={`vehicle-search-result-${vehicle.id}`}
          leftSlot={<Car size={16} className="text-primary" />}
          title={vehicle.registration_number}
          subtitle={vehicle.customer_name}
          showChevron={false}
          onClick={() => {
            setDismissed(true)
            onSelect(vehicle)
          }}
        />
      ))}
    </div>
  )
}
