import { index, integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

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
// Each tenant = one garage/autro.
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  owner_id: text('owner_id')
    .notNull()
    .references(() => users.id),
  phone: text('phone').notNull(),
  address: text('address'),
  logo_url: text('logo_url'), // R2 path
  latitude: real('latitude'), // Autro GPS for attendance
  longitude: real('longitude'), // Autro GPS for attendance
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
    idx_members_user: index('idx_members_user').on(table.user_id),
  }),
)

// ── 5. customers ─────────────────────────────────────────────────────────────
export const customers = sqliteTable(
  'customers',
  {
    id: text('id').primaryKey(), // UUID
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'), // Soft delete
  },
  (table) => ({
    unique_tenant_phone: unique('unique_tenant_phone').on(table.tenant_id, table.phone),
  }),
)

// ── 6. vehicles ──────────────────────────────────────────────────────────────
export const vehicles = sqliteTable(
  'vehicles',
  {
    id: text('id').primaryKey(), // UUID
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    customer_id: text('customer_id')
      .notNull()
      .references(() => customers.id),
    registration_number: text('registration_number').notNull(),
    name: text('name'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    deleted_at: text('deleted_at'), // Soft delete
  },
  (table) => ({
    unique_tenant_reg: unique('unique_tenant_reg').on(table.tenant_id, table.registration_number),
  }),
)

// ── 7. vehicle_images ────────────────────────────────────────────────────────
export const vehicle_images = sqliteTable('vehicle_images', {
  id: text('id').primaryKey(), // UUID
  tenant_id: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  vehicle_id: text('vehicle_id')
    .notNull()
    .references(() => vehicles.id),
  image_url: text('image_url').notNull(), // R2 path
  uploaded_at: text('uploaded_at').notNull(),
})

// ── 8. service_visits ────────────────────────────────────────────────────────
export const service_visits = sqliteTable(
  'service_visits',
  {
    id: text('id').primaryKey(), // UUID
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    vehicle_id: text('vehicle_id')
      .notNull()
      .references(() => vehicles.id),
    complaint: text('complaint'),
    status: text('status').notNull().default('NEW'), // 'NEW', 'REPAIRING', 'READY', 'DELIVERED'
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    delivered_at: text('delivered_at'),
    deleted_at: text('deleted_at'), // Soft delete
  },
  (table) => ({
    idx_visits_vehicle: index('idx_visits_vehicle').on(table.tenant_id, table.vehicle_id),
    idx_visits_status: index('idx_visits_status').on(table.tenant_id, table.status),
  }),
)

// ── 9. estimates ─────────────────────────────────────────────────────────────
export const estimates = sqliteTable(
  'estimates',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    visit_id: text('visit_id')
      .notNull()
      .references(() => service_visits.id),
    discount_type: text('discount_type'), // 'FLAT' | 'PERCENT'
    discount_value: real('discount_value').default(0),
    tax_enabled: integer('tax_enabled').default(0), // 0 = false, 1 = true
    tax_percent: real('tax_percent').default(0),
    notes: text('notes'),
    status: text('status').notNull().default('DRAFT'), // 'DRAFT', 'SENT', 'CONVERTED'
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  }
)

// ── 10. estimate_items ───────────────────────────────────────────────────────
export const estimate_items = sqliteTable(
  'estimate_items',
  {
    id: text('id').primaryKey(),
    estimate_id: text('estimate_id')
      .notNull()
      .references(() => estimates.id),
    description: text('description').notNull(),
    amount: real('amount').notNull(),
    quantity: integer('quantity').notNull().default(1),
    sort_order: integer('sort_order').notNull().default(0),
  }
)

// ── 11. invoices ─────────────────────────────────────────────────────────────
export const invoices = sqliteTable(
  'invoices',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    visit_id: text('visit_id')
      .notNull()
      .references(() => service_visits.id),
    estimate_id: text('estimate_id').references(() => estimates.id),
    discount_type: text('discount_type'), // 'FLAT' | 'PERCENT'
    discount_value: real('discount_value').default(0),
    tax_enabled: integer('tax_enabled').default(0),
    tax_percent: real('tax_percent').default(0),
    frozen_total: real('frozen_total').notNull(),
    payment_method: text('payment_method'), // 'CASH', 'UPI', 'CARD', 'OTHER'
    payment_status: text('payment_status').notNull().default('UNPAID'), // 'UNPAID', 'PAID'
    notes: text('notes'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    paid_at: text('paid_at'),
  },
  (table) => ({
    idx_invoices_payment: index('idx_invoices_payment').on(table.tenant_id, table.payment_status),
  })
)

// ── 12. invoice_items ────────────────────────────────────────────────────────
export const invoice_items = sqliteTable(
  'invoice_items',
  {
    id: text('id').primaryKey(),
    invoice_id: text('invoice_id')
      .notNull()
      .references(() => invoices.id),
    description: text('description').notNull(),
    amount: real('amount').notNull(),
    quantity: integer('quantity').notNull().default(1),
    sort_order: integer('sort_order').notNull().default(0),
  }
)

// ── 13. staff_invites ───────────────────────────────────────────────────────
export const staff_invites = sqliteTable(
  'staff_invites',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    invited_by: text('invited_by')
      .notNull()
      .references(() => users.id),
    token: text('token').notNull().unique(),
    name: text('name'),
    role: text('role').notNull().default('STAFF'),
    monthly_salary: real('monthly_salary'),
    status: text('status').notNull().default('PENDING'), // 'PENDING', 'ACCEPTED', 'REVOKED'
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => ({
    idx_staff_invites_token: index('idx_staff_invites_token').on(table.token),
  })
)

// ── 14. qr_codes ────────────────────────────────────────────────────────────
export const qr_codes = sqliteTable(
  'qr_codes',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .unique()
      .references(() => tenants.id),
    token: text('token').notNull().unique(),
    created_at: text('created_at').notNull(),
  }
)

// ── 15. attendance_logs ─────────────────────────────────────────────────────
export const attendance_logs = sqliteTable(
  'attendance_logs',
  {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    member_id: text('member_id')
      .notNull()
      .references(() => tenant_members.id),
    date: text('date').notNull(), // YYYY-MM-DD
    check_in_at: text('check_in_at'),
    check_out_at: text('check_out_at'),
    check_in_lat: real('check_in_lat'),
    check_in_lng: real('check_in_lng'),
    check_out_lat: real('check_out_lat'),
    check_out_lng: real('check_out_lng'),
    status: text('status').notNull().default('PRESENT'), // 'PRESENT', 'ABSENT'
  },
  (table) => ({
    unq_attendance: unique('unq_attendance').on(table.tenant_id, table.member_id, table.date),
    idx_attendance_date: index('idx_attendance_date').on(table.tenant_id, table.member_id, table.date),
  })
)


