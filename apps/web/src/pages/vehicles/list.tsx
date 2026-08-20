// Vehicles — the searchable, stage-filtered directory of everything in the shop.
//
// Rebuilt 2026-08-20 on the dashboard's design system. The rows themselves are
// <VehicleList>, the same component the dashboard's "In the workshop" panel
// renders, so the two screens cannot drift.
//
// Filters are a neutral segmented control rather than the brand-filled pills
// this page used to carry: five blue pills competed with the one blue button
// that actually does something. Blue means "action" here, nothing else.
//
// They carry no counts, deliberately — GET /vehicles returns a page and a
// cursor, not totals, so "Repairing · 7" could only ever be a guess.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  ButtonBase,
  Card,
  Divider,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import type { VisitStatus } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { VehicleList } from '@/components/domain/vehicle-list'
import type { VehicleListItem } from '@/components/domain/vehicle-list'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VehicleListResponse {
  vehicles: VehicleListItem[]
  cursor: string | null
}

type StatusFilter = VisitStatus | 'ALL'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'REPAIRING', label: 'Repairing' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Delivered' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VehicleListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  // noSsr: this is a client-rendered SPA, so the media query can be answered on
  // the first render. Without it every load paints the mobile layout for a
  // frame before correcting itself.
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  const { tenant } = useTenant()

  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<VehicleListResponse>({
      queryKey: ['vehicles', 'list', status, debouncedSearch, tenant?.id],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams()
        if (status !== 'ALL') params.set('status', status)
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim())
        if (pageParam) params.set('cursor', pageParam as string)
        const qs = params.toString()
        return apiFetch<VehicleListResponse>(`/vehicles${qs ? `?${qs}` : ''}`, {
          tenantId: tenant?.id,
        })
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: Boolean(tenant?.id),
    })

  const vehicles = data?.pages.flatMap((page) => page.vehicles) ?? []
  const filtering = status !== 'ALL' || debouncedSearch.trim().length > 0

  const toolbar = (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ md: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ px: { xs: 0, md: 2 }, py: { xs: 0, md: 1.5 } }}
    >
      <StatusFilters value={status} onChange={setStatus} desktop={desktop} />
      <TextField
        id="vehicle-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search plate or customer"
        inputProps={{ 'aria-label': 'Search vehicles by plate or customer' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 1.5, mr: -0.5 }}>
              <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}
      />
    </Stack>
  )

  return (
    <PageShell
      title="Vehicles"
      wide
      rightAction={
        <Button
          id="vehicles-add-btn"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/vehicles/add')}
        >
          Add vehicle
        </Button>
      }
      // The mobile tab bar already carries a centred add action; a second one
      // in a 62px app bar is noise.
      mobileAction={null}
    >
      <Box
        sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {/* On a phone the toolbar sits on the page ground — inside the card it
            would push the first vehicle below the fold. */}
        {!desktop && toolbar}

        <Card sx={{ overflow: 'hidden' }}>
          {desktop && (
            <>
              {toolbar}
              <Divider />
            </>
          )}

          {isLoading ? (
            <Box sx={{ px: 2.25, py: 1 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                <Skeleton key={i} height={44} />
              ))}
            </Box>
          ) : isError ? (
            <EmptyPanel
              icon={<ErrorIcon />}
              title="Could not load vehicles"
              description="Check your connection and try again"
              action={{ label: 'Retry', onClick: () => void refetch() }}
            />
          ) : vehicles.length === 0 ? (
            <EmptyPanel
              icon={<CarIcon />}
              title={filtering ? 'Nothing matches that' : 'No vehicles yet'}
              description={
                filtering
                  ? 'Try a different plate, customer or stage'
                  : 'Add your first vehicle to start tracking repairs'
              }
              action={
                filtering
                  ? undefined
                  : {
                      label: 'Add vehicle',
                      icon: <AddIcon />,
                      onClick: () => navigate('/vehicles/add'),
                    }
              }
            />
          ) : (
            <>
              <VehicleList vehicles={vehicles} onSelect={(id) => navigate(`/vehicles/${id}`)} />
              {hasNextPage && (
                <>
                  <Divider />
                  <Button
                    id="vehicles-load-more"
                    fullWidth
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                    sx={{ borderRadius: 0, fontSize: 13 }}
                  >
                    {isFetchingNextPage ? 'Loading…' : 'Load more'}
                  </Button>
                </>
              )}
            </>
          )}
        </Card>
      </Box>
    </PageShell>
  )
}

// ── Stage filter ──────────────────────────────────────────────────────────────

interface StatusFiltersProps {
  value: StatusFilter
  onChange: (next: StatusFilter) => void
  desktop: boolean
}

/**
 * A segmented control on desktop; scrolling chips on a phone.
 *
 * Five segments need ~350px, which is the whole width of a 390px screen — so
 * the phone gets chips that scroll instead of segments squeezed to nothing.
 * Both are neutral: the selected filter is a change of surface, not a splash
 * of brand colour.
 */
function StatusFilters({ value, onChange, desktop }: StatusFiltersProps): React.JSX.Element {
  if (desktop) {
    return (
      <Stack
        direction="row"
        spacing={0.25}
        role="radiogroup"
        aria-label="Filter by stage"
        sx={{ p: 0.375, borderRadius: 2, bgcolor: 'action.hover' }}
      >
        {FILTERS.map((filter) => {
          const active = filter.value === value
          return (
            <ButtonBase
              key={filter.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(filter.value)}
              sx={{
                height: 28,
                px: 1.5,
                borderRadius: 1.5,
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: active ? 'text.primary' : 'text.secondary',
                bgcolor: active ? 'background.paper' : 'transparent',
                boxShadow: active ? '0 1px 2px rgba(15,23,42,.06)' : 'none',
              }}
            >
              {filter.label}
            </ButtonBase>
          )
        })}
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      role="radiogroup"
      aria-label="Filter by stage"
      sx={{
        overflowX: 'auto',
        // The row bleeds to the screen edges so the last chip doesn't look cut
        // off mid-scroll, while its content still lines up with the page.
        mx: -2,
        px: 2,
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {FILTERS.map((filter) => {
        const active = filter.value === value
        return (
          <ButtonBase
            key={filter.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(filter.value)}
            sx={{
              flexShrink: 0,
              height: 32,
              px: 1.75,
              borderRadius: 2,
              fontSize: 12.5,
              fontWeight: 600,
              border: 1,
              borderColor: active ? 'text.primary' : 'divider',
              bgcolor: active ? 'text.primary' : 'background.paper',
              color: active ? 'background.paper' : 'text.secondary',
            }}
          >
            {filter.label}
          </ButtonBase>
        )
      })}
    </Stack>
  )
}
