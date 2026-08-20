// Button — variants: primary, outline, dashed, success, ghost
//
// Rounded system (2026-08-20): pill geometry, and a primary-tinted lift on
// filled variants only — outline/ghost stay flat so a screen has one obvious
// action. See DESIGN.md.
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
  primary:
    'bg-primary text-white shadow-[var(--shadow-primary)] hover:bg-primary-hover active:scale-press disabled:opacity-60 disabled:shadow-none',
  outline:
    'bg-card border-[1.5px] border-primary-light text-primary hover:border-primary hover:bg-primary-light/50 active:scale-press',
  dashed:
    'bg-transparent border-[1.5px] border-dashed border-border text-text-secondary hover:border-primary hover:text-primary active:scale-press',
  success:
    'bg-success text-white shadow-[0_4px_10px_rgba(16,185,129,0.25)] hover:opacity-90 active:scale-press disabled:opacity-60',
  ghost: 'bg-transparent text-text-secondary hover:bg-subtle active:scale-press',
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
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
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
