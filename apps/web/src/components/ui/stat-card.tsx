// StatCard — flat metric tile: kicker label, then a large coloured number.
//
// Restructured 2026-08-19 to match planning/design_handoff_autro_ui's actual
// dashboard stat markup: `<div class="card"><div class="card-kicker">Active
// repairs</div><div style="font:700 28px">{{ value }}</div></div>` — kicker
// first, big number below, no icon at all. Previous version centred a big
// icon above the number (from an earlier, different demo). The icon prop
// stays, rendered small inline next to the kicker, because several call
// sites (attendance Present/Absent, staff profile) rely on it for scannable
// semantics — dropping it silently would be a regression, not a redesign.
import type React from 'react'

type StatTone = 'primary' | 'success' | 'warning' | 'danger'

interface StatCardProps {
  icon?: React.ReactNode
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
      className="bg-card rounded-card border border-divider p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-1.5 text-kicker font-semibold text-text-secondary uppercase tracking-[0.08em] truncate">
        {icon && <span className="[&>svg]:w-3 [&>svg]:h-3 flex-shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <p className={['text-value-xl font-bold leading-none tabular-nums mt-1.5', toneStyles[tone]].join(' ')}>
        {value}
      </p>
    </div>
  )
}
