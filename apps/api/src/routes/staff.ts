import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, isNull, like } from 'drizzle-orm'
import { attendance_logs } from '@/db/schema'
import { CreateStaffInviteSchema, UpdateStaffSchema } from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { staff_invites, tenant_members, users, tenants } from '@/db/schema'

export const publicStaffRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /staff/invite/:token (Public)
publicStaffRouter.get('/invite/:token', async (c) => {
  const token = c.req.param('token')
  const db = drizzle(c.env.DB)
  
  const invite = await db.select({
    id: staff_invites.id,
    name: staff_invites.name,
    role: staff_invites.role,
    monthly_salary: staff_invites.monthly_salary,
    status: staff_invites.status,
    garage_name: tenants.name,
  })
  .from(staff_invites)
  .innerJoin(tenants, eq(staff_invites.tenant_id, tenants.id))
  .where(eq(staff_invites.token, token))
  .get()
  
  if (!invite) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invite not found' } }, 404)
  }
  
  return c.json({ invite })
})


export const staffRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /staff
staffRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)
  
  const staffQuery = await db.select({
    id: tenant_members.id,
    user_id: tenant_members.user_id,
    role: tenant_members.role,
    monthly_salary: tenant_members.monthly_salary,
    joined_at: tenant_members.joined_at,
    user_name: users.name,
    user_email: users.email,
    avatar_url: users.avatar_url,
  })
  .from(tenant_members)
  .innerJoin(users, eq(tenant_members.user_id, users.id))
  .where(and(
    eq(tenant_members.tenant_id, tenantId),
    isNull(tenant_members.removed_at)
  ))
  .all()
  
  const today = new Date().toISOString().slice(0, 10)
  const logs = await db.select().from(attendance_logs).where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.date, today)
  )).all()

  const staff = staffQuery.map(member => {
    const log = logs.find(l => l.member_id === member.id)
    return {
      id: member.id,
      user_id: member.user_id,
      name: member.user_name,
      email: member.user_email,
      avatar_url: member.avatar_url,
      role: member.role,
      monthly_salary: member.monthly_salary,
      attendance_status: log ? log.status : 'NOT_YET',
      check_in_at: log ? log.check_in_at : null,
    }
  })
  
  return c.json({ staff })
})

// POST /staff/invite
staffRouter.post('/invite', async (c) => {
  const tenantId = c.get('tenantId')
  const userId = c.get('userId')
  
  const body = await c.req.json().catch(() => null)
  const parsed = CreateStaffInviteSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  const token = crypto.randomUUID().replace(/-/g, '')
  
  await db.insert(staff_invites).values({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    invited_by: userId,
    token: token,
    name: parsed.data.name,
    role: 'STAFF',
    monthly_salary: parsed.data.monthly_salary ?? null,
    status: 'PENDING',
    created_at: now,
    updated_at: now,
  })
  
  return c.json({ invite_url: `/invite/${token}` }, 201)
})

// (Removed leftover empty accept route since it was moved to acceptInviteRouter)

// GET /staff/:id
staffRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const memberId = c.req.param('id')
  const db = drizzle(c.env.DB)
  
  const member = await db.select({
    id: tenant_members.id,
    user_id: tenant_members.user_id,
    role: tenant_members.role,
    monthly_salary: tenant_members.monthly_salary,
    joined_at: tenant_members.joined_at,
    user_name: users.name,
    user_email: users.email,
    avatar_url: users.avatar_url,
  })
  .from(tenant_members)
  .innerJoin(users, eq(tenant_members.user_id, users.id))
  .where(and(
    eq(tenant_members.tenant_id, tenantId),
    eq(tenant_members.id, memberId),
    isNull(tenant_members.removed_at)
  ))
  .get()
  
  if (!member) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Staff not found' } }, 404)
  }
  
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const currentMonth = todayStr.slice(0, 7) // YYYY-MM
  
  const logs = await db.select().from(attendance_logs).where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.member_id, memberId),
    like(attendance_logs.date, `${currentMonth}-%`)
  )).all()

  let present_days = 0
  let absent_days = 0
  let check_in_at = null
  let check_out_at = null

  for (const log of logs) {
    if (log.status === 'PRESENT') present_days++
    if (log.status === 'ABSENT') absent_days++
    if (log.date === todayStr) {
      check_in_at = log.check_in_at
      check_out_at = log.check_out_at
    }
  }

  // Use days in the current month as total working days
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const total_working_days = new Date(year, month, 0).getDate()

  return c.json({
    id: member.id,
    user_id: member.user_id,
    name: member.user_name,
    email: member.user_email,
    avatar_url: member.avatar_url,
    role: member.role,
    monthly_salary: member.monthly_salary,
    check_in_at,
    check_out_at,
    present_days,
    absent_days,
    total_working_days,
  })
})

// PATCH /staff/:id
staffRouter.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const memberId = c.req.param('id')
  
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateStaffSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  
  const member = await db.select().from(tenant_members).where(and(
    eq(tenant_members.tenant_id, tenantId),
    eq(tenant_members.id, memberId),
    isNull(tenant_members.removed_at)
  )).get()
  
  if (!member) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Staff not found' } }, 404)
  }
  
  await db.update(tenant_members).set({
    monthly_salary: parsed.data.monthly_salary
  }).where(eq(tenant_members.id, memberId))
  
  return c.json({ success: true })
})

// DELETE /staff/:id
staffRouter.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const memberId = c.req.param('id')
  
  const db = drizzle(c.env.DB)
  
  const member = await db.select().from(tenant_members).where(and(
    eq(tenant_members.tenant_id, tenantId),
    eq(tenant_members.id, memberId),
    isNull(tenant_members.removed_at)
  )).get()
  
  if (!member) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Staff not found' } }, 404)
  }
  
  // Can't remove the owner
  if (member.role === 'OWNER') {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Cannot remove the owner' } }, 403)
  }
  
  await db.update(tenant_members).set({
    removed_at: new Date().toISOString()
  }).where(eq(tenant_members.id, memberId))
  
  return c.json({ success: true })
})

// PATCH /staff/invite/:id/revoke
staffRouter.patch('/invite/:id/revoke', async (c) => {
  const tenantId = c.get('tenantId')
  const inviteId = c.req.param('id')
  
  const db = drizzle(c.env.DB)
  
  const invite = await db.select().from(staff_invites).where(and(
    eq(staff_invites.tenant_id, tenantId),
    eq(staff_invites.id, inviteId)
  )).get()
  
  if (!invite) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invite not found' } }, 404)
  }
  
  await db.update(staff_invites).set({
    status: 'REVOKED',
    updated_at: new Date().toISOString()
  }).where(eq(staff_invites.id, inviteId))
  
  return c.json({ success: true })
})

export const acceptInviteRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// POST /staff/invite/:token/accept
// Requires Auth, but NO Tenant ID required.
acceptInviteRouter.post('/invite/:token/accept', async (c) => {
  const userId = c.get('userId')
  const token = c.req.param('token')
  
  const db = drizzle(c.env.DB)
  
  const invite = await db.select().from(staff_invites).where(eq(staff_invites.token, token)).get()
  
  if (!invite) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invite not found' } }, 404)
  }
  
  if (invite.status !== 'PENDING') {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invite is no longer pending' } }, 400)
  }
  
  // Check if already a member
  const existing = await db.select().from(tenant_members).where(and(
    eq(tenant_members.tenant_id, invite.tenant_id),
    eq(tenant_members.user_id, userId)
  )).get()
  
  const now = new Date().toISOString()
  
  await db.transaction(async (tx) => {
    if (existing) {
      if (existing.removed_at) {
        // Re-join
        await tx.update(tenant_members).set({
          removed_at: null,
          role: invite.role,
          monthly_salary: invite.monthly_salary,
        }).where(eq(tenant_members.id, existing.id))
      }
    } else {
      // Create new member
      await tx.insert(tenant_members).values({
        id: crypto.randomUUID(),
        tenant_id: invite.tenant_id,
        user_id: userId,
        role: invite.role,
        monthly_salary: invite.monthly_salary,
        joined_at: now,
      })
    }
    
    await tx.update(staff_invites).set({
      status: 'ACCEPTED',
      updated_at: now
    }).where(eq(staff_invites.id, invite.id))
  })
  
  return c.json({ success: true, tenant_id: invite.tenant_id })
})
