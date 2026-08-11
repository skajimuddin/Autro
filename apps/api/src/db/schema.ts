import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

// ── 1. users ─────────────────────────────────────────────────────────────────
// Global user table — not tenant-scoped.
// Created/updated on Google OAuth login.
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  google_id: text('google_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar_url: text('avatar_url'),
  created_at: text('created_at').notNull(), // ISO 8601
  updated_at: text('updated_at').notNull(), // ISO 8601
})

// ── 2. tenants ───────────────────────────────────────────────────────────────
// Each tenant = one garage/workshop.
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  owner_id: text('owner_id')
    .notNull()
    .references(() => users.id),
  phone: text('phone').notNull(),
  address: text('address'),
  logo_url: text('logo_url'), // R2 path
  latitude: real('latitude'), // Workshop GPS for attendance
  longitude: real('longitude'), // Workshop GPS for attendance
  gps_radius_meters: integer('gps_radius_meters').default(100), // Allowed check-in radius
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  deleted_at: text('deleted_at'), // Soft delete
})

// ── 3. tenant_members ────────────────────────────────────────────────────────
// Junction table — links users to tenants with roles.
// UNIQUE(tenant_id, user_id) — a user can't be in the same garage twice.
export const tenant_members = sqliteTable(
  'tenant_members',
  {
    id: text('id').primaryKey(), // UUID
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').notNull(), // 'OWNER' | 'STAFF'
    monthly_salary: real('monthly_salary'), // For staff only
    joined_at: text('joined_at').notNull(),
    removed_at: text('removed_at'), // Soft delete
  },
  (table) => ({
    unique_tenant_user: unique('unique_tenant_user').on(table.tenant_id, table.user_id),
  }),
)
