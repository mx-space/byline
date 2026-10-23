import type {
  DynamicModule,
  MiddlewareConsumer,
  NestModule,
  Type,
} from '@nestjs/common'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'

import { AppController } from './app.controller'
import { AppExceptionFilter } from './common/filters/app-exception.filter'
import { RolesGuard } from './common/guards/roles.guard'
import { SpiderGuard } from './common/guards/spider.guard'
import { ExtendThrottlerGuard } from './common/guards/throttler.guard'
import { HttpCacheInterceptor } from './common/interceptors/cache.interceptor'
import { DbQueryInterceptor } from './common/interceptors/db-query.interceptor'
import { IdempotenceInterceptor } from './common/interceptors/idempotence.interceptor'
import { PermissionsInterceptor } from './common/interceptors/permissions.interceptor'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { RequestContextMiddleware } from './common/middlewares/request-context.middleware'
import { AppMigrationsModule } from './database/app-migrations/app-migrations.module'
import { AiModule } from './modules/ai/ai.module'
import { AuthModule } from './modules/auth/auth.module'
import { CategoryModule } from './modules/category/category.module'
import { ConfigsModule } from './modules/configs/configs.module'
import { CronTaskModule } from './modules/cron-task/cron-task.module'
import { DraftModule } from './modules/draft/draft.module'
import { DynamicComponentModule } from './modules/dynamic-component/dynamic-component.module'
import { FileModule } from './modules/file/file.module'
import { HealthModule } from './modules/health/health.module'
import { HelperModule as BizHelperModule } from './modules/helper/helper.module'
import { InitModule } from './modules/init/init.module'
import { OptionModule } from './modules/option/option.module'
import { PostModule } from './modules/post/post.module'
import { PublishModule } from './modules/publish/publish.module'
import { ServerTimeModule } from './modules/server-time/server-time.module'
import { SlugTrackerModule } from './modules/slug-tracker/slug-tracker.module'
import { TaskModule } from './modules/task/task.module'
import { UserModule } from './modules/user/user.module'
import { WebhookModule } from './modules/webhook/webhook.module'
import { DatabaseModule } from './processors/database/database.module'
import { GatewayModule } from './processors/gateway/gateway.module'
import { HelperModule } from './processors/helper/helper.module'
import { PrettyLoggerModule } from './processors/logger/pretty-logger.module'
import { RedisModule } from './processors/redis/redis.module'
import { TaskQueueModule } from './processors/task-queue/task-queue.module'
import { SampleResponseInterceptor } from './shared/sample/sample-response.interceptor'

@Module({
  imports: [
    PrettyLoggerModule,
    DatabaseModule,
    AppMigrationsModule,
    RedisModule,
    TaskQueueModule,

    // biz module
    AiModule,
    AuthModule.forRoot(),
    BizHelperModule,
    CategoryModule,
    ConfigsModule,
    CronTaskModule,

    DraftModule,
    DynamicComponentModule,
    FileModule,
    HealthModule,
    OptionModule,
    PostModule,
    PublishModule,
    ServerTimeModule,
    SlugTrackerModule,
    TaskModule,
    UserModule,
    WebhookModule,

    // end biz

    GatewayModule,
    HelperModule,
  ].filter(Boolean) as Type<NestModule>[],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PermissionsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DbQueryInterceptor,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: SampleResponseInterceptor,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotenceInterceptor,
    },

    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: SpiderGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ExtendThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  static register(isInit: boolean): DynamicModule {
    return {
      module: AppModule,
      imports: [!isInit && InitModule].filter(Boolean) as Type<NestModule>[],
    }
  }
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*app')
  }
}
