import { Delete, Get, HttpCode, Param, Post } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { OK_DATA } from '~/common/response/envelope.types'
import { UserPermission } from '~/constants/permission.constant'

import { LobeHubFlowIdSchema } from './lobehub.schema'
import { LobeHubService } from './lobehub.service'
import { LobeHubViews } from './lobehub.views'

@ApiController('ai/providers/lobehub')
@Auth()
@RequirePermissions(UserPermission.ManageSettings)
export class LobeHubController {
  constructor(private readonly cloud: LobeHubService) {}

  @Post('device')
  @HttpCode(200)
  async start() {
    return LobeHubViews.login.parse(await this.cloud.startDeviceLogin())
  }

  @Post('device/:flowId')
  @HttpCode(200)
  async poll(@Param('flowId') flowId: string) {
    return LobeHubViews.poll.parse(
      await this.cloud.pollDeviceLogin(LobeHubFlowIdSchema.parse(flowId)),
    )
  }

  @Delete('device/:flowId')
  async cancel(@Param('flowId') flowId: string) {
    await this.cloud.cancelDeviceLogin(LobeHubFlowIdSchema.parse(flowId))
    return OK_DATA
  }

  @Get('account')
  async account() {
    return LobeHubViews.account.parse(await this.cloud.getAccount())
  }

  @Delete('session')
  async disconnect() {
    await this.cloud.disconnect()
    return OK_DATA
  }
}
