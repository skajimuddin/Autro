import { z } from 'zod';

/**
 * POST /vehicles — create vehicle + customer + first service visit in one call.
 * Matches columns across: vehicles, customers, service_visits, vehicle_images tables.
 */
export const CreateVehicleSchema = z.object({
  registration_number: z
    .string()
    .min(1, 'Registration number is required')
    .max(20)
    .transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1, 'Vehicle name is required').max(100),
  customer_name: z.string().min(1, 'Customer name is required').max(100),
  customer_phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15)
    .regex(/^\d+$/, 'Phone must contain only digits'),
  complaint: z.string().max(1000).optional(),
  image_urls: z.array(z.string().url()).max(10).default([]),
});

/**
 * PATCH /vehicles/:id — update vehicle details.
 * All fields optional.
 */
export const UpdateVehicleSchema = z.object({
  registration_number: z
    .string()
    .min(1)
    .max(20)
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  name: z.string().min(1).max(100).optional(),
});

/**
 * POST /vehicles/:id/visits — new service visit for returning vehicle.
 */
export const CreateVisitSchema = z.object({
  complaint: z.string().max(1000).optional(),
  image_urls: z.array(z.string().url()).max(10).default([]),
});

/**
 * PATCH /visits/:id/status — update service visit status.
 */
export const UpdateVisitStatusSchema = z.object({
  status: z.enum(['NEW', 'REPAIRING', 'READY', 'DELIVERED']),
});

/**
 * POST /vehicles/:id/images — add a single photo to existing vehicle.
 */
export const AddVehicleImageSchema = z.object({
  image_url: z.string().url('Must be a valid URL'),
});
