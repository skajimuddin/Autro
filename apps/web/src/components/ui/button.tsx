// Button — variants: primary, outline, dashed, success, ghost
//
// Restyled 2026-08-19 to the flat system from planning/design_handoff_autro_ui
// (.btn/.btn-primary/.btn-secondary/.btn-ghost — see DESIGN.md): zero radius
// (rounded-button is now 0), no floating glow shadow, 1.5px borders instead
// of 2px, 14px/600 label matching the handoff's row-title size. `dashed` has
// no equivalent in the handoff (its "+ Add line item" is a plain ghost
// button) but stays available — nothing in this app depends on removing it.
import type React from 'react'

type ButtonVariant = 'primary' | 'outline' | 'dashed' | 'success' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:scale-press disabled:opacity-60',
  outline: 'bg-transparent border-[1.5px] border-primary text-primary hover:bg-primary-light active:scale-press',
  dashed: 'bg-transparent border-[1.5px] border-dashed border-border text-text-secondary hover:border-primary hover:text-primary active:scale-press',
  success: 'bg-success text-white hover:opacity-90 active:scale-press disabled:opacity-60',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg active:scale-press',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-row-sub',
  md: 'h-11 px-5 text-row-title',
  lg: 'h-12 px-6 text-row-title',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      disabled={disabled ?? isLoading}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-button font-semibold transition-all duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-fast" />
          Loading…
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  )
}
