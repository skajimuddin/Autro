import { z } from 'zod'

/**
 * POST /vehicles — create vehicle + customer + first service visit in one call.
 * Matches columns across: vehicles, customers, service_visits, vehicle_images.
 *
 * `name` and `complaint` are `.nullish()`, not `.optional()`: the Add Vehicle
 * form submits `null` for a model or complaint the owner left blank, and
 * `.optional()` accepts `undefined` only — so every vehicle added without a
 * model was rejected with "Vehicle name is required" and every one added
 * without a complaint with "Expected string, received null".
 *
 * The web form derives its own resolver from this schema (see
 * pages/vehicles/add.tsx), so a field's rules are written once and both sides
 * enforce the same thing.
 */
export const CreateVehicleSchema = z.object({
  registration_number: z
    .string()
    .trim()
    .min(1, 'Registration number is required')
    .max(20, 'Registration number is too long')
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().max(100, 'Model is too long').nullish(),
  customer_name: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name is too long'),
  // Digits only, and the form's phone input strips anything else as it is
  // typed — so the value that reaches this regex is the value the owner sees.
  // Storing one normalised form is what lets POST /vehicles recognise a
  // returning customer by phone instead of creating a duplicate.
  customer_phone: z.string().regex(/^\d{10,15}$/, 'Enter a valid phone number (10–15 digits)'),
  complaint: z.string().trim().max(1000, 'Complaint is too long').nullish(),
  image_urls: z.array(z.string().url()).max(10).default([]),
})

/**
 * PATCH /visits/:id/status — move a visit through the repair stages.
 * Any stage may be set from any other: the detail screen's stepper lets an
 * owner correct a mis-tap by going back, which is not a workflow violation.
 */
export const UpdateVisitStatusSchema = z.object({
  status: z.enum(['NEW', 'REPAIRING', 'READY', 'DELIVERED']),
})

/**
 * POST /vehicles/:id/images — add a single photo to an existing vehicle.
 * The URL is the public object URL returned by POST /upload/presign.
 */
export const AddVehicleImageSchema = z.object({
  image_url: z.string().url('Must be a valid URL'),
})
