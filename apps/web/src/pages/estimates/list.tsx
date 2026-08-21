// Estimates — every quote the garage has written, filterable by status.
//
// Migrated 2026-08-21 onto the MUI design system, matching /invoices exactly:
// a neutral filter row, one card, a table at md:+ and stacked rows below, and
// a "Load more" that walks the cursor GET /estimates returns.
//
// Every column comes from a field that endpoint actually returns —
// registration_number, customer_name, created_at, total, status. `total` is
// computed server-side from the estimate's items, discount and tax, so the
// amount here is the same figure the editor shows.
//
// The filter offers Draft and Converted only: GET /estimates ignores any other
// `status` value, so a "Sent" filter would silently return everything. A row
// that is somehow SENT still renders with its own label.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DescIcon from '@mui/icons-material/DescriptionOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'
import type { EstimateStatus } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { inr, formatFullDate } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EstimateListItem {
  id: string
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

type StatusFilter = 'ALL' | 'DRAFT' | 'CONVERTED'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONVERTED', label: 'Converted' },
]

const STATUS_LABEL: Record<EstimateStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  CONVERTED: 'Converted',
}

const COLUMNS = ['Vehicle', 'Customer', 'Written', 'Amount', 'Status'] as const

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EstimateListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  // noSsr: client-rendered SPA, so the query can be answered on first render.
  // Without it every load paints the mobile layout for a frame.
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  const { tenant } = useTenant()

  const [status, setStatus] = useState<StatusFilter>('ALL')

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<EstimateListResponse>({
      queryKey: ['estimates', status, tenant?.id],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams()
        if (status !== 'ALL') params.set('status', status)
        if (pageParam) params.set('cursor', pageParam as string)
        const qs = params.toString()
        return apiFetch<EstimateListResponse>(`/estimates${qs ? `?${qs}` : ''}`, {
          tenantId: tenant?.id,
        })
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
      enabled: Boolean(tenant?.id),
    })

  const estimates = data?.pages.flatMap((page) => page.estimates) ?? []
  const open = (id: string): void => {
    void navigate(`/estimates/${id}`)
  }

  const toolbar = (
    <Box sx={{ px: { xs: 0, md: 2 }, py: { xs: 0, md: 1.5 } }}>
      <FilterTabs
        value={status}
        onChange={setStatus}
        options={FILTERS}
        label="Filter by estimate status"
        desktop={desktop}
      />
    </Box>
  )

  return (
    <PageShell title="Estimates" wide>
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* On a phone the filters sit on the page ground — inside the card they
            would push the first estimate below the fold. */}
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
                <Skeleton key={i} height={44} />
              ))}
            </Box>
          ) : isError ? (
            <EmptyPanel
              icon={<ErrorIcon />}
              title="Could not load estimates"
              description="Check your connection and try again"
              action={{ label: 'Retry', onClick: () => void refetch() }}
            />
          ) : estimates.length === 0 ? (
            <EmptyPanel
              icon={<DescIcon />}
              title={status === 'ALL' ? 'No estimates yet' : `No ${status.toLowerCase()} estimates`}
              description={
                status === 'ALL'
                  ? "Write your first estimate from a vehicle's details page"
                  : 'Try a different status'
              }
            />
          ) : (
            <>
              {desktop ? (
                <DesktopTable estimates={estimates} onSelect={open} />
              ) : (
                <MobileRows estimates={estimates} onSelect={open} />
              )}
              {hasNextPage && (
                <>
                  <Divider />
                  <Button
                    id="estimates-load-more"
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

// ── Status chip ───────────────────────────────────────────────────────────────

/**
 * No green for Converted. Converting is bookkeeping, not the outcome anyone is
 * waiting on — once it happens the invoice carries the decision and the
 * estimate is finished business, so it gets the same hollow outline a
 * DELIVERED vehicle carries. Draft and Sent are neutral tints: nearly every
 * row is a draft, and colouring all of them would make colour mean nothing.
 */
function StatusChip({ status }: { status: EstimateStatus }): React.JSX.Element {
  return (
    <Chip
      size="small"
      label={STATUS_LABEL[status]}
      sx={(t) =>
        status === 'CONVERTED'
          ? {
              bgcolor: 'transparent',
              color: t.palette.text.disabled,
              border: `1px solid ${t.palette.divider}`,
            }
          : {
              bgcolor: alpha(t.palette.text.primary, status === 'SENT' ? 0.08 : 0.06),
              color: status === 'SENT' ? t.palette.text.primary : t.palette.text.secondary,
            }
      }
    />
  )
}

// ── Desktop ───────────────────────────────────────────────────────────────────

interface RowsProps {
  estimates: EstimateListItem[]
  onSelect: (id: string) => void
}

function DesktopTable({ estimates, onSelect }: RowsProps): React.JSX.Element {
  return (
    <Table size="small" sx={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col width="22%" />
        <col width="26%" />
        <col width="16%" />
        <col width="18%" />
        <col width="18%" />
      </colgroup>

      <TableHead>
        <TableRow sx={{ bgcolor: 'action.hover' }}>
          {COLUMNS.map((heading) => (
            <TableCell
              key={heading}
              align={heading === 'Amount' ? 'right' : 'left'}
              sx={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'text.disabled',
                py: 1.25,
                whiteSpace: 'nowrap',
              }}
            >
              {heading}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {estimates.map((est) => (
          <TableRow
            key={est.id}
            id={`estimate-${est.id}`}
            hover
            tabIndex={0}
            aria-label={`Estimate for ${est.registration_number}, ${est.customer_name}`}
            onClick={() => onSelect(est.id)}
            onKeyDown={(e) => {
              // A clickable row is unreachable by keyboard without this.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(est.id)
              }
            }}
            sx={{
              cursor: 'pointer',
              '&:last-child td': { border: 0 },
              '&:focus-visible': {
                outline: (t) => `2px solid ${t.palette.primary.main}`,
                outlineOffset: -2,
              },
            }}
          >
            <TableCell sx={{ py: 1.75 }}>
              <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
                {est.registration_number}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography noWrap sx={{ fontSize: 13 }}>
                {est.customer_name}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography
                noWrap
                sx={{
                  fontSize: 12.5,
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatFullDate(est.created_at)}
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography
                noWrap
                sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
              >
                {inr(est.total)}
              </Typography>
            </TableCell>

            <TableCell>
              <StatusChip status={est.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileRows({ estimates, onSelect }: RowsProps): React.JSX.Element {
  return (
    <Box>
      {estimates.map((est, i) => (
        <Box key={est.id}>
          {i > 0 && <Divider />}
          <ButtonBase
            id={`estimate-${est.id}`}
            onClick={() => onSelect(est.id)}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              px: 2.25,
              py: 1.75,
              textAlign: 'left',
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                {est.registration_number}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: 'text.disabled' }}>
                {est.customer_name}
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                  mt: 0.5,
                }}
              >
                {formatFullDate(est.created_at)}
              </Typography>
            </Box>

            <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
              >
                {inr(est.total)}
              </Typography>
              <StatusChip status={est.status} />
            </Stack>
          </ButtonBase>
        </Box>
      ))}
    </Box>
  )
}
