import { Global, Module } from '@nestjs/common'

import { PostModule } from '~/modules/post/post.module'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import { DatabaseService } from './database.service'
import { PostgresPoolLifecycle, postgresProviders } from './postgres.provider'

@Module({
  imports: [PostModule],
  providers: [
    DatabaseService,
    ...postgresProviders,
    PostgresPoolLifecycle,
    SnowflakeService,
  ],
  exports: [DatabaseService, ...postgresProviders, SnowflakeService],
})
@Global()
export class DatabaseModule {}
