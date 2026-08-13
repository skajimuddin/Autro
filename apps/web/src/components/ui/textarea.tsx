// Textarea — same styling as Input but multiline
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
    <div className="flex flex-col gap-2">
      {/* Matches Input: demo label is 0.95rem/600 secondary */}
      {label && (
        <label htmlFor={inputId} className="text-label font-semibold text-text-secondary">
          {label}
          {rest.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        className={[
          // Demo .input-group textarea: 16px padding, radius 12px, 1rem text
          'w-full rounded-input border bg-card text-text text-base font-normal px-4 py-4',
          'placeholder:text-text-muted resize-none leading-normal',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          error ? 'border-danger' : 'border-border',
          className,
        ].join(' ')}
        {...rest}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
