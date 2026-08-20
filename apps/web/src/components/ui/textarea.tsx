// Textarea — same flat styling as Input, multiline. Restyled 2026-08-19.
import type React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({
  label,
  error,
  hint,
  id,
  rows = 3,
  className = '',
  ...rest
}: TextareaProps): React.JSX.Element {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label font-semibold text-text">
          {label}
          {rest.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        className={[
          'w-full rounded-input border bg-card text-text text-row-title font-normal px-3 py-3',
          'placeholder:text-text-muted resize-none leading-normal',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
          error ? 'border-danger' : 'border-border',
          className,
        ].join(' ')}
        {...rest}
      />

      {error && <p className="text-row-sub text-danger">{error}</p>}
      {hint && !error && <p className="text-row-sub text-text-muted">{hint}</p>}
    </div>
  )
}
