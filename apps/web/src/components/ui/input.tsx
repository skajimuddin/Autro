// Input — label + input with rounded-xl, slate border, blue focus ring
import type React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  className = '',
  ...rest
}: InputProps): React.JSX.Element {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-2">
      {/* Demo .input-group label: 0.95rem/600 in *secondary*, with an 8px gap.
          Was 0.875rem/600 in full-strength text with a 6px gap. */}
      {label && (
        <label htmlFor={inputId} className="text-label font-semibold text-text-secondary">
          {label}
          {rest.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-text-muted pointer-events-none">{leftIcon}</span>
        )}
        <input
          id={inputId}
          className={[
            // Demo .input-group input: 16px padding all round (~54px tall),
            // radius 12px, 1rem text. Was h-12 with px-3 — visibly tighter.
            'w-full py-4 rounded-input border bg-card text-text text-base font-normal',
            'placeholder:text-text-muted',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            error ? 'border-danger' : 'border-border',
            leftIcon ? 'pl-10' : 'pl-4',
            rightIcon ? 'pr-10' : 'pr-4',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 text-text-muted pointer-events-none">{rightIcon}</span>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
