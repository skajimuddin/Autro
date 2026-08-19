// SegmentedControl — grouped choice buttons sharing one pill container.
//
// Added while aligning with planning/design_handoff_autro_ui: the handoff's ".seg"
// pattern (a single bordered pill split into equal-weight options — discount type,
// payment method, tax mode) already existed in this codebase as copy-pasted inline
// markup in estimates/editor.tsx and invoices/editor.tsx. Extracted here so both
// call sites share one implementation instead of drifting, styled with the app's
// own tokens (rounded-full pill, bg-primary active state) rather than the
// handoff's flat/zero-radius look — see DESIGN.md "Borrow patterns, not pixels."
import type React from 'react'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  id?: string
  'aria-label'?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-full border border-border overflow-hidden flex-shrink-0"
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={[
              'px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
              isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
