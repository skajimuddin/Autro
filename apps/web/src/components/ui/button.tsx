// Button — variants: primary, outline, dashed, success, ghost
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
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary-light active:scale-press',
  dashed: 'bg-transparent border-2 border-dashed border-border text-text-secondary hover:border-primary hover:text-primary active:scale-press',
  success: 'bg-success text-white hover:opacity-90 active:scale-press disabled:opacity-60',
  ghost: 'bg-transparent text-text-secondary hover:bg-bg active:scale-press',
}

// Sizes calibrated to planning/demo-ui .btn: 18px padding + 1.1rem/600 text,
// i.e. roughly a 56px tall control. The first build used h-12 with 1rem text,
// which read smaller and less tappable than the approved demo.
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-14 px-5 text-row-title',
  lg: 'h-[58px] px-6 text-row-title',
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
