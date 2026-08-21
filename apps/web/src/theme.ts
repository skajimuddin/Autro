// Autro MUI theme — the single source of colour, type and shape.
//
// Built 2026-08-20 from the approved design (Direction B). Two colour schemes;
// MUI's CSS-variable provider swaps them by setting data-mui-color-scheme on
// <html>, which index.css also keys its Tailwind tokens off, so screens that
// have not been migrated yet flip with it instead of staying light.
import { createTheme, alpha } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import type { VisitStatus } from '@autro/shared'

/**
 * ONE brand colour: Autro blue, calmed.
 *
 * The app's original #2563EB is 84% saturation — that is what made it glow on
 * every surface. This is the same hue family at 72%: unmistakably the same
 * brand, without the glare. Only lightness moves between schemes.
 *
 * Contrast, measured (WCAG AA needs 4.5): white on light brand 5.86:1;
 * #10151E on dark brand 8.03:1. Both pass.
 */
export const BRAND = { light: '#3560c0', dark: '#8dabf0' } as const

// Semantic hues are deliberately NOT the brand. If blue also meant "overdue"
// it would stop meaning "action". Muted to sit beside the calmed brand.
const SEMANTIC = {
  light: { success: '#3f7a5a', warning: '#8a6a2f', error: '#a8443c' },
  dark: { success: '#7fb79a', warning: '#d0ae72', error: '#e0918a' },
}

// Cool-neutral greys. Warm greys under a blue brand read as two systems.
const NEUTRAL = {
  light: {
    canvas: '#f6f7f9',
    paper: '#ffffff',
    line: '#e4e7ec',
    ink: '#15181d',
    ink2: '#5b6473',
    ink3: '#8b93a1',
  },
  dark: {
    canvas: '#121417',
    paper: '#191c20',
    line: '#262a30',
    ink: '#e9ecf1',
    ink2: '#9aa3b2',
    ink3: '#6b7280',
  },
}

const scheme = (mode: 'light' | 'dark') => {
  const n = NEUTRAL[mode]
  const s = SEMANTIC[mode]
  return {
    palette: {
      primary: {
        main: BRAND[mode],
        dark: mode === 'dark' ? '#a6bff5' : '#2a4e9e',
        contrastText: mode === 'dark' ? '#10151e' : '#ffffff',
      },
      background: { default: n.canvas, paper: n.paper },
      text: { primary: n.ink, secondary: n.ink2, disabled: n.ink3 },
      divider: n.line,
      success: { main: s.success },
      warning: { main: s.warning },
      error: { main: s.error },
    },
  }
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
  colorSchemes: { light: scheme('light'), dark: scheme('dark') },
  shape: { borderRadius: 8 },
  typography: {
    // Geist, self-hosted in public/fonts (see index.css). Deliberately not
    // Inter — the most-used UI font on the web reads as a default rather than
    // a decision — and its even-width numerals matter on a screen that is
    // mostly money and counts.
    fontFamily: '"Geist", system-ui, -apple-system, sans-serif',
    h5: { fontWeight: 700, letterSpacing: '-0.022em', fontSize: 27 },
    subtitle2: { fontWeight: 600, fontSize: 14 },
    body2: { fontSize: 13.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    // No coloured glows anywhere: depth is a hairline plus a change of
    // surface. A tinted shadow under every button was a large part of what
    // made the old UI feel loud.
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        // Rounder than the theme's base shape (8px, shared by inputs, chips,
        // menus…) on purpose — cards are the one surface meant to read as
        // soft. Matches --radius-card in index.css, which does the same job
        // for screens still on Tailwind.
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          borderRadius: 18,
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { height: 40, paddingInline: 18 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: 12, height: 24, borderRadius: 6 } },
    },
    // Fields match the buttons beside them: 40px tall, 8px radius, hairline
    // border, paper ground. Defined here rather than per form, so a field
    // added to any screen later is already right.
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: 14,
          backgroundColor: theme.palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.disabled },
          // MUI thickens the outline to 2px on focus, which shifts the text
          // inside it by a pixel. Colour carries the focus instead.
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.error.main },
          '&.MuiInputBase-multiline': { padding: '10px 12px' },
        }),
        input: {
          height: 40,
          boxSizing: 'border-box',
          padding: '0 12px',
          '&.MuiInputBase-inputMultiline': { height: 'auto', padding: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: ({ theme }) => ({ borderColor: theme.palette.divider }) },
    },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.16) },
          },
        }),
      },
    },
  },
})

/** Stage colours for a vehicle's latest visit.
 *  Only the states that need a decision carry a hue: most rows in a real
 *  workshop are REPAIRING, so colouring them all would make colour noise. */
export const stageChipSx = (status: VisitStatus) => (t: Theme) =>
  ({
    NEW: { bgcolor: alpha(t.palette.text.primary, 0.06), color: t.palette.text.secondary },
    REPAIRING: { bgcolor: alpha(t.palette.text.primary, 0.08), color: t.palette.text.primary },
    READY: { bgcolor: alpha(t.palette.success.main, 0.16), color: t.palette.success.main },
    DELIVERED: {
      bgcolor: 'transparent',
      color: t.palette.text.disabled,
      border: `1px solid ${t.palette.divider}`,
    },
  })[status]
