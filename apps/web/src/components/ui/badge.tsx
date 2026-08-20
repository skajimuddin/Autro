// Badge — status chip: pill, tinted fill, deep text, sized to its label.
//
// Rounded system (2026-08-20). Text uses the `-deep` step, not the base hue:
// `text-warning` on `bg-warning-light` is ~2:1 contrast and fails WCAG AA;
// `text-warning-deep` clears it. The fixed 104px width is gone — a chip that
// hugs its label reads as data, not as a form control.
import type React from 'react'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'default' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  /** Show a leading status dot. */
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-light text-success-deep',
  danger: 'bg-danger-light text-danger-deep',
  warning: 'bg-warning-light text-warning-deep',
  info: 'bg-primary-light text-primary-hover',
  default: 'bg-subtle text-text-secondary',
}

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-primary',
  default: 'bg-text-muted',
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        'inline-flex items-center justify-center gap-1.5 flex-shrink-0',
        'px-2.5 py-1 rounded-button text-row-sub font-semibold leading-none',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span
          className={['w-1.5 h-1.5 rounded-full flex-shrink-0', dotStyles[variant]].join(' ')}
        />
      )}
      {children}
    </span>
  )
}
