// SegmentedControl — pill track with a filled active thumb.
//
// Rounded system (2026-08-20): an inset track (`bg-subtle`) with the selected
// option lifted as a filled pill, replacing the flat bordered group.
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
        'inline-flex gap-1 p-1 rounded-tile bg-subtle flex-shrink-0',
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
              'px-3 py-2 rounded-[8px] text-row-sub font-semibold transition-colors whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              fill ? 'flex-1' : '',
              isActive
                ? 'bg-primary text-white shadow-[var(--shadow-primary)]'
                : 'text-text-secondary hover:text-text',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
