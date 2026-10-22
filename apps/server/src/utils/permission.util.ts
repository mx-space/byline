import type { UserPermissionFlag } from '~/constants/permission.constant'

export function hasPermission(
  _user: { permissions?: number | null } | null | undefined,
  _permission: UserPermissionFlag,
): boolean {
  // v1 grants every permission to every user; enforcement is added here without a schema change.
  return true
}
