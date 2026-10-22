import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'

import { RequestContext } from '~/common/contexts/request.context'
import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { HttpCache } from '~/common/decorators/cache.decorator'
import { CurrentUser } from '~/common/decorators/current-user.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { withMeta } from '~/common/response/envelope.types'
import { MetaObjectBuilder } from '~/common/response/meta-builder'
import { UserPermission } from '~/constants/permission.constant'
import { type EntityIdDto, EntityIdSchema } from '~/shared/dto/id.dto'

import { AuthService } from '../auth/auth.service'
import type { SessionUser } from '../auth/auth.types'
import { ConfigsService } from '../configs/configs.service'
import {
  type CreateInviteDto,
  CreateInviteSchema,
  type CreateProfileOnlyUserDto,
  CreateProfileOnlyUserSchema,
  type UpdateUserDto,
  UpdateUserSchema,
  type UserListQueryDto,
  UserListQuerySchema,
} from './user.schema'
import { UserService } from './user.service'
import { UserInviteService } from './user-invite.service'

@ApiController('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly inviteService: UserInviteService,
    private readonly authService: AuthService,
    private readonly configsService: ConfigsService,
  ) {}

  @Get('/allow-login')
  @HttpCache({ disable: true })
  async allowLogin() {
    const { disablePasswordLogin } =
      await this.configsService.get('authSecurity')
    const [hasPasskey, oauthProviders, hasCredentialAccount] =
      await Promise.all([
        this.authService.hasPasskey(),
        this.authService.getOauthProviders(),
        this.authService.hasCredentialAccount(),
      ])

    return {
      password: hasCredentialAccount && !disablePasswordLogin,
      passkey: hasPasskey,
      ...Object.fromEntries(
        oauthProviders.map((provider) => [provider.toLowerCase(), true]),
      ),
    }
  }

  @Get('/check-logged')
  @HttpCache.disable
  checkLogged() {
    const hasAdminAccess = RequestContext.hasAdminAccess()
    return { ok: +hasAdminAccess, isGuest: !hasAdminAccess }
  }

  @Get('/me')
  @Auth()
  me(@CurrentUser() user: SessionUser) {
    return this.userService.getDetail(user.id)
  }

  @Patch('/me')
  @Auth()
  updateMe(
    @CurrentUser() user: SessionUser,
    @Body({ schema: UpdateUserSchema }) body: UpdateUserDto,
  ) {
    return this.userService.updateProfile(user.id, body)
  }

  @Get('/')
  @Auth()
  async list(@Query({ schema: UserListQuerySchema }) query: UserListQueryDto) {
    const result = await this.userService.list(query)
    return withMeta(
      result.data,
      new MetaObjectBuilder()
        .pagination({
          page: result.pagination.currentPage,
          size: result.pagination.size,
          total: result.pagination.total,
          totalPages: result.pagination.totalPage,
        })
        .build(),
    )
  }

  @Post('/profile-only')
  @Auth()
  @RequirePermissions(UserPermission.ManageUsers)
  createProfileOnly(
    @Body({ schema: CreateProfileOnlyUserSchema })
    body: CreateProfileOnlyUserDto,
  ) {
    return this.userService.createProfileOnly(body)
  }

  @Get('/invites')
  @Auth()
  listInvites() {
    return this.inviteService.list()
  }

  @Post('/invites')
  @Auth()
  @RequirePermissions(UserPermission.ManageUsers)
  createInvite(
    @CurrentUser() user: SessionUser,
    @Body({ schema: CreateInviteSchema }) body: CreateInviteDto,
  ) {
    return this.inviteService.create(body, {
      id: user.id,
      name: user.name ?? user.username ?? undefined,
    })
  }

  @Delete('/invites/:id')
  @Auth()
  @RequirePermissions(UserPermission.ManageUsers)
  async revokeInvite(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    await this.inviteService.revoke(params.id)
  }

  @Get('/:id')
  @Auth()
  get(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    return this.userService.getDetail(params.id)
  }

  @Patch('/:id')
  @Auth()
  @RequirePermissions(UserPermission.ManageUsers)
  update(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: UpdateUserSchema }) body: UpdateUserDto,
  ) {
    return this.userService.updateProfile(params.id, body, user.id)
  }

  @Post('/:id/deactivate')
  @Auth()
  @RequirePermissions(UserPermission.ManageUsers)
  deactivate(
    @CurrentUser() user: SessionUser,
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
  ) {
    return this.userService.deactivate(params.id, user.id)
  }

  @Post('/:id/reactivate')
  @Auth()
  @RequirePermissions(UserPermission.ManageUsers)
  reactivate(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    return this.userService.reactivate(params.id)
  }
}
