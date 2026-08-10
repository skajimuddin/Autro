import { z } from 'zod'

/**
 * POST /tenants — create garage (onboarding)
 * Matches columns in the `tenants` table.
 */
export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Garage name is required').max(100),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15)
    .regex(/^\d+$/, 'Phone must contain only digits'),
  address: z.string().max(300).optional(),
  logo_url: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

/**
 * PATCH /tenants/:id — update garage (settings page)
 * All fields optional — only send what changed.
 */
export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(15).regex(/^\d+$/, 'Phone must contain only digits').optional(),
  address: z.string().max(300).optional(),
  logo_url: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  gps_radius_meters: z.number().int().min(10).max(5000).optional(),
})
