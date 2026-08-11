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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-text">
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
            'w-full h-12 rounded-input border bg-card text-text text-base font-normal',
            'placeholder:text-text-muted',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
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

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
