// SearchBar — input with magnifying glass icon
import type React from 'react'
import { Search } from '@/components/ui/icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  id,
}: SearchBarProps): React.JSX.Element {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-4 rounded-button border border-transparent bg-subtle text-text text-row-title placeholder:text-text-muted focus:outline-none focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors"
      />
    </div>
  )
}
