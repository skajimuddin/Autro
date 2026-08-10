import { z } from 'zod';

/**
 * POST /staff/invite — create invite link for a new staff member.
 * Matches staff_invites table columns.
 */
export const CreateStaffInviteSchema = z.object({
  name: z.string().min(1, 'Staff name is required').max(100),
  monthly_salary: z.number().min(0).optional(),
});

/**
 * PATCH /staff/:id — update staff member details.
 * Only salary is updatable via this endpoint.
 */
export const UpdateStaffSchema = z.object({
  monthly_salary: z.number().min(0),
});
