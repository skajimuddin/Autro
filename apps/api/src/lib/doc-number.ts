// Running document numbers — invoice #1, #2, #3… per garage.
//
// MAX+1 rather than a counter column: a garage raises a handful of bills a
// day from one or two phones, and the (tenant_id, number) unique constraint
// turns the one-in-a-million simultaneous-create race into a failed request
// instead of two bills with the same number.
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, max } from 'drizzle-orm'
import { estimates, invoices } from '@/db/schema'

export async function nextDocNumber(
  db: DrizzleD1Database,
  kind: 'invoice' | 'estimate',
  tenantId: string,
): Promise<number> {
  const t = kind === 'invoice' ? invoices : estimates
  const row = await db.select({ n: max(t.number) }).from(t).where(eq(t.tenant_id, tenantId)).get()
  return (row?.n ?? 0) + 1
}
