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
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {chips.map((chip) => {
        const isActive = chip.value === selected
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={[
              'flex-shrink-0 px-4 h-8 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-text-secondary hover:border-primary hover:text-primary',
            ].join(' ')}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
