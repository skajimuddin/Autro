// Badge — status pill: success (green), danger (red), warning (amber)
import type React from 'react'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-light text-success',
  danger:  'bg-danger-light text-danger',
  warning: 'bg-warning-light text-warning',
  default: 'bg-divider text-text-secondary',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        // planning/demo-ui .badge: radius 8px, 0.75rem/700, UPPERCASE.
        // Was rounded-full / weight 600 / no caps, which read as a soft pill
        // rather than the demo's crisp status tag.
        'inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
