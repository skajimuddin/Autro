// StatPill — one figure in the dashboard's compact stat strip.
//
// Added 2026-08-20 with the rounded system. A full-height StatCard grid pushed
// the actual work (the vehicle list) below the fold; these read at a glance in
// one row and give the strip a single filled "hero" figure (`featured`) with
// the rest quiet beside it.
import type React from 'react'

type PillTone = 'primary' | 'success' | 'warning' | 'danger'

interface StatPillProps {
  value: string | number
  label: string
  tone?: PillTone
  /** Filled accent treatment — one per strip. */
  featured?: boolean
  id?: string
}

const dotStyles: Record<PillTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function StatPill({
  value,
  label,
  tone = 'primary',
  featured = false,
  id,
}: StatPillProps): React.JSX.Element {
  return (
    <div
      id={id}
      className={[
        // Stacked on a phone, inline at md:+. Inline everywhere made the
        // widest label ("today's revenue") wrap inside its pill, which made
        // that grid cell taller than the one beside it.
        'flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2',
        'px-4 py-2.5 rounded-tile',
        featured
          ? 'bg-primary text-white shadow-[var(--shadow-primary)]'
          : 'bg-card border border-divider',
      ].join(' ')}
    >
      <span className="flex items-center gap-1.5">
        {!featured && (
          <span className={['w-1.5 h-1.5 rounded-full flex-shrink-0', dotStyles[tone]].join(' ')} />
        )}
        <span className="text-base font-extrabold leading-none tabular">{value}</span>
      </span>
      <span
        className={[
          'text-[0.6875rem] font-semibold leading-none',
          featured ? 'text-white/80' : 'text-text-secondary',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}
