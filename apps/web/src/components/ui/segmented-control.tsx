// SegmentedControl — the handoff's ".seg"/".seg-opt": a single flat, bordered
// group split into equal-weight options (status, discount type, payment
// method, tax mode, vehicle status). Extracted from copy-pasted inline
// markup in estimates/editor.tsx and invoices/editor.tsx; now also used for
// the vehicles list status filter and vehicle-detail status control to match
// the handoff exactly — see DESIGN.md.
//
// `fill` makes options split available width evenly (the handoff's status
// filters and vehicle-status control); omit it for a compact inline group
// that only takes as much width as its labels need (discount type, tax).
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
  fill?: boolean
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  id,
  'aria-label': ariaLabel,
  fill = false,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        'inline-flex rounded-button border-[1.5px] border-border overflow-hidden flex-shrink-0',
        fill ? 'w-full' : '',
      ].join(' ')}
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
              'px-3 py-2 text-row-sub font-semibold transition-colors whitespace-nowrap',
              'border-r-[1.5px] border-border last:border-r-0',
              fill ? 'flex-1' : '',
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
