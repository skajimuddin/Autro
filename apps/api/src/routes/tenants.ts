import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, isNull } from 'drizzle-orm'
import { CreateTenantSchema, UpdateTenantSchema } from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { tenants, tenant_members } from '@/db/schema'

const tenantsRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── POST /tenants — Create garage (onboarding) ────────────────────────────────
// Creates the tenant + adds the calling user as OWNER in tenant_members.
// Requires: JWT (auth middleware applied in index.ts before this router).
tenantsRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = CreateTenantSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid request body',
        },
      },
      400,
    )
  }

  const userId = c.get('userId')
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  const tenantId = crypto.randomUUID()
  const memberId = crypto.randomUUID()

  // Create the tenant record
  await db.insert(tenants).values({
    id: tenantId,
    name: parsed.data.name,
    owner_id: userId,
    phone: parsed.data.phone,
    address: parsed.data.address ?? null,
    logo_url: parsed.data.logo_url ?? null,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    gps_radius_meters: 100,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  })

  // Add the creator as OWNER in tenant_members
  await db.insert(tenant_members).values({
    id: memberId,
    tenant_id: tenantId,
    user_id: userId,
    role: 'OWNER',
    monthly_salary: null,
    joined_at: now,
    removed_at: null,
  })

  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get()

  return c.json({ tenant }, 201)
})

// ── GET /tenants/mine — Get user's garage ─────────────────────────────────────
// Finds the tenant where the calling user is an active member.
// Returns 404 if the user has no garage yet (→ redirect to onboarding).
tenantsRouter.get('/mine', async (c) => {
  const userId = c.get('userId')
  const db = drizzle(c.env.DB)

  // Find user's active membership
  const membership = await db
    .select()
    .from(tenant_members)
    .where(and(eq(tenant_members.user_id, userId), isNull(tenant_members.removed_at)))
    .get()

  if (!membership) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'No garage found for this user' } }, 404)
  }

  // Fetch the tenant details (excluding soft-deleted)
  const tenant = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, membership.tenant_id), isNull(tenants.deleted_at)))
    .get()

  if (!tenant) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Garage not found' } }, 404)
  }

  return c.json({ tenant, role: membership.role })
})

// ── PATCH /tenants/:id — Update garage (owner only) ──────────────────────────
// Updates garage details. Only the OWNER can update.
// Requires: JWT + X-Tenant-ID (tenant middleware applied in index.ts).
tenantsRouter.patch('/:id', async (c) => {
  const tenantId = c.req.param('id')
  const userId = c.get('userId')
  const db = drizzle(c.env.DB)

  // Verify caller is the OWNER of this tenant
  const membership = await db
    .select()
    .from(tenant_members)
    .where(
      and(
        eq(tenant_members.tenant_id, tenantId),
        eq(tenant_members.user_id, userId),
        eq(tenant_members.role, 'OWNER'),
        isNull(tenant_members.removed_at),
      ),
    )
    .get()

  if (!membership) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Only the garage owner can update settings' } },
      403,
    )
  }

  const body = await c.req.json().catch(() => null)
  const parsed = UpdateTenantSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid request body',
        },
      },
      400,
    )
  }

  const now = new Date().toISOString()

  await db
    .update(tenants)
    .set({
      ...parsed.data,
      updated_at: now,
    })
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deleted_at)))

  const updatedTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .get()

  if (!updatedTenant) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Garage not found' } }, 404)
  }

  return c.json({ tenant: updatedTenant })
})

export default tenantsRouter
