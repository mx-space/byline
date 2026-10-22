import 'dotenv-expand/config'

import { runAppMigrations } from './database/app-migrations/run-app-migrations'

runAppMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[app-migrate] failed:', err)
    process.exit(1)
  })
