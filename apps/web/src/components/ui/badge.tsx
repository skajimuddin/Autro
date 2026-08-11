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
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
