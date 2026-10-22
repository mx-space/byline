import { NestFactory } from '@nestjs/core'

import { initializeApp } from '~/global/index.global'

export async function runAppMigrations() {
  // initializeApp() must run before MigrationsAppModule's graph evaluates
  // ambient globals such as `isDev`; static imports would hoist past it.
  initializeApp()

  const [{ MigrationsAppModule }, { AppMigrationsService }] = await Promise.all(
    [import('~/migrations-app.module'), import('./app-migrations.service')],
  )

  const app = await NestFactory.createApplicationContext(MigrationsAppModule, {
    logger: ['error', 'warn', 'log'],
  })

  try {
    await app.get(AppMigrationsService).run()
  } finally {
    await app.close()
  }
}
