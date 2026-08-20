// FilterTabs — the one way a list page filters itself.
//
// A segmented control on desktop; scrolling chips on a phone. Five segments
// need ~350px, which is the whole width of a 390px screen — so the phone gets
// chips that scroll instead of segments squeezed to nothing.
//
// Both are neutral: the selected filter is a change of surface, not a splash
// of brand colour. Five blue pills beside one blue button teach nobody what
// blue means.
//
// Lived privately inside /vehicles until /invoices needed the same control.
import type React from 'react'
import { ButtonBase, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

interface FilterTabsProps<T extends string> {
  value: T
  onChange: (next: T) => void
  options: readonly { value: T; label: string }[]
  /** Names the group for screen readers — "Filter by stage". */
  label: string
  /** The caller already knows its breakpoint; one media query per page. */
  desktop: boolean
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  label,
  desktop,
}: FilterTabsProps<T>): React.JSX.Element {
  if (desktop) {
    return (
      <Stack
        direction="row"
        spacing={0.25}
        role="radiogroup"
        aria-label={label}
        sx={{ p: 0.375, borderRadius: 2, bgcolor: 'action.hover' }}
      >
        {options.map((option) => {
          const active = option.value === value
          return (
            <ButtonBase
              key={option.value}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              sx={(t) => ({
                height: 28,
                px: 1.5,
                borderRadius: 1.5,
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: active ? t.palette.text.primary : t.palette.text.secondary,
                bgcolor: active ? t.palette.background.paper : 'transparent',
                // The lift that separates the selected segment from its track.
                // Neutral, never tinted — see DESIGN.md on coloured shadows.
                boxShadow: active ? `0 1px 2px ${alpha(t.palette.common.black, 0.06)}` : 'none',
              })}
            >
              {option.label}
            </ButtonBase>
          )
        })}
      </Stack>
    )
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      role="radiogroup"
      aria-label={label}
      sx={{
        overflowX: 'auto',
        // The row bleeds to the screen edges so the last chip doesn't look cut
        // off mid-scroll, while its content still lines up with the page.
        mx: -2,
        px: 2,
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <ButtonBase
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            sx={{
              flexShrink: 0,
              height: 32,
              px: 1.75,
              borderRadius: 2,
              fontSize: 12.5,
              fontWeight: 600,
              border: 1,
              borderColor: active ? 'text.primary' : 'divider',
              bgcolor: active ? 'text.primary' : 'background.paper',
              color: active ? 'background.paper' : 'text.secondary',
            }}
          >
            {option.label}
          </ButtonBase>
        )
      })}
    </Stack>
  )
}
