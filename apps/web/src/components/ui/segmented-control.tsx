// SegmentedControl — a small either/or choice, inline with its input.
//
// Migrated 2026-08-20 onto MUI. Used for the discount type on both editors,
// where the choice (₹ or %) changes what the number beside it means, so the
// two controls have to read as one thing.
import type React from 'react'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { alpha } from '@mui/material/styles'

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
    <ToggleButtonGroup
      id={id}
      aria-label={ariaLabel}
      exclusive
      size="small"
      value={value}
      // `next` is null when the active button is pressed again. Ignoring it
      // keeps the control exclusive rather than letting it empty itself.
      onChange={(_, next: T | null) => next && onChange(next)}
      sx={{ flexShrink: 0 }}
    >
      {options.map((opt) => (
        <ToggleButton
          key={opt.value}
          value={opt.value}
          sx={(t) => ({
            px: 1.75,
            height: 40,
            fontSize: 12.5,
            fontWeight: 600,
            textTransform: 'none',
            '&.Mui-selected': {
              bgcolor: alpha(t.palette.primary.main, 0.12),
              color: t.palette.primary.main,
              '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.18) },
            },
          })}
        >
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
