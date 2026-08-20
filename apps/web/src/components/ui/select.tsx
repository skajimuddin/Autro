// Select — styled dropdown matching Input's flat styling. Restyled 2026-08-19.
import type React from 'react'
import { ChevronDown } from '@/components/ui/icons'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
}

export function Select({
  label,
  options,
  placeholder,
  error,
  hint,
  id,
  className = '',
  ...rest
}: SelectProps): React.JSX.Element {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label font-semibold text-text">
          {label}
          {rest.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={inputId}
          className={[
            'w-full h-11 rounded-input border bg-card text-text text-row-title font-normal pl-3 pr-10',
            'appearance-none cursor-pointer',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            error ? 'border-danger' : 'border-border',
            className,
          ].join(' ')}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>

      {error && <p className="text-row-sub text-danger">{error}</p>}
      {hint && !error && <p className="text-row-sub text-text-muted">{hint}</p>}
    </div>
  )
}
