import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Ledger for runtime app-data migrations (data backfills, runtime transforms).
 *
 * Distinct from `__drizzle_migrations` (DDL ledger owned by drizzle-kit). One
 * row per applied migration; presence means the migration has run on this
 * database. Each migration's `up()` must be idempotent — the runner uses this
 * ledger only to skip work on re-runs.
 */
export const appMigrations = pgTable('_app_migrations', {
  id: text('id').primaryKey(),
  appliedAt: timestamp('applied_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  durationMs: integer('duration_ms'),
})
