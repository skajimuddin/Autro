import { z } from 'zod'

/**
 * POST /staff/invite — create invite link for a new staff member.
 * Matches staff_invites table columns.
 *
 * monthly_salary is nullable, not just optional: the column is nullable and the
 * form sends an explicit `null` when the (optional) salary field is left blank.
 * `.optional()` alone rejects null, which failed every invite without a salary.
 */
export const CreateStaffInviteSchema = z.object({
  name: z.string().min(1, 'Staff name is required').max(100),
  monthly_salary: z.number().min(0).nullable().optional(),
})

/**
 * PATCH /staff/:id — update staff member details.
 * Only salary is updatable via this endpoint.
 */
export const UpdateStaffSchema = z.object({
  monthly_salary: z.number().min(0),
})
