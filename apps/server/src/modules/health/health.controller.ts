import { Get } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { HttpCache } from '~/common/decorators/cache.decorator'
import { CurrentUser } from '~/common/decorators/current-user.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { OK_DATA } from '~/common/response/envelope.types'
import type { SessionUser } from '~/modules/auth/auth.types'
import { EmailService } from '~/processors/helper/helper.email.service'

@ApiController('health')
export class HealthController {
  constructor(private readonly emailService: EmailService) {}

  @Get('/')
  @HttpCache({ disable: true })
  async check() {
    return OK_DATA
  }

  @Get('/email/test')
  @Auth()
  async testEmail(@CurrentUser() user: SessionUser) {
    if (!user?.email) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'Current user has no email address',
      })
    }
    return this.emailService.sendTestEmail(user.email).catch((error) => {
      return {
        message: error.message,
        trace: error.stack,
      }
    })
  }
}
