import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { PERMISSIONS_METADATA } from '~/common/decorators/permission.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import type { UserPermissionFlag } from '~/constants/permission.constant'
import {
  getNestExecutionContextRequest,
  isHttpExecutionContext,
} from '~/transformers/get-req.transformer'
import { hasPermission } from '~/utils/permission.util'

@Injectable()
export class PermissionsInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (!isHttpExecutionContext(context)) return next.handle()
    const required = this.reflector.getAllAndOverride<UserPermissionFlag[]>(
      PERMISSIONS_METADATA,
      [context.getHandler(), context.getClass()],
    )
    if (!required?.length) return next.handle()
    const { user } = getNestExecutionContextRequest(context)
    if (!user) throw createAppException(AppErrorCode.AUTH_NOT_LOGGED_IN)
    if (!required.every((permission) => hasPermission(user, permission))) {
      throw createAppException(AppErrorCode.PERMISSION_DENIED)
    }
    return next.handle()
  }
}
