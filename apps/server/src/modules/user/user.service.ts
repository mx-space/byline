import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { hashPassword } from 'better-auth/crypto'

import { AppErrorCode, createAppException } from '~/common/errors'
import { EventBusEvents } from '~/constants/event-bus.constant'
import { ApiCacheService } from '~/processors/redis/api-cache.service'
import { SnowflakeService } from '~/shared/id/snowflake.service'
import { getAvatar } from '~/utils/tool.util'

import { UserRepository } from './user.repository'
import type {
  CreateFirstUserDto,
  CreateProfileOnlyUserDto,
  UpdateUserDto,
  UserListQueryDto,
} from './user.schema'
import {
  type PublicUserProfile,
  toPublicProfile,
  type UserCreateInput,
  type UserRow,
} from './user.types'
import { UserViews } from './user.views'

const isUniqueViolation = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  (error as { code?: unknown }).code === '23505'

// Another user rewriting a sign-in email would let them reset that account's
// password through the mailbox they now control.
const changesSignInIdentity = (existing: UserRow, dto: UpdateUserDto) => {
  const emailChanged =
    dto.email !== undefined &&
    (dto.email?.toLowerCase() ?? null) !==
      (existing.email?.toLowerCase() ?? null)
  const usernameChanged =
    dto.username !== undefined &&
    dto.username !== (existing.username?.toLowerCase() ?? null)
  return emailChanged || usernameChanged
}

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly snowflakeService: SnowflakeService,
    private readonly apiCache: ApiCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  toDetail(row: UserRow) {
    return UserViews.detail.parse({
      ...toPublicProfile(row),
      email: row.email,
      username: row.username,
      permissions: row.permissions,
      isProfileOnly: row.isProfileOnly,
      deactivatedAt: row.deactivatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastLoginAt: row.lastLoginAt ?? null,
    })
  }

  async list(query: UserListQueryDto) {
    const result = await this.userRepository.list(query)
    return {
      data: result.data.map((row) => this.toDetail(row)),
      pagination: result.pagination,
    }
  }

  toAuthor(row: UserRow) {
    return UserViews.author.parse({
      ...toPublicProfile(row),
      username: row.username,
    })
  }

  async listAuthors(query: { page: number; size: number }) {
    const result = await this.userRepository.listPublicAuthors(query)
    return {
      data: result.data.map((row) => this.toAuthor(row)),
      pagination: result.pagination,
    }
  }

  async getAuthor(idOrUsername: string) {
    const row = await this.userRepository.findPublicAuthor(idOrUsername)
    if (!row) {
      throw createAppException(AppErrorCode.USER_NOT_FOUND, {
        id: idOrUsername,
      })
    }
    return this.toAuthor(row)
  }

  async getDetail(id: string) {
    const row = await this.userRepository.findByIdDetailed(id)
    if (!row) throw createAppException(AppErrorCode.USER_NOT_FOUND, { id })
    return this.toDetail(row)
  }

  findById(id: string) {
    return this.userRepository.findById(id)
  }

  findByIds(ids: string[]) {
    return this.userRepository.findByIds(ids)
  }

  async getPublicProfiles(
    ids: string[],
  ): Promise<Map<string, PublicUserProfile>> {
    const rows = await this.userRepository.findByIds(ids)
    return new Map(rows.map((row) => [row.id, toPublicProfile(row)]))
  }

  hasAnyLoginUser() {
    return this.userRepository.countLoginCapable().then((count) => count > 0)
  }

  findByEmail(email: string) {
    return this.userRepository.findByEmail(email)
  }

  private async assertIdentityAvailable(
    username: string | null | undefined,
    email: string | null | undefined,
    excludeId?: string,
  ) {
    if (
      await this.userRepository.existsByUsernameOrEmail(
        username,
        email,
        excludeId,
      )
    ) {
      throw createAppException(AppErrorCode.USER_CONFLICT)
    }
  }

  async updateProfile(id: string, dto: UpdateUserDto, actorId?: string) {
    const existing = await this.userRepository.findById(id)
    if (!existing) {
      throw createAppException(AppErrorCode.USER_NOT_FOUND, { id })
    }
    if (
      actorId &&
      actorId !== id &&
      !existing.isProfileOnly &&
      changesSignInIdentity(existing, dto)
    ) {
      throw createAppException(AppErrorCode.USER_IDENTITY_LOCKED, { id })
    }
    await this.assertIdentityAvailable(dto.username, dto.email, id)
    try {
      await this.userRepository.updateProfile(id, dto)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw createAppException(AppErrorCode.USER_CONFLICT)
      }
      throw error
    }
    await this.apiCache.invalidate()
    return this.getDetail(id)
  }

  async createProfileOnly(dto: CreateProfileOnlyUserDto) {
    await this.assertIdentityAvailable(dto.username, dto.email)
    try {
      const row = await this.userRepository.create({
        id: this.snowflakeService.nextId(),
        email: dto.email ?? null,
        username: dto.username ?? null,
        displayName: dto.displayName,
        avatar: dto.avatar ?? null,
        bio: dto.bio ?? null,
        url: dto.url ?? null,
        isProfileOnly: true,
      })
      await this.apiCache.invalidate()
      return this.toDetail(row)
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw createAppException(AppErrorCode.USER_CONFLICT)
      }
      throw error
    }
  }

  async deactivate(id: string, actorId?: string) {
    if (actorId && id === actorId) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'You cannot deactivate your own account',
      })
    }
    const row = await this.userRepository.findById(id)
    if (!row) throw createAppException(AppErrorCode.USER_NOT_FOUND, { id })
    if (!row.deactivatedAt) {
      await this.userRepository.setDeactivatedAt(id, new Date())
    }
    const [sessionTokens, apiKeyIds] = await Promise.all([
      this.userRepository.deleteSessionsForUser(id),
      this.userRepository.listApiKeyIds(id),
    ])
    for (const token of [...sessionTokens, ...apiKeyIds]) {
      this.eventEmitter.emit(EventBusEvents.TokenExpired, token)
    }
    await this.apiCache.invalidate()
    return this.getDetail(id)
  }

  async reactivate(id: string) {
    const row = await this.userRepository.findById(id)
    if (!row) throw createAppException(AppErrorCode.USER_NOT_FOUND, { id })
    if (row.deactivatedAt) {
      await this.userRepository.setDeactivatedAt(id, null)
    }
    await this.apiCache.invalidate()
    return this.getDetail(id)
  }

  async createWithPassword(input: {
    user: Omit<UserCreateInput, 'id' | 'isProfileOnly'>
    password: string
    claimInviteId?: string
    onlyIfFirst?: boolean
  }) {
    const username = input.user.username?.trim().toLowerCase() || null
    await this.assertIdentityAvailable(username, input.user.email)
    const id = this.snowflakeService.nextId()
    try {
      return await this.userRepository.createWithCredential({
        user: { ...input.user, username, id },
        accountId: this.snowflakeService.nextId(),
        passwordHash: await hashPassword(input.password),
        claimInviteId: input.claimInviteId,
        onlyIfFirst: input.onlyIfFirst,
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw createAppException(AppErrorCode.USER_CONFLICT)
      }
      throw error
    }
  }

  async convertProfileOnly(input: {
    userId: string
    email: string
    username: string
    displayName?: string
    password: string
    claimInviteId: string
  }) {
    const username = input.username.trim().toLowerCase()
    await this.assertIdentityAvailable(username, input.email, input.userId)
    let result: Awaited<
      ReturnType<UserRepository['convertProfileOnlyWithCredential']>
    >
    try {
      result = await this.userRepository.convertProfileOnlyWithCredential({
        userId: input.userId,
        email: input.email,
        username,
        displayName: input.displayName,
        accountId: this.snowflakeService.nextId(),
        passwordHash: await hashPassword(input.password),
        claimInviteId: input.claimInviteId,
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw createAppException(AppErrorCode.USER_CONFLICT)
      }
      throw error
    }
    if (result.kind === 'invite-unusable') {
      throw createAppException(AppErrorCode.INVITE_ALREADY_ACCEPTED)
    }
    if (result.kind === 'not-profile-only') {
      throw createAppException(AppErrorCode.USER_CONFLICT)
    }
    await this.apiCache.invalidate()
    return result.row
  }

  async createFirstUser(dto: CreateFirstUserDto) {
    if (await this.hasAnyLoginUser()) {
      throw createAppException(AppErrorCode.USER_ALREADY_EXISTS)
    }
    const created = await this.createWithPassword({
      user: {
        email: dto.mail,
        emailVerified: true,
        username: dto.username,
        displayName: dto.name || dto.username,
        avatar: dto.avatar || getAvatar(dto.mail),
        bio: dto.bio || null,
        url: dto.url || null,
      },
      password: dto.password,
      onlyIfFirst: true,
    })
    if (!created) {
      throw createAppException(AppErrorCode.USER_ALREADY_EXISTS)
    }
    return this.toDetail(created)
  }
}
