// VehicleListView — the one way vehicles are listed in this app.
//
// Desktop (md:+) renders a table; mobile renders rounded row cards. This is a
// deliberate exception to the old "one markup tree at every width" rule (see
// DESIGN.md): a six-column table cannot be made legible at 360px, and a card
// stack wastes most of a 1360px screen. The two branches render the *same*
// fields from the same data, so they cannot drift apart in content — only in
// layout.
//
// Every column here is backed by a real field on GET /vehicles. There is
// deliberately no money column: per-vehicle estimate/invoice totals are
// computed per record in GET /vehicles/:id (item sum + discount + tax) and
// are not available on the list endpoint, so a "Value" column could only be
// faked.
import type React from 'react'
import { Car } from '@/components/ui/icons'
import { Badge } from '@/components/ui/badge'

// ── Types ─────────────────────────────────────────────────────────────────────

export type VehicleStatus = 'NEW' | 'REPAIRING' | 'READY' | 'DELIVERED'

export interface VehicleListItem {
  id: string
  registration_number: string
  name: string | null
  customer_name: string
  customer_phone: string
  status: VehicleStatus
  created_at: string
  complaint: string | null
  visit_started_at: string | null
}

interface VehicleListViewProps {
  vehicles: VehicleListItem[]
  onSelect: (id: string) => void
}

// ── Status mapping ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  VehicleStatus,
  { variant: 'info' | 'warning' | 'success' | 'default'; label: string }
> = {
  NEW: { variant: 'info', label: 'New' },
  REPAIRING: { variant: 'warning', label: 'Repairing' },
  READY: { variant: 'success', label: 'Ready' },
  DELIVERED: { variant: 'default', label: 'Delivered' },
}

/** Days since the current visit opened, or null when there is no visit. */
function daysInShop(visitStartedAt: string | null): number | null {
  if (!visitStartedAt) return null
  const started = new Date(visitStartedAt)
  if (Number.isNaN(started.getTime())) return null
  const startOfDay = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(started)) / 86_400_000)
  return days < 0 ? 0 : days
}

function formatDuration(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

/** A job sitting this long without being handed over is worth surfacing. */
const STALE_AFTER_DAYS = 5

// ── Shared cells ──────────────────────────────────────────────────────────────

function VehicleThumb(): React.JSX.Element {
  return (
    <div className="w-9 h-9 rounded-tile bg-subtle flex items-center justify-center flex-shrink-0">
      <Car size={17} className="text-text-muted" />
    </div>
  )
}

function InShopCell({ vehicle }: { vehicle: VehicleListItem }): React.JSX.Element {
  const days = daysInShop(vehicle.visit_started_at)

  if (vehicle.status === 'DELIVERED' || days === null) {
    return <span className="text-row-sub text-text-faint">—</span>
  }

  const isStale = days >= STALE_AFTER_DAYS
  return (
    <span
      className={[
        'text-row-sub tabular',
        isStale
          ? 'inline-flex px-2 py-0.5 rounded-button bg-warning-light text-warning-deep font-semibold'
          : 'text-text-secondary',
      ].join(' ')}
    >
      {formatDuration(days)}
    </span>
  )
}

// ── View ──────────────────────────────────────────────────────────────────────

export function VehicleListView({ vehicles, onSelect }: VehicleListViewProps): React.JSX.Element {
  return (
    <>
      {/* ── Mobile: rounded row cards ──────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-2">
        {vehicles.map((vehicle) => {
          const badge = STATUS_BADGE[vehicle.status]
          return (
            <button
              key={vehicle.id}
              id={`vehicle-card-${vehicle.id}`}
              type="button"
              onClick={() => onSelect(vehicle.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-[14px] bg-card border border-divider shadow-[var(--shadow-card)] text-left active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-tile bg-subtle flex items-center justify-center flex-shrink-0">
                <Car size={20} className="text-text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-row-title font-bold text-text truncate">
                  {vehicle.registration_number}
                </p>
                <p className="text-row-sub text-text-muted truncate mt-0.5">
                  {[vehicle.customer_name, vehicle.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </button>
          )
        })}
      </div>

      {/* ── md:+ : table ───────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        {/* table-fixed + explicit column widths: with auto layout the Job
            column collapsed to a few characters ("Fro…") because every other
            column had short, unbreakable content. */}
        <table className="w-full border-collapse table-fixed min-w-[720px]">
          <thead>
            <tr className="bg-subtle">
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-[0.05em] text-text-muted px-4 py-2.5 w-[26%]">
                Vehicle
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-[0.05em] text-text-muted px-4 py-2.5 w-[22%]">
                Customer
              </th>
              <th className="hidden lg:table-cell text-left text-[0.65rem] font-bold uppercase tracking-[0.05em] text-text-muted px-4 py-2.5 w-[30%]">
                Job
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-[0.05em] text-text-muted px-4 py-2.5 w-[12%]">
                Stage
              </th>
              <th className="text-left text-[0.65rem] font-bold uppercase tracking-[0.05em] text-text-muted px-4 py-2.5 whitespace-nowrap">
                In shop
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => {
              const badge = STATUS_BADGE[vehicle.status]
              return (
                <tr
                  key={vehicle.id}
                  id={`vehicle-row-${vehicle.id}`}
                  onClick={() => onSelect(vehicle.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(vehicle.id)
                    }
                  }}
                  tabIndex={0}
                  className="border-t border-divider cursor-pointer hover:bg-bg focus-visible:bg-bg focus-visible:outline-none transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <VehicleThumb />
                      <div className="min-w-0">
                        <p className="text-row-title font-bold text-text truncate">
                          {vehicle.registration_number}
                        </p>
                        {vehicle.name && (
                          <p className="text-row-sub text-text-muted truncate">{vehicle.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-row-sub font-semibold text-text truncate">
                      {vehicle.customer_name}
                    </p>
                    <p className="text-row-sub text-text-muted truncate">
                      {vehicle.customer_phone}
                    </p>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2.5 overflow-hidden">
                    <p
                      className={[
                        'text-row-sub truncate',
                        vehicle.complaint ? 'text-text-secondary' : 'text-text-faint',
                      ].join(' ')}
                      title={vehicle.complaint ?? undefined}
                    >
                      {vehicle.complaint ?? 'No complaint recorded'}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <InShopCell vehicle={vehicle} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
