import { Inject, Injectable } from '@nestjs/common'
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
  TransactionRollbackError,
} from 'drizzle-orm'

import { PG_DB_TOKEN } from '~/constants/system.constant'
import { accounts, sessions, userInvites, users } from '~/database/schema'
import {
  BaseRepository,
  type PaginationResult,
} from '~/processors/database/base.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'

import type {
  UserCreateInput,
  UserListParams,
  UserProfilePatch,
  UserRow,
} from './user.types'

const mapRow = (row: typeof users.$inferSelect): UserRow => ({
  id: row.id,
  email: row.email,
  emailVerified: row.emailVerified,
  username: row.username,
  handle: row.handle,
  displayName: row.name,
  avatar: row.image,
  bio: row.bio,
  url: row.url,
  permissions: row.permissions,
  isProfileOnly: row.isProfileOnly,
  deactivatedAt: row.deactivatedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const toInsertValues = (input: UserCreateInput): typeof users.$inferInsert => ({
  id: input.id,
  email: input.email ?? null,
  emailVerified: input.emailVerified ?? false,
  name: input.displayName ?? null,
  displayUsername: input.displayName ?? null,
  handle: input.username ?? null,
  username: input.username ?? null,
  image: input.avatar ?? null,
  bio: input.bio ?? null,
  url: input.url ?? null,
  isProfileOnly: input.isProfileOnly ?? false,
})

const activeCondition = and(
  eq(users.isProfileOnly, false),
  isNull(users.deactivatedAt),
)!

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(@Inject(PG_DB_TOKEN) db: AppDatabase) {
    super(db)
  }

  async findById(id: string): Promise<UserRow | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    return row ? mapRow(row) : null
  }

  async findByIds(ids: string[]): Promise<UserRow[]> {
    if (ids.length === 0) return []
    const rows = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, [...new Set(ids)]))
    return rows.map(mapRow)
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1)
    return row ? mapRow(row) : null
  }

  async existsByUsernameOrEmail(
    username: string | null | undefined,
    email: string | null | undefined,
    excludeId?: string,
  ) {
    const conditions: SQL[] = []
    if (username) conditions.push(eq(users.username, username))
    if (email) conditions.push(sql`lower(${users.email}) = lower(${email})`)
    if (conditions.length === 0) return false
    const matches = or(...conditions)!
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        excludeId ? and(matches, sql`${users.id} <> ${excludeId}`) : matches,
      )
      .limit(1)
    return !!row
  }

  async countActive(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(activeCondition)
    return Number(row?.count ?? 0)
  }

  async countLoginCapable(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isProfileOnly, false))
    return Number(row?.count ?? 0)
  }

  private buildListFilter(params: UserListParams): SQL | undefined {
    const conditions: SQL[] = []
    switch (params.status) {
      case 'active': {
        conditions.push(activeCondition)
        break
      }
      case 'deactivated': {
        conditions.push(isNotNull(users.deactivatedAt))
        break
      }
      case 'profile_only': {
        conditions.push(eq(users.isProfileOnly, true))
        break
      }
    }
    const search = params.search?.trim()
    if (search) {
      const pattern = `%${search}%`
      conditions.push(
        or(
          ilike(users.name, pattern),
          ilike(users.email, pattern),
          ilike(users.username, pattern),
        )!,
      )
    }
    if (conditions.length === 0) return undefined
    return conditions.length === 1 ? conditions[0] : and(...conditions)
  }

  async list(params: UserListParams = {}): Promise<PaginationResult<UserRow>> {
    const page = Math.max(1, params.page ?? 1)
    const size = Math.min(100, Math.max(1, params.size ?? 20))
    const where = this.buildListFilter(params)
    const lastLoginAt = sql<Date | null>`max(${sessions.createdAt})`
    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select({ user: users, lastLoginAt })
        .from(users)
        .leftJoin(sessions, eq(sessions.userId, users.id))
        .where(where)
        .groupBy(users.id)
        .orderBy(desc(users.createdAt), asc(users.id))
        .limit(size)
        .offset((page - 1) * size),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(where),
    ])
    return {
      data: rows.map((row) => ({
        ...mapRow(row.user),
        lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      })),
      pagination: this.paginationOf(Number(count ?? 0), page, size),
    }
  }

  async findByIdDetailed(id: string): Promise<UserRow | null> {
    const lastLoginAt = sql<Date | null>`max(${sessions.createdAt})`
    const [row] = await this.db
      .select({ user: users, lastLoginAt })
      .from(users)
      .leftJoin(sessions, eq(sessions.userId, users.id))
      .where(eq(users.id, id))
      .groupBy(users.id)
      .limit(1)
    return row
      ? {
          ...mapRow(row.user),
          lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
        }
      : null
  }

  async create(input: UserCreateInput): Promise<UserRow> {
    const [row] = await this.db
      .insert(users)
      .values(toInsertValues(input))
      .returning()
    return mapRow(row)
  }

  async createWithCredential(input: {
    user: UserCreateInput
    accountId: string
    passwordHash: string
    claimInviteId?: string
  }): Promise<UserRow | null> {
    return this.db.transaction(async (tx) => {
      if (input.claimInviteId) {
        const claimed = await tx
          .update(userInvites)
          .set({ acceptedAt: new Date() })
          .where(
            and(
              eq(userInvites.id, input.claimInviteId),
              isNull(userInvites.acceptedAt),
              sql`${userInvites.expiresAt} > now()`,
            ),
          )
          .returning({ id: userInvites.id })
        if (claimed.length === 0) return null
      }
      const [row] = await tx
        .insert(users)
        .values(toInsertValues({ ...input.user, isProfileOnly: false }))
        .returning()
      await tx.insert(accounts).values({
        id: input.accountId,
        userId: row.id,
        accountId: row.id,
        providerId: 'credential',
        providerAccountId: row.id,
        password: input.passwordHash,
      })
      if (input.claimInviteId) {
        await tx
          .update(userInvites)
          .set({ acceptedUserId: row.id })
          .where(eq(userInvites.id, input.claimInviteId))
      }
      return mapRow(row)
    })
  }

  async convertProfileOnlyWithCredential(input: {
    userId: string
    email: string
    username: string
    displayName?: string | null
    accountId: string
    passwordHash: string
    claimInviteId: string
  }): Promise<
    | { kind: 'converted'; row: UserRow }
    | { kind: 'invite-unusable' }
    | { kind: 'not-profile-only' }
  > {
    return this.db
      .transaction(async (tx) => {
        const claimed = await tx
          .update(userInvites)
          .set({ acceptedAt: new Date(), acceptedUserId: input.userId })
          .where(
            and(
              eq(userInvites.id, input.claimInviteId),
              isNull(userInvites.acceptedAt),
              sql`${userInvites.expiresAt} > now()`,
            ),
          )
          .returning({ id: userInvites.id })
        if (claimed.length === 0) return { kind: 'invite-unusable' as const }

        const update: Partial<typeof users.$inferInsert> = {
          email: input.email,
          emailVerified: true,
          username: input.username,
          handle: input.username,
          isProfileOnly: false,
          updatedAt: new Date(),
        }
        if (input.displayName) {
          update.name = input.displayName
          update.displayUsername = input.displayName
        }
        const [row] = await tx
          .update(users)
          .set(update)
          .where(
            and(
              eq(users.id, input.userId),
              eq(users.isProfileOnly, true),
              isNull(users.deactivatedAt),
            ),
          )
          .returning()
        if (!row) {
          tx.rollback()
        }
        await tx.insert(accounts).values({
          id: input.accountId,
          userId: row.id,
          accountId: row.id,
          providerId: 'credential',
          providerAccountId: row.id,
          password: input.passwordHash,
        })
        return { kind: 'converted' as const, row: mapRow(row) }
      })
      .catch((error: unknown) => {
        if (error instanceof TransactionRollbackError) {
          return { kind: 'not-profile-only' as const }
        }
        throw error
      })
  }

  async updateProfile(
    id: string,
    patch: UserProfilePatch,
  ): Promise<UserRow | null> {
    const update: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (patch.email !== undefined) update.email = patch.email
    if (patch.username !== undefined) {
      update.username = patch.username
      update.handle = patch.username
    }
    if (patch.displayName !== undefined) {
      update.name = patch.displayName
      update.displayUsername = patch.displayName
    }
    if (patch.avatar !== undefined) update.image = patch.avatar
    if (patch.bio !== undefined) update.bio = patch.bio
    if (patch.url !== undefined) update.url = patch.url
    const [row] = await this.db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning()
    return row ? mapRow(row) : null
  }

  async setDeactivatedAt(
    id: string,
    deactivatedAt: Date | null,
  ): Promise<UserRow | null> {
    const [row] = await this.db
      .update(users)
      .set({ deactivatedAt, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return row ? mapRow(row) : null
  }

  async deleteSessionsForUser(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId))
  }
}
