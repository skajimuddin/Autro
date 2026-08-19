// Badge — status pill, matching planning/design_handoff_autro_ui's `.tag`:
// fixed width, centered 11px uppercase/600 label, 1px border, zero radius.
// Variants stay success/danger/warning/default (no call-site churn) mapped to
// the handoff's status colors — success=Ready/Paid green, warning=Repairing/
// Late amber, danger=Absent/Unpaid red, default=Delivered/Pending neutral —
// see DESIGN.md "Color".
import type React from 'react'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-light text-success border-success/30',
  danger:  'bg-danger-light text-danger border-danger/30',
  warning: 'bg-warning-light text-warning border-warning/30',
  default: 'bg-divider text-text-secondary border-border',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        'inline-flex items-center justify-center w-[104px] flex-shrink-0',
        'px-2 py-1 rounded-button border text-kicker font-semibold uppercase tracking-wide text-center',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
