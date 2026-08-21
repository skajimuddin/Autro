// FullPageSpinner — what a route shows while its own data is still loading.
//
// Migrated 2026-08-20 onto MUI. This file used to hold a set of Tailwind
// skeletons; every screen now draws its own with MUI's <Skeleton> in the shape
// of the thing it is replacing, so only the whole-page case is shared.
import { Box, CircularProgress, Typography } from '@mui/material'

export function FullPageSpinner({ label }: { label?: string }): React.JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <CircularProgress size={32} thickness={4} />
      {label && <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>{label}</Typography>}
    </Box>
  )
}
