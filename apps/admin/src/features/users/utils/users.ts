import type { UserDetail } from '~/api/users'

export type UserStatus = 'active' | 'deactivated' | 'profileOnly'

export function getUserStatus(
  user: Pick<UserDetail, 'deactivatedAt' | 'isProfileOnly'>,
): UserStatus {
  if (user.deactivatedAt) return 'deactivated'
  if (user.isProfileOnly) return 'profileOnly'
  return 'active'
}

export function getUserDisplayName(
  user: Pick<UserDetail, 'displayName'> & { username?: string | null },
) {
  return user.displayName || user.username || '-'
}

export function getUserErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
