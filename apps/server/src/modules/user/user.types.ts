import type { PermissionPreset } from '~/constants/permission.constant'

export interface UserRow {
  id: string
  email: string | null
  emailVerified: boolean
  username: string | null
  handle: string | null
  displayName: string | null
  avatar: string | null
  bio: string | null
  url: string | null
  permissions: number
  isProfileOnly: boolean
  deactivatedAt: Date | null
  createdAt: Date
  updatedAt: Date | null
  lastLoginAt?: Date | null
}

export type UserStatusFilter = 'all' | 'active' | 'deactivated' | 'profile_only'

export interface UserListParams {
  page?: number
  size?: number
  search?: string
  status?: UserStatusFilter
  role?: UserRoleFilter
}

export type UserRoleFilter = PermissionPreset | 'custom'

export interface UserCreateInput {
  id: string
  email?: string | null
  emailVerified?: boolean
  username?: string | null
  displayName?: string | null
  avatar?: string | null
  bio?: string | null
  url?: string | null
  isProfileOnly?: boolean
  permissions?: number
}

export interface UserProfilePatch {
  email?: string | null
  username?: string | null
  displayName?: string | null
  avatar?: string | null
  bio?: string | null
  url?: string | null
}

export interface PublicUserProfile {
  id: string
  displayName: string
  avatar: string | null
  bio: string | null
  url: string | null
}

export interface UserInviteRow {
  id: string
  email: string
  displayName: string | null
  invitedBy: string | null
  expiresAt: Date
  acceptedAt: Date | null
  acceptedUserId: string | null
  userId: string | null
  permissions: number | null
  createdAt: Date
}

export const isUserActive = (
  user: Pick<UserRow, 'isProfileOnly' | 'deactivatedAt'> | null | undefined,
): boolean => !!user && !user.isProfileOnly && !user.deactivatedAt

export const toPublicProfile = (
  user: Pick<
    UserRow,
    'id' | 'displayName' | 'username' | 'avatar' | 'bio' | 'url'
  >,
): PublicUserProfile => ({
  id: user.id,
  displayName: user.displayName || user.username || '',
  avatar: user.avatar,
  bio: user.bio,
  url: user.url,
})
