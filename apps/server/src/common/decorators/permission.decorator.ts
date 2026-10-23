import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'

import type { UserPermissionFlag } from '~/constants/permission.constant'

import { AuthGuard } from '../guards/auth.guard'
import {
  PERMISSIONS_METADATA,
  PermissionsGuard,
} from '../guards/permissions.guard'

// Guards from stacked decorators run bottom-up, so a separate @Auth() above
// this would run after the permission check; authenticating here keeps the order.
export function RequirePermissions(...permissions: UserPermissionFlag[]) {
  return applyDecorators(
    SetMetadata(PERMISSIONS_METADATA, permissions),
    UseGuards(AuthGuard, PermissionsGuard),
  )
}
