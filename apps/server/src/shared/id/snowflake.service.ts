import { Injectable, Logger } from '@nestjs/common'

import { SNOWFLAKE } from '~/app.config'
import { resolveSnowflakeWorkerId, SnowflakeGenerator } from '~/database/id'

export type { SnowflakeOptions } from '~/database/id'
export {
  resolveSnowflakeWorkerId,
  SNOWFLAKE_EPOCH_MS,
  SNOWFLAKE_WORKER_OFFSET_ENV,
  SnowflakeGenerator,
} from '~/database/id'

/**
 * Application-wide Nest provider. Constructed from SNOWFLAKE config.
 * Tests should prefer constructing SnowflakeGenerator directly.
 */
@Injectable()
export class SnowflakeService extends SnowflakeGenerator {
  private readonly nestLogger = new Logger(SnowflakeService.name)

  constructor() {
    const workerId = resolveSnowflakeWorkerId(SNOWFLAKE.workerId)
    super({
      workerId,
      epochMs: BigInt(SNOWFLAKE.epochMs),
    })
    this.nestLogger.log(
      `Snowflake worker ${workerId} ready (epoch ${SNOWFLAKE.epochMs})`,
    )
  }
}
