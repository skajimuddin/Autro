import { z } from 'zod';

/**
 * POST /attendance/checkin — staff check-in via QR + GPS.
 * Server verifies:
 *   1. qr_token matches the garage's active QR code
 *   2. GPS distance <= garage.gps_radius_meters (Haversine formula)
 */
export const CheckInSchema = z.object({
  qr_token: z.string().min(1, 'QR token is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * POST /attendance/checkout — staff check-out via GPS.
 * GPS recorded but not verified against radius on checkout.
 */
export const CheckOutSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * GET /attendance/monthly query params — monthly report for a staff member.
 */
export const MonthlyAttendanceQuerySchema = z.object({
  member_id: z.string().uuid('member_id must be a UUID'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
});
