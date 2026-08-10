import { z } from 'zod'

/**
 * Customer search query params — GET /customers?phone=X or ?name=X
 * Customers are created implicitly via POST /vehicles, not directly.
 */
export const CustomerSearchSchema = z.object({
  phone: z.string().optional(),
  name: z.string().optional(),
  cursor: z.string().optional(),
})
