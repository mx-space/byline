import type { UserPermissionFlag } from '~/constants/permission.constant'

export function hasPermission(
  user: { permissions?: number | null } | null | undefined,
  permission: UserPermissionFlag,
): boolean {
  return ((user?.permissions ?? 0) & permission) === permission
}
