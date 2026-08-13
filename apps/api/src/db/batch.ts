import type { BatchItem } from 'drizzle-orm/batch'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

/** A single pending write (insert/update/delete) that can go into a D1 batch. */
export type D1Write = BatchItem<'sqlite'>

/**
 * Runs a set of writes atomically on D1.
 *
 * Why this exists: Cloudflare D1 rejects the SQL `BEGIN TRANSACTION` and
 * `SAVEPOINT` statements that drizzle's `db.transaction()` emits, so calling
 * `db.transaction()` fails at runtime with:
 *
 *   D1_ERROR: To execute a transaction, please use the state.storage.transaction()
 *   … APIs instead of the SQL BEGIN TRANSACTION or SAVEPOINT statements.
 *
 * `db.batch()` is D1's actual atomic primitive — every statement commits or
 * none do. Its signature demands a non-empty tuple, which is awkward when the
 * statement list is assembled conditionally, so this takes a plain array.
 *
 * Note the one real constraint versus a transaction: a batch is a fixed list of
 * statements, so any read the writes depend on must happen *before* the batch.
 * You cannot branch on a query result mid-batch.
 */
export async function runBatch(
  db: DrizzleD1Database<Record<string, never>>,
  writes: D1Write[],
): Promise<void> {
  if (writes.length === 0) return
  await db.batch(writes as [D1Write, ...D1Write[]])
}
