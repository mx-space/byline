import { Global, Module } from '@nestjs/common'

import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'
import { UserInviteController } from './user-invite.controller'
import { UserInviteRepository } from './user-invite.repository'
import { UserInviteService } from './user-invite.service'

@Global()
@Module({
  controllers: [UserController, UserInviteController],
  providers: [
    UserService,
    UserRepository,
    UserInviteService,
    UserInviteRepository,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
