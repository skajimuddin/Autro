// Invoices — every invoice the garage has raised, filterable by payment.
//
// Migrated 2026-08-20 onto the MUI design system. Same shape as /vehicles: a
// neutral filter row, one card, a table at md:+ and stacked rows below, and a
// "Load more" that walks the cursor GET /invoices returns.
//
// Every column comes from a field on GET /invoices — registration_number,
// customer_name, created_at, frozen_total, payment_status. The old Tailwind
// row also printed `payment_method`, which that endpoint has never selected,
// so it rendered as nothing on every row; it is gone rather than guessed at.
// There are no totals either: the endpoint returns a page and a cursor, so
// "Unpaid · ₹42,000" could only be the current page's sum, not the garage's.
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
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { inr, formatFullDate } from '@/lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = 'UNPAID' | 'PAID'

interface InvoiceListItem {
  id: string
  registration_number: string
  customer_name: string
  frozen_total: number
  payment_status: PaymentStatus
  created_at: string
}

interface InvoiceListResponse {
  invoices: InvoiceListItem[]
  cursor: string | null
}

type PaymentFilter = PaymentStatus | 'ALL'

const FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
]

const COLUMNS = ['Vehicle', 'Customer', 'Raised', 'Amount', 'Payment'] as const

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvoiceListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const theme = useTheme()
  // noSsr: client-rendered SPA, so the query can be answered on first render.
  // Without it every load paints the mobile layout for a frame.
  const desktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true })
  const { tenant } = useTenant()

  const [status, setStatus] = useState<PaymentFilter>('ALL')

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<InvoiceListResponse>({
      queryKey: ['invoices', status, tenant?.id],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams()
        if (status !== 'ALL') params.set('status', status)
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
  const open = (id: string): void => {
    void navigate(`/invoices/${id}`)
  }

  const toolbar = (
    <Box sx={{ px: { xs: 0, md: 2 }, py: { xs: 0, md: 1.5 } }}>
      <FilterTabs
        value={status}
        onChange={setStatus}
        options={FILTERS}
        label="Filter by payment status"
        desktop={desktop}
      />
    </Box>
  )

  return (
    <PageShell title="Invoices" wide>
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* On a phone the filters sit on the page ground — inside the card they
            would push the first invoice below the fold. */}
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
              title="Could not load invoices"
              description="Check your connection and try again"
              action={{ label: 'Retry', onClick: () => void refetch() }}
            />
          ) : invoices.length === 0 ? (
            <EmptyPanel
              icon={<ReceiptIcon />}
              title={status === 'ALL' ? 'No invoices yet' : `No ${status.toLowerCase()} invoices`}
              description={
                status === 'ALL'
                  ? "Raise your first invoice from a vehicle's details page"
                  : 'Try a different payment status'
              }
            />
          ) : (
            <>
              {desktop ? (
                <DesktopTable invoices={invoices} onSelect={open} />
              ) : (
                <MobileRows invoices={invoices} onSelect={open} />
              )}
              {hasNextPage && (
                <>
                  <Divider />
                  <Button
                    id="invoices-load-more"
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

// ── Payment chip ──────────────────────────────────────────────────────────────

/**
 * Paid is the same green a READY vehicle carries — the thing you wanted to
 * happen has happened. Unpaid is amber, not red: money still owed on a job
 * finished yesterday is a nudge, not a failure, and red beside it every day
 * would stop meaning anything.
 */
function PaymentChip({ status }: { status: PaymentStatus }): React.JSX.Element {
  return (
    <Chip
      size="small"
      label={status === 'PAID' ? 'Paid' : 'Unpaid'}
      sx={(t) =>
        status === 'PAID'
          ? { bgcolor: alpha(t.palette.success.main, 0.16), color: t.palette.success.main }
          : { bgcolor: alpha(t.palette.warning.main, 0.16), color: t.palette.warning.main }
      }
    />
  )
}

// ── Desktop ───────────────────────────────────────────────────────────────────

interface RowsProps {
  invoices: InvoiceListItem[]
  onSelect: (id: string) => void
}

function DesktopTable({ invoices, onSelect }: RowsProps): React.JSX.Element {
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
        {invoices.map((inv) => (
          <TableRow
            key={inv.id}
            id={`invoice-${inv.id}`}
            hover
            tabIndex={0}
            aria-label={`Invoice for ${inv.registration_number}, ${inv.customer_name}`}
            onClick={() => onSelect(inv.id)}
            onKeyDown={(e) => {
              // A clickable row is unreachable by keyboard without this.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(inv.id)
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
                {inv.registration_number}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography noWrap sx={{ fontSize: 13 }}>
                {inv.customer_name}
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
                {formatFullDate(inv.created_at)}
              </Typography>
            </TableCell>

            <TableCell align="right">
              <Typography
                noWrap
                sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
              >
                {inr(inv.frozen_total)}
              </Typography>
            </TableCell>

            <TableCell>
              <PaymentChip status={inv.payment_status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileRows({ invoices, onSelect }: RowsProps): React.JSX.Element {
  return (
    <Box>
      {invoices.map((inv, i) => (
        <Box key={inv.id}>
          {i > 0 && <Divider />}
          <ButtonBase
            id={`invoice-${inv.id}`}
            onClick={() => onSelect(inv.id)}
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
                {inv.registration_number}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: 'text.disabled' }}>
                {inv.customer_name}
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
                {formatFullDate(inv.created_at)}
              </Typography>
            </Box>

            <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
              >
                {inr(inv.frozen_total)}
              </Typography>
              <PaymentChip status={inv.payment_status} />
            </Stack>
          </ButtonBase>
        </Box>
      ))}
    </Box>
  )
}
