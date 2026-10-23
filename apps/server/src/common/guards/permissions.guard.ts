import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AppErrorCode, createAppException } from '~/common/errors'
import type { UserPermissionFlag } from '~/constants/permission.constant'
import { getNestExecutionContextRequest } from '~/transformers/get-req.transformer'
import { hasPermission } from '~/utils/permission.util'

export const PERMISSIONS_METADATA = 'byline:required-permissions'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserPermissionFlag[]>(
      PERMISSIONS_METADATA,
      [context.getHandler(), context.getClass()],
    )
    if (!required?.length) return true
    const { user } = getNestExecutionContextRequest(context)
    if (!required.every((permission) => hasPermission(user, permission))) {
      throw createAppException(AppErrorCode.PERMISSION_DENIED)
    }
    return true
  }
}
