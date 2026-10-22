import { Injectable } from '@nestjs/common'
import { hashPassword } from 'better-auth/crypto'

import { AppErrorCode, createAppException } from '~/common/errors'
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

  hasUserWithEmail(email: string) {
    return this.userRepository.existsByUsernameOrEmail(null, email)
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
    await this.userRepository.deleteSessionsForUser(id)
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
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw createAppException(AppErrorCode.USER_CONFLICT)
      }
      throw error
    }
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
    })
    return this.toDetail(created!)
  }
}
