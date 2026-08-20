// FilterChips — horizontal scrollable chip buttons for filtering
import type React from 'react'

interface FilterChip {
  value: string
  label: string
}

interface FilterChipsProps {
  chips: FilterChip[]
  selected: string
  onChange: (value: string) => void
  id?: string
}

export function FilterChips({ chips, selected, onChange, id }: FilterChipsProps): React.JSX.Element {
  return (
    <div
      id={id}
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((chip) => {
        const isActive = chip.value === selected
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={[
              'flex-shrink-0 px-4 h-9 rounded-button text-row-sub font-semibold transition-colors border',
              isActive
                ? 'bg-primary text-white border-primary shadow-[var(--shadow-primary)]'
                : 'bg-card border-divider text-text-secondary hover:border-border hover:text-text',
            ].join(' ')}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
