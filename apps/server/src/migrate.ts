import 'dotenv-expand/config'

import { runSchemaMigrations } from './database/run-schema-migrations'

async function main() {
  await runSchemaMigrations()
  // Loaded lazily so app.config's eager validation (SNOWFLAKE_WORKER_ID etc.)
  // only runs after the schema phase has succeeded.
  const { runAppMigrations } =
    await import('./database/app-migrations/run-app-migrations')
  await runAppMigrations()
}

main()
  .then(() => {
    // sharp's worker pool keeps the event loop alive after app.close(), which
    // would block `service_completed_successfully` in compose.
    process.exit(0)
  })
  .catch((err) => {
    console.error('[migrate] failed:', err)
    process.exit(1)
  })
