import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, isNull, like, desc } from 'drizzle-orm'
import { CheckInSchema, CheckOutSchema, MonthlyAttendanceQuerySchema } from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { qr_codes, attendance_logs, tenants, tenant_members, users } from '@/db/schema'

const attendanceRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

// GET /attendance/qr
attendanceRouter.get('/qr', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)
  
  let qr = await db.select().from(qr_codes).where(eq(qr_codes.tenant_id, tenantId)).get()
  
  if (!qr) {
    // Generate one if it doesn't exist
    const token = crypto.randomUUID().replace(/-/g, '')
    await db.insert(qr_codes).values({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      token,
      created_at: new Date().toISOString()
    })
    qr = await db.select().from(qr_codes).where(eq(qr_codes.tenant_id, tenantId)).get()
  }
  
  return c.json({ qr_token: qr?.token })
})

// POST /attendance/qr/regenerate
attendanceRouter.post('/qr/regenerate', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)
  
  const token = crypto.randomUUID().replace(/-/g, '')
  const existing = await db.select().from(qr_codes).where(eq(qr_codes.tenant_id, tenantId)).get()
  
  if (existing) {
    await db.update(qr_codes).set({
      token,
      created_at: new Date().toISOString()
    }).where(eq(qr_codes.tenant_id, tenantId))
  } else {
    await db.insert(qr_codes).values({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      token,
      created_at: new Date().toISOString()
    })
  }
  
  return c.json({ qr_token: token })
})

// POST /attendance/checkin
attendanceRouter.post('/checkin', async (c) => {
  const tenantId = c.get('tenantId')
  const userId = c.get('userId')
  
  const body = await c.req.json().catch(() => null)
  const parsed = CheckInSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  
  // Verify token
  const qr = await db.select().from(qr_codes).where(eq(qr_codes.tenant_id, tenantId)).get()
  if (!qr || qr.token !== parsed.data.qr_token) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid or expired QR code' } }, 400)
  }
  
  // Verify tenant member
  const member = await db.select().from(tenant_members).where(and(
    eq(tenant_members.tenant_id, tenantId),
    eq(tenant_members.user_id, userId),
    isNull(tenant_members.removed_at)
  )).get()
  
  if (!member) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not a member of this garage' } }, 403)
  }
  
  // Check if already checked in today
  const today = getTodayString()
  const existing = await db.select().from(attendance_logs).where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.member_id, member.id),
    eq(attendance_logs.date, today)
  )).get()
  
  if (existing) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Already checked in today' } }, 400)
  }
  
  // Verify GPS
  const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
  if (tenant && tenant.latitude && tenant.longitude && tenant.gps_radius_meters) {
    const dist = getDistanceFromLatLonInM(parsed.data.latitude, parsed.data.longitude, tenant.latitude, tenant.longitude)
    if (dist > tenant.gps_radius_meters) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'You are not at the workshop' } }, 403)
    }
  }
  
  await db.insert(attendance_logs).values({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    member_id: member.id,
    date: today,
    check_in_at: new Date().toISOString(),
    check_in_lat: parsed.data.latitude,
    check_in_lng: parsed.data.longitude,
    status: 'PRESENT',
  })
  
  return c.json({ success: true })
})

// POST /attendance/checkout
attendanceRouter.post('/checkout', async (c) => {
  const tenantId = c.get('tenantId')
  const userId = c.get('userId')
  
  const body = await c.req.json().catch(() => null)
  const parsed = CheckOutSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  
  // Verify tenant member
  const member = await db.select().from(tenant_members).where(and(
    eq(tenant_members.tenant_id, tenantId),
    eq(tenant_members.user_id, userId),
    isNull(tenant_members.removed_at)
  )).get()
  
  if (!member) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not a member of this garage' } }, 403)
  }
  
  const today = getTodayString()
  const existing = await db.select().from(attendance_logs).where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.member_id, member.id),
    eq(attendance_logs.date, today)
  )).get()
  
  if (!existing) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Not checked in today' } }, 400)
  }
  
  await db.update(attendance_logs).set({
    check_out_at: new Date().toISOString(),
    check_out_lat: parsed.data.latitude,
    check_out_lng: parsed.data.longitude,
  }).where(eq(attendance_logs.id, existing.id))
  
  return c.json({ success: true })
})

// GET /attendance/today
attendanceRouter.get('/today', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)
  
  const today = getTodayString()
  
  const logs = await db.select({
    id: attendance_logs.id,
    member_id: attendance_logs.member_id,
    check_in_at: attendance_logs.check_in_at,
    check_out_at: attendance_logs.check_out_at,
    status: attendance_logs.status,
    name: users.name,
    avatar_url: users.avatar_url,
    role: tenant_members.role,
  })
  .from(attendance_logs)
  .innerJoin(tenant_members, eq(attendance_logs.member_id, tenant_members.id))
  .innerJoin(users, eq(tenant_members.user_id, users.id))
  .where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.date, today)
  ))
  .all()
  
  let present = 0
  let absent = 0
  const entries = logs.map(log => {
    if (log.status === 'PRESENT') present++
    if (log.status === 'ABSENT') absent++
    return {
      member_id: log.member_id,
      name: log.name,
      avatar_url: log.avatar_url,
      check_in_at: log.check_in_at,
      check_out_at: log.check_out_at,
      status: log.status
    }
  })
  
  return c.json({ present, absent, entries })
})

// GET /attendance/my-today
attendanceRouter.get('/my-today', async (c) => {
  const tenantId = c.get('tenantId')
  const userId = c.get('userId')
  const db = drizzle(c.env.DB)
  
  const member = await db.select().from(tenant_members).where(and(
    eq(tenant_members.tenant_id, tenantId),
    eq(tenant_members.user_id, userId),
    isNull(tenant_members.removed_at)
  )).get()
  
  if (!member) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Not a member of this garage' } }, 403)
  }
  
  const today = getTodayString()
  const log = await db.select().from(attendance_logs).where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.member_id, member.id),
    eq(attendance_logs.date, today)
  )).get()
  
  if (!log) {
    return c.json({
      check_in_at: null,
      check_out_at: null,
      status: null,
    })
  }

  return c.json({
    check_in_at: log.check_in_at,
    check_out_at: log.check_out_at,
    status: log.status,
  })
})

// GET /attendance/monthly
attendanceRouter.get('/monthly', async (c) => {
  const tenantId = c.get('tenantId')
  
  // Hono get query params as object for safeParse
  const member_id = c.req.query('member_id')
  const month = c.req.query('month')
  
  // Note: if member_id is optional for current user, we should handle it
  // Wait, frontend calls: `/attendance/monthly?month=${month}` without member_id in my-today.
  // We need to extract member_id from auth if not provided!
  const userId = c.get('userId')
  const db = drizzle(c.env.DB)

  let targetMemberId = member_id
  if (!targetMemberId) {
    const member = await db.select().from(tenant_members).where(and(
      eq(tenant_members.tenant_id, tenantId),
      eq(tenant_members.user_id, userId),
      isNull(tenant_members.removed_at)
    )).get()
    if (!member) return c.json({ error: { code: 'FORBIDDEN', message: 'Not a member' } }, 403)
    targetMemberId = member.id
  }

  // we can manually validate or just use safeParse on what we have
  const parsed = MonthlyAttendanceQuerySchema.safeParse({ member_id: targetMemberId, month })
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const logs = await db.select().from(attendance_logs).where(and(
    eq(attendance_logs.tenant_id, tenantId),
    eq(attendance_logs.member_id, parsed.data.member_id),
    like(attendance_logs.date, `${parsed.data.month}-%`)
  )).orderBy(desc(attendance_logs.date)).all()
  
  let present = 0
  let absent = 0
  for (const log of logs) {
    if (log.status === 'PRESENT') present++
    if (log.status === 'ABSENT') absent++
  }

  return c.json({ present, absent })
})

export default attendanceRouter
