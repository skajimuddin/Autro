// VehicleSearch — "this car has been here before" prompt on Add Vehicle.
//
// Sits under the registration field. As the owner types, it looks for existing
// vehicles by plate; picking one hands the whole record back so the caller can
// prefill the rest of the form — a returning vehicle should never need its
// details typed twice.
//
// Rendered inline rather than as a floating dropdown: on a phone an overlay
// covers the very fields it is about to fill, and it cannot be scrolled past.
import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, ButtonBase, Divider, Stack, Typography } from '@mui/material'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'

import { apiFetch } from '@/lib/api'
import { Kicker } from '@/components/ui/kicker'

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
  /** Current value of the registration field. */
  query: string
  tenantId: string | undefined
  onSelect: (vehicle: VehicleSearchResult) => void
}

/** Enough to recognise the right car without turning the form into a list. */
const MAX_RESULTS = 3
const MIN_QUERY = 2

export function VehicleSearch({
  query,
  tenantId,
  onSelect,
}: VehicleSearchProps): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState(false)
  const previousQuery = useRef(query)

  // Typing again after a selection re-opens the prompt; the dismissal only
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
      apiFetch<VehicleSearchResponse>(`/vehicles/search?plate=${encodeURIComponent(trimmed)}`, {
        tenantId,
      }),
    enabled: Boolean(tenantId) && trimmed.length >= MIN_QUERY,
  })

  const results = (data?.vehicles ?? []).slice(0, MAX_RESULTS)

  if (dismissed || trimmed.length < MIN_QUERY || results.length === 0) return null

  return (
    <Box sx={{ mt: 1, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Box sx={{ px: 1.5, py: 1, bgcolor: 'action.hover' }}>
        <Kicker>Already in your records</Kicker>
      </Box>

      {results.map((vehicle) => (
        <Box key={vehicle.id}>
          <Divider />
          <ButtonBase
            id={`vehicle-search-result-${vehicle.id}`}
            onClick={() => {
              setDismissed(true)
              onSelect(vehicle)
            }}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 1.375,
              textAlign: 'left',
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                bgcolor: 'action.hover',
                color: 'text.secondary',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <CarIcon sx={{ fontSize: 17 }} />
            </Box>

            <Stack sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
                {vehicle.registration_number}
              </Typography>
              <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                {[vehicle.name, vehicle.customer_name].filter(Boolean).join(' · ')}
              </Typography>
            </Stack>

            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: 'primary.main', flexShrink: 0 }}>
              Use these
            </Typography>
          </ButtonBase>
        </Box>
      ))}
    </Box>
  )
}
