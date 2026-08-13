// Add Vehicle — form with photo upload, registration search, contact picker
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, User, Phone, Hash } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Button,
  Input,
  Textarea,
  PhotoUpload,
  useToast,
  ToastContainer,
} from '@/components/ui'

// ── Form Schema ───────────────────────────────────────────────────────────────

const addVehicleSchema = z.object({
  registration_number: z
    .string()
    .min(1, 'Registration number is required')
    .max(20, 'Too long'),
  name: z.string().max(100, 'Too long').optional(),
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(100, 'Too long'),
  customer_phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .max(15, 'Too long'),
  complaint: z.string().max(500, 'Too long').optional(),
})

type AddVehicleForm = z.infer<typeof addVehicleSchema>

interface CreateVehicleResponse {
  vehicle: {
    id: string
  }
}

// ── Add Vehicle Page ──────────────────────────────────────────────────────────

export default function AddVehiclePage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [_photoFile, setPhotoFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddVehicleForm>({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      registration_number: '',
      name: '',
      customer_name: '',
      customer_phone: '',
      complaint: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: AddVehicleForm) => {
      let imageUrls: string[] = []
      
      if (_photoFile) {
        const presignRes = await apiFetch<{upload_url: string, file_key: string}>('/upload/presign', {
          method: 'POST',
          body: JSON.stringify({
            filename: _photoFile.name || 'photo.jpg',
            content_type: _photoFile.type || 'image/jpeg'
          }),
          tenantId: tenant?.id
        })
        
        const uploadRes = await fetch(presignRes.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': _photoFile.type || 'image/jpeg' },
          body: _photoFile
        })
        
        if (!uploadRes.ok) throw new Error('Failed to upload image')
        imageUrls.push(presignRes.file_key)
      }

      return apiFetch<CreateVehicleResponse>('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          registration_number: data.registration_number,
          name: data.name || null,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          complaint: data.complaint || null,
          image_urls: imageUrls,
        }),
        tenantId: tenant?.id,
      })
    },
    onSuccess: (res) => {
      showToast('success', 'Vehicle added successfully')
      // Navigate to vehicle details after a brief delay to show toast
      setTimeout(() => navigate(`/vehicles/${res.vehicle.id}`), 500)
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to add vehicle')
    },
  })

  const handlePhoto = useCallback((file: File) => {
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }, [])

  const handleRemovePhoto = useCallback(() => {
    setPhotoFile(null)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(null)
  }, [photoPreview])

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data)
  })

  return (
    <PageShell title="New Vehicle" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <form onSubmit={onSubmit} className="p-4 md:p-6 flex flex-col gap-5">
        {/* ── Photo Upload ───────────────────────────────────── */}
        <PhotoUpload
          id="vehicle-photo-upload"
          value={photoPreview}
          onChange={handlePhoto}
          onRemove={handleRemovePhoto}
          label="Vehicle Photo"
        />

        {/* ── Registration Number ────────────────────────────── */}
        <Input
          label="Registration Number"
          placeholder="e.g. OD 02 AB 1234"
          leftIcon={<Hash size={16} />}
          error={errors.registration_number?.message}
          required
          autoCapitalize="characters"
          {...register('registration_number')}
        />

        {/* ── Vehicle Name ───────────────────────────────────── */}
        <Input
          label="Vehicle Name"
          placeholder="e.g. Honda City, Splendor"
          leftIcon={<Camera size={16} />}
          error={errors.name?.message}
          {...register('name')}
        />

        {/* ── Customer Name ──────────────────────────────────── */}
        <Input
          label="Customer Name"
          placeholder="Customer's full name"
          leftIcon={<User size={16} />}
          error={errors.customer_name?.message}
          required
          {...register('customer_name')}
        />

        {/* ── Customer Phone ─────────────────────────────────── */}
        <Input
          label="Customer Phone"
          placeholder="10-digit phone number"
          type="tel"
          leftIcon={<Phone size={16} />}
          error={errors.customer_phone?.message}
          required
          {...register('customer_phone')}
        />

        {/* ── Complaint ──────────────────────────────────────── */}
        <Textarea
          label="Complaint"
          placeholder="What issue did the customer report?"
          error={errors.complaint?.message}
          rows={3}
          {...register('complaint')}
        />

        {/* ── Submit ─────────────────────────────────────────── */}
        <div className="pt-2 pb-4">
          <Button
            id="add-vehicle-submit"
            type="submit"
            isLoading={mutation.isPending}
            leftIcon={!mutation.isPending ? <Camera size={18} /> : undefined}
          >
            Save Vehicle
          </Button>
        </div>
      </form>
    </PageShell>
  )
}
