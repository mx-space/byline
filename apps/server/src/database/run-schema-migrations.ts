/* eslint-disable no-console */
import path from 'node:path'

import pkg from 'pg'

import {
  SCHEMA_MIGRATION_LOCK_KEY,
  withAdvisoryLock,
} from '~/processors/database/postgres.lock'
import { runSchemaMigrationFiles } from '~/processors/database/schema-migrator'

const { Pool } = pkg

function parseInt32(input: string | undefined, fallback: number): number {
  if (input === undefined || input === null || input === '') return fallback
  const n = Number(input)
  if (!Number.isInteger(n) || n <= 0) return fallback
  return n
}

function parseBoolish(v: string | undefined): boolean {
  if (!v) return false
  return ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
}

function resolvePgConfig() {
  const connectionString =
    process.env.PG_URL || process.env.PG_CONNECTION_STRING
  return {
    connectionString,
    host: process.env.PG_HOST || '127.0.0.1',
    port: parseInt32(process.env.PG_PORT, 5432),
    user: process.env.PG_USER || 'mx',
    password: process.env.PG_PASSWORD || 'mx',
    database: process.env.PG_DATABASE || 'byline',
    ssl: parseBoolish(process.env.PG_SSL)
      ? { rejectUnauthorized: false }
      : false,
  } as const
}

function resolveMigrationsFolder(): string {
  return process.env.MIGRATIONS_DIR
    ? path.resolve(process.env.MIGRATIONS_DIR)
    : path.resolve(process.cwd(), 'src', 'database', 'migrations')
}

export async function runSchemaMigrations() {
  const cfg = resolvePgConfig()
  const pool = new Pool({
    connectionString: cfg.connectionString,
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    max: 2,
    ssl: cfg.ssl,
  })

  pool.on('error', (err) => {
    console.error('[migrate] pool error:', err)
  })

  const migrationsFolder = resolveMigrationsFolder()

  const target = cfg.connectionString
    ? cfg.connectionString.replace(/:[^/:@]+@/, ':***@')
    : `${cfg.host}:${cfg.port}/${cfg.database}`
  console.log(`[migrate] schema target=${target}`)
  console.log(`[migrate] schema folder=${migrationsFolder}`)
  const start = Date.now()
  try {
    await withAdvisoryLock(pool, SCHEMA_MIGRATION_LOCK_KEY, async () => {
      await runSchemaMigrationFiles(pool, migrationsFolder)
    })
    console.log(`[migrate] schema done in ${Date.now() - start}ms`)
  } finally {
    await pool.end()
  }
}
