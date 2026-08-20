// Field — a labelled form control.
//
// The label sits above the control rather than floating inside it: these forms
// are filled on a phone, one-handed, and a floating label that has moved out
// of the way is one less thing on screen telling you what you are typing.
//
// Everything about the control itself (height, radius, border, focus) comes
// from the MuiOutlinedInput overrides in theme.ts, so this file only owns the
// label row, the helper line and the error wiring.
import type React from 'react'
import { Box, Stack, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material'

type FieldProps = Omit<TextFieldProps, 'label' | 'error' | 'helperText' | 'variant'> & {
  label: string
  /** Right-hand side of the label row — e.g. a "Pick from contacts" action. */
  labelAction?: React.ReactNode
  /** Validation message. Replaces `helper` and reddens the control. */
  error?: string
  /** Standing guidance, shown when there is no error. */
  helper?: string
}

export function Field({
  label,
  labelAction,
  error,
  helper,
  id,
  ...textFieldProps
}: FieldProps): React.JSX.Element {
  const message = error ?? helper

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 0.75 }}
      >
        <Typography
          component="label"
          htmlFor={id}
          sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}
        >
          {label}
        </Typography>
        {labelAction}
      </Stack>

      <TextField
        {...textFieldProps}
        id={id}
        fullWidth
        error={Boolean(error)}
        // The message lives outside the control so its presence doesn't
        // reserve a line of space under every field that has no guidance.
        helperText={undefined}
      />

      {message && (
        <Typography
          sx={{ fontSize: 11.5, mt: 0.625, color: error ? 'error.main' : 'text.disabled' }}
          role={error ? 'alert' : undefined}
        >
          {message}
        </Typography>
      )}
    </Box>
  )
}
