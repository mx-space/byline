import { rm } from 'node:fs/promises'

import { Injectable, Logger } from '@nestjs/common'
import dayjs from 'dayjs'
import { mkdirp } from 'mkdirp'

import { RedisKeys } from '~/constants/cache.constant'
import { STATIC_FILE_TRASH_DIR, TEMP_DIR } from '~/constants/path.constant'
import type { StoreJWTPayload } from '~/processors/helper/helper.jwt.service'
import { JWTService } from '~/processors/helper/helper.jwt.service'
import { RedisService } from '~/processors/redis/redis.service'
import { getRedisKey } from '~/utils/redis.util'

/**
 * CronBusinessService - Business logic layer for cron tasks.
 *
 * This service only holds business method implementations invoked by
 * CronTaskService. Scheduling logic lives in CronTaskScheduler.
 */
@Injectable()
export class CronBusinessService {
  private logger: Logger
  constructor(private readonly redisService: RedisService) {
    this.logger = new Logger(CronBusinessService.name)
  }

  /**
   * Clean up the temporary file directory.
   */
  async cleanTempDirectory() {
    await rm(TEMP_DIR, { recursive: true })
    mkdirp.sync(STATIC_FILE_TRASH_DIR)
    this.logger.log('--> Temporary files cleaned up successfully')
    return { success: true }
  }

  /**
   * Scan the store and delete expired JWTs.
   */
  async deleteExpiredJWT() {
    this.logger.log('--> Scanning the store to purge expired tokens')
    const redis = this.redisService.getClient()
    const storeKey = getRedisKey(RedisKeys.JWTStore)
    const keys = await redis.hkeys(storeKey)
    const results = await Promise.all(
      keys.map(async (key) => {
        const value = await redis.hget(storeKey, key)
        if (!value) return 0
        const parsed = JSON.safeParse(value) as StoreJWTPayload
        if (!parsed) return 0

        const date = dayjs(new Date(parsed.date))
        if (date.add(JWTService.expiresDay, 'd').diff(new Date(), 'd') >= 0) {
          return 0
        }

        this.logger.debug(
          `--> Deleting expired token: ${key}, issued at ${date.format('YYYY-MM-DD H:mm:ss')}`,
        )
        await redis.hdel(storeKey, key)
        return 1
      }),
    )
    const deleteCount = results.reduce((a, b) => a + b, 0)

    this.logger.log(`--> Deleted ${deleteCount} expired tokens`)
    return { deletedCount: deleteCount }
  }
}
