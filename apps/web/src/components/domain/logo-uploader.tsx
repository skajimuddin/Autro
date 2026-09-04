// LogoUploader — pick, replace or remove the garage logo.
//
// Shared by onboarding (where it is optional — a new owner should not be
// blocked from creating their garage by a slow photo picker) and Settings →
// Garage (where it is the only place to add one after the fact). Both just
// hand it a value + onChange; the upload/compress/error handling lives here
// once instead of twice.
import { useRef, useState } from 'react'
import type React from 'react'
import { Avatar, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import UploadIcon from '@mui/icons-material/CloudUploadOutlined'
import CloseIcon from '@mui/icons-material/CloseRounded'
import StorefrontIcon from '@mui/icons-material/StorefrontOutlined'

import { uploadImage } from '@/lib/upload'

interface LogoUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  tenantId: string | undefined
  onError: (message: string) => void
}

export function LogoUploader({ value, onChange, tenantId, onError }: LogoUploaderProps): React.JSX.Element {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = (file: File | undefined): void => {
    if (!file) return
    setIsUploading(true)
    uploadImage(file, tenantId)
      .then(onChange)
      .catch((err: Error) => onError(err.message || 'Could not upload the logo'))
      .finally(() => setIsUploading(false))
  }

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Avatar
        variant="rounded"
        src={value ?? undefined}
        sx={(t) => ({
          width: 64,
          height: 64,
          borderRadius: 2.5,
          bgcolor: alpha(t.palette.primary.main, 0.1),
          color: 'primary.main',
        })}
      >
        <StorefrontIcon sx={{ fontSize: 26 }} />
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75 }}>Garage logo</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            id="logo-upload-btn"
            type="button"
            size="small"
            variant="outlined"
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={14} color="inherit" /> : <UploadIcon sx={{ fontSize: 16 }} />}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          </Button>
          {value && (
            <IconButton
              id="logo-remove-btn"
              size="small"
              aria-label="Remove logo"
              disabled={isUploading}
              onClick={() => onChange(null)}
              sx={{ color: 'text.disabled' }}
            >
              <CloseIcon sx={{ fontSize: 17 }} />
            </IconButton>
          )}
        </Stack>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.75, lineHeight: 1.5 }}>
          Shown in the app header and on every invoice/estimate PDF. Square images look best.
        </Typography>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </Stack>
  )
}
