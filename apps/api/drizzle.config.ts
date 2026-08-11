import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  // Schema file that defines all tables
  schema: './src/db/schema.ts',

  // Output directory for generated SQL migrations
  out: './drizzle',

  // SQLite dialect (Cloudflare D1 is SQLite-compatible)
  dialect: 'sqlite',

  // Driver for D1 (used only by drizzle-kit generate — not the runtime ORM)
  // At runtime, drizzle-orm uses the D1 binding from Wrangler directly.
  driver: 'd1-http',

  dbCredentials: {
    // These are only used by drizzle-kit for remote D1 operations.
    // For local migration generation, they can be empty placeholders.
    // Production values would be set via environment variables.
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID ?? '',
    token: process.env.CLOUDFLARE_D1_TOKEN ?? '',
  },
})
