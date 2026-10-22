import cluster from 'node:cluster'
import { performance } from 'node:perf_hooks'

import type { FastifyCorsOptions } from '@fastify/cors'
import { Logger } from '@innei/pretty-logger-nestjs'
import { NestFactory } from '@nestjs/core'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import pc from 'picocolors'

import { CROSS_DOMAIN, DEBUG_MODE, PORT } from './app.config'
import { AppModule } from './app.module'
import { registerAdminSpa } from './common/adapters/admin-spa.adapter'
import { fastifyApp } from './common/adapters/fastify.adapter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { requestCaseNormalizationPipeInstance } from './common/pipes/case-normalization.pipe'
import { standardSchemaValidationPipeInstance } from './common/zod'
import { AppMigrationsService } from './database/app-migrations/app-migrations.service'
import { logger } from './global/consola.global'
import { isDev, isMainProcess, isTest } from './global/env.global'
import { createWsAdapter } from './processors/gateway/ws/ws-adapter.factory'
import { checkInit } from './utils/check-init.util'
import { createHostMatcher, parseOriginHost } from './utils/cors.util'

const CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']

const allowAllCors: FastifyCorsOptions = {
  credentials: true,
  methods: CORS_METHODS,
  origin: (origin, callback) => callback(null, origin || ''),
}

const createAllowlistCors = (patterns: readonly string[]) => {
  const isAllowedHost = createHostMatcher(patterns)
  const options: FastifyCorsOptions = {
    delegator: (request, callback) => {
      const originHost = parseOriginHost(request.headers.origin)
      const allowed =
        !!originHost &&
        (originHost === request.headers.host || isAllowedHost(originHost))
      callback(null, {
        origin: allowed,
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
        methods: CORS_METHODS,
      })
    },
  }
  return options
}

export async function bootstrap() {
  const startedAt = performance.now()
  const isInit = await checkInit()
  const checkedAt = performance.now()

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(isInit),
    fastifyApp,
  )
  const createdAt = performance.now()

  // Replace NestJS built-in logger with our custom Logger
  app.useLogger(app.get(Logger))

  app.enableCors(
    isDev ? allowAllCors : createAllowlistCors(CROSS_DOMAIN.allowedOrigins),
  )

  if (isDev || DEBUG_MODE.logging) {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  app.useGlobalPipes(
    requestCaseNormalizationPipeInstance,
    standardSchemaValidationPipeInstance,
  )
  app.useWebSocketAdapter(createWsAdapter(app))
  registerAdminSpa(app)

  // Dev runs app-data migrations inline; prod boots them via the standalone
  // `app-migrate.ts` CLI invoked by docker `mx-migrate`. Both paths share the
  // same `AppMigrationsService` and respect the advisory lock + ledger, so
  // multiple cluster workers / replicas hitting this concurrently is safe.
  if (isDev && !isTest) {
    await app.get(AppMigrationsService).run()
  }
  const migratedAt = performance.now()
  await app.init()
  const initializedAt = performance.now()

  await app.listen(
    {
      host: '0.0.0.0',
      port: +PORT,
    },
    async () => {
      logger.info(
        `Startup phases: database=${Math.round(checkedAt - startedAt)}ms ` +
          `container=${Math.round(createdAt - checkedAt)}ms ` +
          `setup/migrations=${Math.round(migratedAt - createdAt)}ms ` +
          `app.init=${Math.round(initializedAt - migratedAt)}ms ` +
          `listen=${Math.round(performance.now() - initializedAt)}ms`,
      )
      logger.info('ENV:', process.env.NODE_ENV)
      const url = await app.getUrl()
      const pid = process.pid
      const env = cluster.isPrimary
      const prefix = env ? 'P' : 'W'
      if (!isMainProcess) {
        return
      }

      logger.success(`[${prefix + pid}] Server listen on: ${url}`)
      logger.info(`Server is up. ${pc.yellow(`+${performance.now() | 0}ms`)}`)

      // process.once: second Ctrl+C falls through to Node default for force-kill.
      const shutdown = async (signal: NodeJS.Signals) => {
        logger.info(`Received ${signal}, shutting down...`)
        try {
          await app.close()
        } catch (e) {
          logger.error('Error during shutdown:', e)
        }
        process.exit(0)
      }
      process.once('SIGINT', shutdown)
      process.once('SIGTERM', shutdown)
    },
  )
}
