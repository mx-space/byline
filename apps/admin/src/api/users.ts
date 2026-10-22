import type { PaginateResult } from '~/models/base'

import { deleteJson, getJson, patchJson, postJson } from './http'

export interface AuthorProfile {
  avatar: string | null
  bio: string | null
  displayName: string
  id: string
  url: string | null
}

export interface UserDetail extends AuthorProfile {
  createdAt: string
  deactivatedAt: string | null
  email: string | null
  isProfileOnly: boolean
  lastLoginAt: string | null
  permissions: number
  updatedAt: string | null
  username: string | null
}

export type UserStatusFilter = 'active' | 'all' | 'deactivated' | 'profile_only'

export interface UserProfileInput {
  avatar?: string | null
  bio?: string | null
  displayName?: string
  email?: string | null
  url?: string | null
  username?: string
}

export interface UserInvite {
  acceptedAt: string | null
  createdAt: string
  displayName: string | null
  email: string
  expiresAt: string
  id: string
  invitedBy: string | null
}

export interface CreatedUserInvite extends UserInvite {
  acceptUrl: string
  emailQueued: boolean
  token: string
}

export interface PublicInvite {
  displayName: string | null
  email: string
  expiresAt: string
}

export interface AcceptInviteInput {
  displayName?: string
  password: string
  username: string
}

export type AllowLoginResponse = {
  apple?: boolean
  github?: boolean
  google?: boolean
  passkey: boolean
  password: boolean
} & Record<string, boolean | undefined>

export interface LoggedStatus {
  isGuest?: boolean
  ok: boolean | number
}

export function getAllowLogin() {
  return getJson<AllowLoginResponse>('/users/allow-login')
}

export function checkLogged() {
  return getJson<LoggedStatus>('/users/check-logged')
}

export function getMe() {
  return getJson<UserDetail>('/users/me')
}

export function updateMe(data: UserProfileInput) {
  return patchJson<UserDetail, UserProfileInput>('/users/me', data)
}

export function getUsers(params: {
  page?: number
  search?: string
  size?: number
  status?: UserStatusFilter
}) {
  return getJson<PaginateResult<UserDetail>>('/users', {
    page: params.page,
    search: params.search || undefined,
    size: params.size,
    status: params.status,
  })
}

export function getUser(id: string) {
  return getJson<UserDetail>(`/users/${id}`)
}

export function updateUser(id: string, data: UserProfileInput) {
  return patchJson<UserDetail, UserProfileInput>(`/users/${id}`, data)
}

export function createProfileOnlyUser(
  data: UserProfileInput & { displayName: string },
) {
  return postJson<UserDetail, UserProfileInput>('/users/profile-only', data)
}

export function deactivateUser(id: string) {
  return postJson<UserDetail, Record<string, never>>(
    `/users/${id}/deactivate`,
    {},
  )
}

export function reactivateUser(id: string) {
  return postJson<UserDetail, Record<string, never>>(
    `/users/${id}/reactivate`,
    {},
  )
}

export function getInvites() {
  return getJson<UserInvite[]>('/users/invites')
}

export function createInvite(data: { displayName?: string; email: string }) {
  return postJson<CreatedUserInvite, typeof data>('/users/invites', data)
}

export function revokeInvite(id: string) {
  return deleteJson<void>(`/users/invites/${id}`)
}

export function getPublicInvite(token: string) {
  return getJson<PublicInvite>(`/invites/${encodeURIComponent(token)}`)
}

export function acceptInvite(token: string, data: AcceptInviteInput) {
  return postJson<UserDetail, AcceptInviteInput>(
    `/invites/${encodeURIComponent(token)}/accept`,
    data,
  )
}
