// Add vehicle — opens a new visit for a car arriving at the shop.
//
// Rebuilt 2026-08-20 on the dashboard's design system.
//
// The form validates with CreateVehicleSchema itself (minus image_urls, which
// the form doesn't collect — the photo is uploaded on submit). It used to
// carry a private copy of the rules, and the two had drifted far enough that
// the screen was broken: the local copy made the model optional and sent
// `null` for a blank model or complaint, while the server's copy demanded a
// string. Adding a vehicle without a model, or without a complaint, failed.
// Deriving the resolver from the shared schema is what keeps that fixed.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import type { Control, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, ButtonBase, CircularProgress, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CameraIcon from '@mui/icons-material/CameraAltOutlined'
import CloseIcon from '@mui/icons-material/CloseRounded'
import { CreateVehicleSchema } from '@autro/shared'
import type { z } from 'zod'

import { apiFetch } from '@/lib/api'
import { uploadVehiclePhoto } from '@/lib/upload'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Field } from '@/components/ui/field'
import { Kicker } from '@/components/ui/kicker'
import { SectionCard } from '@/components/ui/section-card'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { ContactPicker } from '@/components/domain/contact-picker'
import { VehicleSearch } from '@/components/domain/vehicle-search'

// ── Form contract ─────────────────────────────────────────────────────────────

/** The API contract minus the one field the form doesn't collect. */
const AddVehicleSchema = CreateVehicleSchema.omit({ image_urls: true })

/** What the fields hold while being typed (before the schema's transforms). */
type AddVehicleInput = z.input<typeof AddVehicleSchema>
/** What a valid submit produces — plate upper-cased, strings trimmed. */
type AddVehicleValues = z.output<typeof AddVehicleSchema>

interface CreateVehicleResponse {
  vehicle: { id: string }
}

/** Everything the phone keypad and a paste from Contacts can add to a number. */
const digitsOnly = (value: string): string => value.replace(/\D/g, '')

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AddVehiclePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null)

  const { control, handleSubmit, setValue, watch } = useForm<
    AddVehicleInput,
    unknown,
    AddVehicleValues
  >({
    resolver: zodResolver(AddVehicleSchema),
    defaultValues: {
      registration_number: '',
      name: '',
      customer_name: '',
      customer_phone: '',
      complaint: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: AddVehicleValues) => {
      // Uploaded first: a vehicle saved without its photo would need the owner
      // to notice and go add it from the detail screen.
      const imageUrls = photo ? [await uploadVehiclePhoto(photo.file, tenant?.id)] : []

      return apiFetch<CreateVehicleResponse>('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          // Blank is "not recorded", not an empty model or an empty complaint.
          name: data.name || null,
          complaint: data.complaint || null,
          image_urls: imageUrls,
        }),
        tenantId: tenant?.id,
      })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // `replace` so Back from the vehicle goes to where the owner came from,
      // not into a filled-in form that would add the car a second time.
      navigate(`/vehicles/${res.vehicle.id}`, { replace: true })
    },
    onError: (err: Error) => showToast('error', err.message || 'Could not add the vehicle'),
  })

  const registration = watch('registration_number') ?? ''

  const submit = handleSubmit((data) => mutation.mutate(data))

  // Rendered twice — once in the desktop action row, once in the mobile bar —
  // so it takes its id rather than duplicating one across both.
  const saveButton = (id: string): React.JSX.Element => (
    <Button
      id={id}
      type="submit"
      variant="contained"
      disabled={mutation.isPending}
      startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
    >
      {mutation.isPending ? 'Saving…' : 'Save vehicle'}
    </Button>
  )

  return (
    <PageShell
      title="Add vehicle"
      subtitle="Opens a new visit for this vehicle"
      mobileSubtitle="Opens a new visit"
      showBack
      hideNav
      mobileAction={null}
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box
        component="form"
        onSubmit={submit}
        noValidate
        // Clears the fixed save bar on mobile; there is no bar at md:+.
        sx={{ px: { xs: 2, md: 3.5 }, pb: { xs: 12, md: 4 } }}
      >
        <Stack spacing={2}>
          {/* ── Vehicle ─────────────────────────────────────────────── */}
          <SectionCard padded>
            <Kicker>Vehicle</Kicker>
            <Stack spacing={2} sx={{ mt: 1.75 }}>
              <Box>
                <FormField
                  control={control}
                  name="registration_number"
                  label="Registration number"
                  placeholder="MH12AB1234"
                  autoComplete="off"
                  // CreateVehicleSchema upper-cases the plate on submit; doing
                  // it per keystroke means the field shows what will be saved.
                  sanitize={(value) => value.toUpperCase()}
                />
                <VehicleSearch
                  query={registration}
                  tenantId={tenant?.id}
                  onSelect={(match) => {
                    const fill = { shouldValidate: true, shouldDirty: true }
                    setValue('registration_number', match.registration_number, fill)
                    setValue('name', match.name ?? '', fill)
                    setValue('customer_name', match.customer_name, fill)
                    setValue('customer_phone', digitsOnly(match.customer_phone), fill)
                  }}
                />
              </Box>

              <FormField
                control={control}
                name="name"
                label="Model"
                placeholder="Maruti Swift (optional)"
              />
            </Stack>
          </SectionCard>

          {/* ── Customer ────────────────────────────────────────────── */}
          <SectionCard padded>
            <Kicker>Customer</Kicker>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
                mt: 1.75,
              }}
            >
              <FormField
                control={control}
                name="customer_name"
                label="Name"
                placeholder="Rakesh Patil"
                autoComplete="name"
                labelAction={
                  <ContactPicker
                    onSelect={(contact) => {
                      const fill = { shouldValidate: true, shouldDirty: true }
                      if (contact.name) setValue('customer_name', contact.name, fill)
                      if (contact.phone) setValue('customer_phone', digitsOnly(contact.phone), fill)
                    }}
                  />
                }
              />

              {/* Strips everything that isn't a digit as it is typed, so what
                  the owner sees is exactly what the schema validates and what
                  the API stores — and what a returning customer is matched on. */}
              <FormField
                control={control}
                name="customer_phone"
                label="Phone number"
                placeholder="9876543210"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                sanitize={digitsOnly}
              />
            </Box>
          </SectionCard>

          {/* ── Job ─────────────────────────────────────────────────── */}
          <SectionCard padded>
            <Kicker>Job</Kicker>
            <Box sx={{ mt: 1.75 }}>
              <FormField
                control={control}
                name="complaint"
                label="Complaint"
                placeholder="What is the customer reporting?"
                multiline
                minRows={3}
                helper="Shows on the dashboard and the vehicle list, so keep it short."
              />
            </Box>
          </SectionCard>

          {/* ── Photo ───────────────────────────────────────────────── */}
          <SectionCard padded>
            <Kicker>Photo</Kicker>
            <Box sx={{ mt: 1.75 }}>
              <PhotoPicker
                preview={photo?.preview ?? null}
                onPick={(file) => {
                  if (photo) URL.revokeObjectURL(photo.preview)
                  setPhoto({ file, preview: URL.createObjectURL(file) })
                }}
                onClear={() => {
                  if (photo) URL.revokeObjectURL(photo.preview)
                  setPhoto(null)
                }}
              />
            </Box>
          </SectionCard>

          {/* ── Actions (desktop) ───────────────────────────────────── */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1.25}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ borderColor: 'divider', color: 'text.primary' }}
            >
              Cancel
            </Button>
            {saveButton('add-vehicle-submit')}
          </Stack>
        </Stack>

        {/* ── Actions (mobile) ──────────────────────────────────────── */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            px: 2,
            pt: 1.5,
            pb: 'max(env(safe-area-inset-bottom, 0px), 12px)',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            '& > *': { flex: 1 },
          }}
        >
          {saveButton('add-vehicle-submit-mobile')}
        </Box>
      </Box>
    </PageShell>
  )
}

// ── Fields ────────────────────────────────────────────────────────────────────

type FormFieldProps = Omit<
  React.ComponentProps<typeof Field>,
  'error' | 'value' | 'onChange' | 'onBlur' | 'name' | 'id'
> & {
  control: Control<AddVehicleInput, unknown, AddVehicleValues>
  name: Path<AddVehicleInput>
  /** Rewrites each keystroke before it is stored — see the phone field. */
  sanitize?: (value: string) => string
}

/**
 * One form field, bound through Controller.
 *
 * Controller rather than register(): register's ref lands on MUI's root
 * element rather than the input inside it, so setValue() would update the
 * form's state without updating what is on screen — and this form fills
 * itself from a matched vehicle and from the contact picker.
 */
function FormField({ control, name, sanitize, ...props }: FormFieldProps): React.JSX.Element {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          {...props}
          {...field}
          id={name}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(sanitize ? sanitize(e.target.value) : e.target.value)}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

// ── Photo ─────────────────────────────────────────────────────────────────────

interface PhotoPickerProps {
  preview: string | null
  onPick: (file: File) => void
  onClear: () => void
}

function PhotoPicker({ preview, onPick, onClear }: PhotoPickerProps): React.JSX.Element {
  if (preview) {
    return (
      <Box sx={{ position: 'relative', width: 'fit-content' }}>
        <Box
          component="img"
          src={preview}
          alt="Vehicle"
          sx={{
            width: 160,
            height: 120,
            objectFit: 'cover',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
        />
        <ButtonBase
          aria-label="Remove photo"
          onClick={onClear}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: 'rgba(0,0,0,.55)',
            color: '#fff',
          }}
        >
          <CloseIcon sx={{ fontSize: 15 }} />
        </ButtonBase>
      </Box>
    )
  }

  return (
    <Box component="label" sx={{ display: 'block', cursor: 'pointer' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1.25}
        sx={{
          height: 112,
          borderRadius: 1,
          border: '1.5px dashed',
          borderColor: 'divider',
          color: 'text.disabled',
          '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
        }}
      >
        <CameraIcon sx={{ fontSize: 22 }} />
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.secondary' }}>
            Add a photo
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
            Camera or file · one photo
          </Typography>
        </Box>
      </Stack>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ''
        }}
      />
    </Box>
  )
}
