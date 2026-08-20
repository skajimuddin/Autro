// VehicleList — the one way vehicles are listed in this app.
//
// The dashboard's "In the workshop" panel and the /vehicles page render the
// same rows from the same endpoint, and used to do it with two separate
// components: a MUI table on the dashboard and a Tailwind table here. They had
// already drifted — different stage colours, different column sets, a
// days-in-shop figure computed twice. This is both of them.
//
// Desktop is a table and mobile is a row stack: a five-column table cannot be
// made legible at 360px, and a card stack wastes a 1360px screen. Both
// branches render the *same fields from the same data*, so they can differ in
// layout but never in content.
//
// Every column is backed by a real field on GET /vehicles. There is
// deliberately no money column: per-vehicle estimate and invoice totals are
// computed per record in GET /vehicles/:id and are not on the list endpoint,
// so that column could only be faked.
import type React from 'react'
import {
  Box,
  ButtonBase,
  Divider,
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
import type { VisitStatus } from '@autro/shared'

import { StageChip } from '@/components/ui/stage-chip'
import { daysInShop, durationLabel, STALE_AFTER_DAYS } from '@/lib/format'

export interface VehicleListItem {
  id: string
  registration_number: string
  name: string | null
  customer_name: string
  customer_phone: string
  status: VisitStatus
  complaint: string | null
  visit_started_at: string | null
}

interface VehicleListProps {
  vehicles: VehicleListItem[]
  onSelect: (id: string) => void
}

const COLUMNS = ['Vehicle', 'Customer', 'Job', 'Stage', 'In shop'] as const

export function VehicleList({ vehicles, onSelect }: VehicleListProps): React.JSX.Element {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))

  return desktop ? (
    <DesktopTable vehicles={vehicles} onSelect={onSelect} />
  ) : (
    <MobileRows vehicles={vehicles} onSelect={onSelect} />
  )
}

/** Days in shop, and whether that number is worth flagging. */
function shopTime(v: VehicleListItem): { label: string; stale: boolean } {
  const days = daysInShop(v.visit_started_at)
  // A delivered car is not "in the shop" any more, however long its visit ran.
  if (days === null || v.status === 'DELIVERED') return { label: '—', stale: false }
  return { label: durationLabel(days), stale: days >= STALE_AFTER_DAYS }
}

// ── Desktop ───────────────────────────────────────────────────────────────────

function DesktopTable({ vehicles, onSelect }: VehicleListProps): React.JSX.Element {
  return (
    <Table size="small" sx={{ tableLayout: 'fixed' }}>
      {/* Stage needs room for a "Repairing" chip and In shop for "6 days" —
          at 14%/11% both truncated mid-word. */}
      <colgroup>
        <col width="24%" />
        <col width="21%" />
        <col width="27%" />
        <col width="16%" />
        <col width="12%" />
      </colgroup>

      <TableHead>
        <TableRow sx={{ bgcolor: 'action.hover' }}>
          {COLUMNS.map((heading) => (
            <TableCell
              key={heading}
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
        {vehicles.map((v) => {
          const { label, stale } = shopTime(v)
          return (
            <TableRow
              key={v.id}
              hover
              tabIndex={0}
              aria-label={`${v.registration_number}, ${v.customer_name}`}
              onClick={() => onSelect(v.id)}
              onKeyDown={(e) => {
                // A clickable row is unreachable by keyboard without this.
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(v.id)
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
                  {v.registration_number}
                </Typography>
                {v.name && (
                  <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                    {v.name}
                  </Typography>
                )}
              </TableCell>

              <TableCell>
                <Typography noWrap sx={{ fontSize: 13 }}>
                  {v.customer_name}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 11.5,
                    color: 'text.disabled',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {v.customer_phone}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography
                  noWrap
                  title={v.complaint ?? undefined}
                  sx={{ fontSize: 12.5, color: v.complaint ? 'text.secondary' : 'text.disabled' }}
                >
                  {v.complaint ?? 'Not inspected'}
                </Typography>
              </TableCell>

              <TableCell>
                <StageChip status={v.status} />
              </TableCell>

              <TableCell>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: stale ? 700 : 400,
                    color: stale ? 'warning.main' : 'text.secondary',
                  }}
                >
                  {label}
                </Typography>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ── Mobile ────────────────────────────────────────────────────────────────────

function MobileRows({ vehicles, onSelect }: VehicleListProps): React.JSX.Element {
  return (
    <Box>
      {vehicles.map((v, i) => {
        const { label, stale } = shopTime(v)
        return (
          <Box key={v.id}>
            {i > 0 && <Divider />}
            <ButtonBase
              onClick={() => onSelect(v.id)}
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
                  {v.registration_number}
                </Typography>
                <Typography noWrap sx={{ fontSize: 12, color: 'text.disabled' }}>
                  {[v.customer_name, v.name].filter(Boolean).join(' · ')}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 12,
                    color: v.complaint ? 'text.secondary' : 'text.disabled',
                    mt: 0.5,
                  }}
                >
                  {v.complaint ?? 'Not inspected'}
                </Typography>
              </Box>

              <Stack alignItems="flex-end" spacing={0.75} sx={{ flexShrink: 0 }}>
                <StageChip status={v.status} />
                <Typography
                  sx={{
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: stale ? 700 : 400,
                    color: stale ? 'warning.main' : 'text.disabled',
                  }}
                >
                  {label}
                </Typography>
              </Stack>
            </ButtonBase>
          </Box>
        )
      })}
    </Box>
  )
}
