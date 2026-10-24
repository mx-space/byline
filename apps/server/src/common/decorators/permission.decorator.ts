import { SetMetadata } from '@nestjs/common'

import type { UserPermissionFlag } from '~/constants/permission.constant'

export const PERMISSIONS_METADATA = 'byline:required-permissions'

export function RequirePermissions(...permissions: UserPermissionFlag[]) {
  return SetMetadata(PERMISSIONS_METADATA, permissions)
}
