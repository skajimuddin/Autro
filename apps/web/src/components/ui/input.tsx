// Input — label + input, flat `.input` styling from the handoff: zero
// radius, 1.5px border, 13px label. Restyled 2026-08-19 (was rounded-xl,
// 16px padding, 0.95rem label).
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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label font-semibold text-text">
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
            'w-full h-11 rounded-input border bg-card text-text text-row-title font-normal',
            'placeholder:text-text-muted',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            error ? 'border-danger' : 'border-border',
            leftIcon ? 'pl-10' : 'pl-3',
            rightIcon ? 'pr-10' : 'pr-3',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 text-text-muted pointer-events-none">{rightIcon}</span>
        )}
      </div>

      {error && <p className="text-row-sub text-danger">{error}</p>}
      {hint && !error && <p className="text-row-sub text-text-muted">{hint}</p>}
    </div>
  )
}
