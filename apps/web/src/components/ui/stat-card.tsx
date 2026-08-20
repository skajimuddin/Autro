// StatCard — metric tile: tinted icon chip, then the number, then its label.
//
// Rounded system (2026-08-20): number-then-label reading order (the number is
// what you scan for), icon in a circular tint chip when one is supplied. Used
// by attendance and staff profile; the dashboard uses the denser StatPill.
import type React from 'react'

type StatTone = 'primary' | 'success' | 'warning' | 'danger'

interface StatCardProps {
  icon?: React.ReactNode
  value: string | number
  label: string
  tone?: StatTone
  id?: string
}

const chipStyles: Record<StatTone, string> = {
  primary: 'bg-primary-light text-primary-hover',
  success: 'bg-success-light text-success-deep',
  warning: 'bg-warning-light text-warning-deep',
  danger: 'bg-danger-light text-danger-deep',
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
      className="bg-card rounded-card border border-divider p-4 shadow-[var(--shadow-card)] flex flex-col gap-2.5"
    >
      {icon && (
        <span
          className={[
            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
            '[&>svg]:w-4 [&>svg]:h-4',
            chipStyles[tone],
          ].join(' ')}
        >
          {icon}
        </span>
      )}
      <div>
        <p className="text-value-xl font-extrabold leading-none tabular text-text">{value}</p>
        <p className="text-row-sub font-medium text-text-secondary mt-1.5 truncate">{label}</p>
      </div>
    </div>
  )
}
