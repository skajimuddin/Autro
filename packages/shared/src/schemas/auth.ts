import { z } from 'zod';

/**
 * Shape returned by GET /auth/google/callback
 */
export const AuthResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1),
    avatar_url: z.string().url().nullable(),
  }),
});

/**
 * POST /auth/refresh request body
 */
export const RefreshTokenSchema = z.object({
  token: z.string().min(1),
});
