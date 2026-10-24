import { Get, HttpCode, Param, Post } from '@nestjs/common'
import { isString } from 'es-toolkit/compat'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { UserPermission } from '~/constants/permission.constant'

import { CronTaskService } from './cron-task.service'
import { CronTaskType, type CronTaskTypeValue } from './cron-task.types'

@ApiController('cron-task')
@Auth()
export class CronDefinitionController {
  constructor(private readonly cronTaskService: CronTaskService) {}

  @Get('/')
  async getCronDefinitions() {
    return this.cronTaskService.getCronDefinitions()
  }

  @Post('/run/:type')
  @HttpCode(200)
  @RequirePermissions(UserPermission.ManageSettings)
  async runCronTask(@Param('type') type: string) {
    if (!isString(type)) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'type must be string',
      })
    }

    const validTypes = Object.values(CronTaskType) as string[]
    if (!validTypes.includes(type)) {
      throw createAppException(AppErrorCode.CRON_NOT_FOUND, { extra: type })
    }

    return this.cronTaskService.createCronTask(type as CronTaskTypeValue)
  }
}
