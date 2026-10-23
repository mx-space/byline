import { ApiRequestError } from '~/api/http'
import type { UserDetail, UserStatusFilter } from '~/api/users'
import { translate } from '~/i18n/translate'
import type { TranslationKey } from '~/i18n/types'

export const EMPTY_VALUE = '--'

export type UserStatus = 'active' | 'deactivated' | 'profileOnly'

const USER_ERROR_MESSAGE_KEYS: Record<string, TranslationKey> = {
  USER_CONFLICT: 'users.error.conflict',
  USER_IDENTITY_LOCKED: 'users.error.identityLocked',
}

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
  return user.displayName?.trim() || user.username?.trim() || EMPTY_VALUE
}

export function showValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || EMPTY_VALUE
}

export function parseUserStatusFilter(value: string | null): UserStatusFilter {
  if (
    value === 'active' ||
    value === 'all' ||
    value === 'deactivated' ||
    value === 'profile_only'
  ) {
    return value
  }
  return 'all'
}

export function bylinePlace(
  authors: { id: string }[] | undefined,
  userId: string,
) {
  if (!authors?.length) return null
  const index = authors.findIndex((author) => author.id === userId)
  return index < 0 ? null : index + 1
}

export function formatAdminTime(value: string | null | undefined) {
  if (!value) return EMPTY_VALUE
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function canEditSignInIdentity(
  user: Pick<UserDetail, 'id' | 'isProfileOnly'>,
  currentUserId: string | null,
) {
  return user.isProfileOnly || user.id === currentUserId
}

const CONFLICT_MESSAGE_KEYS: Record<UserConflictField, TranslationKey> = {
  email: 'users.error.emailTaken',
  username: 'users.error.usernameTaken',
}

export type UserConflictField = 'email' | 'username'

export function getUserConflictField(error: unknown): UserConflictField | null {
  if (!(error instanceof ApiRequestError) || error.code !== 'USER_CONFLICT') {
    return null
  }
  const field = error.details?.field
  return field === 'email' || field === 'username' ? field : null
}

export function getUserErrorMessage(error: unknown, fallback: string) {
  const conflict = getUserConflictField(error)
  if (conflict) return translate(CONFLICT_MESSAGE_KEYS[conflict])
  if (error instanceof ApiRequestError && typeof error.code === 'string') {
    const key = USER_ERROR_MESSAGE_KEYS[error.code]
    if (key) return translate(key)
  }
  return error instanceof Error && error.message ? error.message : fallback
}

export type InviteRequest =
  | { email: string; kind: 'existing'; userId: string }
  | { displayName: string | undefined; email: string; kind: 'new' }

export function buildInviteRequest(input: {
  displayName: string
  email: string
  linkedAuthorId: string
}): InviteRequest {
  const email = input.email.trim()
  if (input.linkedAuthorId) {
    return { email, kind: 'existing', userId: input.linkedAuthorId }
  }
  return {
    displayName: input.displayName.trim() || undefined,
    email,
    kind: 'new',
  }
}
