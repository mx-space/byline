import { Get, UseInterceptors } from '@nestjs/common'
import dayjs from 'dayjs'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { PKG } from '~/utils/pkg.util'

import { HttpCache } from './common/decorators/cache.decorator'
import { RequirePermissions } from './common/decorators/permission.decorator'
import { AllowAllCorsInterceptor } from './common/interceptors/allow-all-cors.interceptor'
import { UserPermission } from './constants/permission.constant'
import { isDev } from './global/env.global'
import { RedisService } from './processors/redis/redis.service'

@ApiController()
export class AppController {
  constructor(private readonly redisService: RedisService) {}

  @Get('/uptime')
  @HttpCache.disable
  async getUptime() {
    const ts = (process.uptime() * 1000) | 0
    return {
      timestamp: ts,
      humanize: dayjs.duration(ts).locale('en').humanize(),
    }
  }

  @UseInterceptors(AllowAllCorsInterceptor)
  @Get(['/', '/info'])
  async appInfo() {
    return {
      name: PKG.name,
      author: PKG.author,
      version: isDev ? 'dev' : String(PKG.version),
      homepage: PKG.homepage,
      issues: PKG.issues,
    }
  }

  @Get('/ping')
  @UseInterceptors(AllowAllCorsInterceptor)
  ping(): 'pong' {
    return 'pong'
  }

  @Get('/clean_catch')
  @HttpCache.disable
  @Auth()
  @RequirePermissions(UserPermission.ManageSettings)
  async cleanCatch() {
    await this.redisService.cleanCatch()
  }

  @Get('/clean_redis')
  @HttpCache.disable
  @Auth()
  @RequirePermissions(UserPermission.ManageSettings)
  async cleanAllRedisKey() {
    await this.redisService.cleanAllRedisKey()
  }
}
