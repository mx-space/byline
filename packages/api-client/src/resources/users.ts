import type { HttpCore } from '../http'
import type {
  AcceptInviteInput,
  AllowLoginResult,
  CreatedInvite,
  InitUserInput,
  Invite,
  PaginatedMeta,
  ProfileOnlyUserInput,
  PublicInvite,
  UserDetail,
  UserListQuery,
  UserProfileInput,
} from '../types'

export class UsersResource {
  constructor(private readonly http: HttpCore) {}

  allowLogin() {
    return this.http.request<AllowLoginResult>('GET', '/users/allow-login')
  }

  checkLogged() {
    return this.http.request<{ ok: 0 | 1; isGuest: boolean }>(
      'GET',
      '/users/check-logged',
    )
  }

  me() {
    return this.http.request<UserDetail>('GET', '/users/me')
  }

  updateMe(input: UserProfileInput) {
    return this.http.request<UserDetail>('PATCH', '/users/me', { body: input })
  }

  list(query: UserListQuery = {}) {
    return this.http.request<UserDetail[], PaginatedMeta>('GET', '/users', {
      query: { ...query },
    })
  }

  async listAll(query: Omit<UserListQuery, 'page' | 'size'> = {}) {
    const users: UserDetail[] = []
    for (let page = 1; ; page++) {
      const { data, meta } = await this.list({ ...query, page, size: 100 })
      users.push(...data)
      if (!meta || page >= meta.pagination.totalPages || !data.length) break
    }
    return users
  }

  get(id: string) {
    return this.http.request<UserDetail>('GET', `/users/${id}`)
  }

  update(id: string, input: UserProfileInput) {
    return this.http.request<UserDetail>('PATCH', `/users/${id}`, {
      body: input,
    })
  }

  createProfileOnly(input: ProfileOnlyUserInput) {
    return this.http.request<UserDetail>('POST', '/users/profile-only', {
      body: input,
    })
  }

  deactivate(id: string) {
    return this.http.request<UserDetail>('POST', `/users/${id}/deactivate`)
  }

  reactivate(id: string) {
    return this.http.request<UserDetail>('POST', `/users/${id}/reactivate`)
  }

  initFirstUser(input: InitUserInput) {
    return this.http.request<unknown>('POST', '/init/user', { body: input })
  }
}

export class InvitesResource {
  constructor(private readonly http: HttpCore) {}

  list() {
    return this.http.request<Invite[]>('GET', '/users/invites')
  }

  create(input: { email: string; displayName?: string }) {
    return this.http.request<CreatedInvite>('POST', '/users/invites', {
      body: input,
    })
  }

  revoke(id: string) {
    return this.http.request<void>('DELETE', `/users/invites/${id}`)
  }

  get(token: string) {
    return this.http.request<PublicInvite>(
      'GET',
      `/invites/${encodeURIComponent(token)}`,
    )
  }

  accept(token: string, input: AcceptInviteInput) {
    return this.http.request<UserDetail>(
      'POST',
      `/invites/${encodeURIComponent(token)}/accept`,
      { body: input },
    )
  }
}
