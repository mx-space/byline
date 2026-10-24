import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { BypassCaseTransform } from '~/common/decorators/bypass-case-transform.decorator'
import { HttpCache } from '~/common/decorators/cache.decorator'
import { CurrentUser } from '~/common/decorators/current-user.decorator'
import { RequirePermissions } from '~/common/decorators/permission.decorator'
import { UserPermission } from '~/constants/permission.constant'
import { type EntityIdDto, EntityIdSchema } from '~/shared/dto/id.dto'

import type { SessionUser } from '../auth/auth.types'
import {
  type RegisterDynamicComponentDto,
  RegisterDynamicComponentSchema,
  type UpdateDynamicComponentDto,
  UpdateDynamicComponentSchema,
} from './dynamic-component.schema'
import { DynamicComponentService } from './dynamic-component.service'

const CATALOG_FREEFORM_PATHS = ['components[].propsSchema']

@ApiController('dynamic-components')
export class DynamicComponentController {
  constructor(private readonly service: DynamicComponentService) {}

  @Get('/')
  @HttpCache.disable
  @BypassCaseTransform(CATALOG_FREEFORM_PATHS)
  getCatalog() {
    return this.service.getCatalog()
  }

  @Post('/')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  @BypassCaseTransform(CATALOG_FREEFORM_PATHS)
  register(
    @CurrentUser() user: SessionUser,
    @Body({ schema: RegisterDynamicComponentSchema })
    body: RegisterDynamicComponentDto,
  ) {
    return this.service.register(body, user?.id ?? null)
  }

  @Patch('/:id')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  @BypassCaseTransform(CATALOG_FREEFORM_PATHS)
  update(
    @Param({ schema: EntityIdSchema }) { id }: EntityIdDto,
    @Body({ schema: UpdateDynamicComponentSchema })
    body: UpdateDynamicComponentDto,
  ) {
    return this.service.update(id, body)
  }

  @Delete('/:id')
  @Auth()
  @RequirePermissions(UserPermission.EditPost)
  @BypassCaseTransform(CATALOG_FREEFORM_PATHS)
  remove(@Param({ schema: EntityIdSchema }) { id }: EntityIdDto) {
    return this.service.remove(id)
  }
}
