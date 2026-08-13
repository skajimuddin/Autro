// StatCard — centred metric tile: colour-toned icon, big value, muted label
//
// Restructured 2026-08-13 to match planning/demo-ui (index.html stat boxes):
// the demo centres the tile, puts a *coloured* icon on top, and renders the value
// at 1.5rem/700 inheriting that same colour, with a 0.9rem secondary label. The
// first build instead used a horizontal grey icon chip with a 1.25rem dark value
// and a 0.75rem muted label — visually much weaker.
//
// The tone colours the icon and the value together via `currentColor`, so call
// sites pass a plain icon with no colour class. Tone is semantic (status), which
// is the one case AGENTS.md permits colour.
import type React from 'react'

type StatTone = 'primary' | 'success' | 'warning' | 'danger'

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  tone?: StatTone
  id?: string
}

const toneStyles: Record<StatTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

export function StatCard({
  icon,
  value,
  label,
  tone = 'primary',
  id,
}: StatCardProps): React.JSX.Element {
  return (
    <div
      id={id}
      className={[
        'bg-card rounded-card p-5 text-center shadow-[var(--shadow-card)]',
        toneStyles[tone],
      ].join(' ')}
    >
      {/* Force 24px (demo uses text-2xl = 1.5rem for its stat icons) regardless of
          the size the call site passed, so every tile matches. */}
      <div className="flex justify-center mb-2 [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
      <p className="text-value font-bold leading-none tabular-nums">{value}</p>
      <p className="text-row-sub text-text-secondary mt-1.5 truncate">{label}</p>
    </div>
  )
}
