import { Body, Post } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { CurrentUser } from '~/common/decorators/current-user.decorator'
import type { SessionUser } from '~/modules/auth/auth.types'

import {
  type CreatePublishJobDto,
  CreatePublishJobSchema,
} from './publish.schema'
import { PublishService } from './publish.service'

@ApiController('publish-jobs')
@Auth()
export class PublishController {
  constructor(private readonly publishService: PublishService) {}

  @Post('/')
  create(
    @CurrentUser() user: SessionUser,
    @Body({ schema: CreatePublishJobSchema }) body: CreatePublishJobDto,
  ) {
    return this.publishService.create(body, user?.id)
  }
}
