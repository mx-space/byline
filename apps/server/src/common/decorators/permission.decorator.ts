import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'

import type { UserPermissionFlag } from '~/constants/permission.constant'

import {
  PERMISSIONS_METADATA,
  PermissionsGuard,
} from '../guards/permissions.guard'

export function RequirePermissions(...permissions: UserPermissionFlag[]) {
  return applyDecorators(
    SetMetadata(PERMISSIONS_METADATA, permissions),
    UseGuards(PermissionsGuard),
  )
}
