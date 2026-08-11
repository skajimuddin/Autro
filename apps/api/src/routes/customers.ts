import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, isNull, like } from 'drizzle-orm'
// No schema exported specifically for creating customers as they are implicit, but search schema is available
import type { Env, Variables } from '@/env'
import { customers } from '@/db/schema'

const customersRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /
customersRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const phone = c.req.query('phone')
  const name = c.req.query('name')
  const cursor = parseInt(c.req.query('cursor') || '0', 10)
  const limit = 20
  
  const db = drizzle(c.env.DB)
  
  let conditions = [
    eq(customers.tenant_id, tenantId),
    isNull(customers.deleted_at)
  ]
  
  if (phone) {
    conditions.push(like(customers.phone, `%${phone}%`))
  }
  if (name) {
    conditions.push(like(customers.name, `%${name}%`))
  }
  
  const results = await db.select().from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.created_at))
    .limit(limit + 1)
    .offset(cursor)
    
  const hasNextPage = results.length > limit
  const data = results.slice(0, limit)
  
  return c.json({
    customers: data,
    nextCursor: hasNextPage ? (cursor + limit).toString() : null
  })
})

export default customersRouter
