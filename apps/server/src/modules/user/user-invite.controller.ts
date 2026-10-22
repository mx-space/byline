import { Body, Get, Param, Post } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { HttpCache } from '~/common/decorators/cache.decorator'

import {
  type AcceptInviteDto,
  AcceptInviteSchema,
  type InviteTokenDto,
  InviteTokenSchema,
} from './user.schema'
import { UserInviteService } from './user-invite.service'

@ApiController('invites')
export class UserInviteController {
  constructor(private readonly inviteService: UserInviteService) {}

  @Get('/:token')
  @HttpCache({ disable: true })
  get(@Param({ schema: InviteTokenSchema }) params: InviteTokenDto) {
    return this.inviteService.getPublic(params.token)
  }

  @Post('/:token/accept')
  accept(
    @Param({ schema: InviteTokenSchema }) params: InviteTokenDto,
    @Body({ schema: AcceptInviteSchema }) body: AcceptInviteDto,
  ) {
    return this.inviteService.accept(params.token, body)
  }
}
