import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm'

import { PG_DB_TOKEN } from '~/constants/system.constant'
import { userInvites } from '~/database/schema'
import { BaseRepository } from '~/processors/database/base.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'

import type { UserInviteRow } from './user.types'

const mapRow = (row: typeof userInvites.$inferSelect): UserInviteRow => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  invitedBy: row.invitedBy,
  expiresAt: row.expiresAt,
  acceptedAt: row.acceptedAt,
  acceptedUserId: row.acceptedUserId,
  userId: row.userId ?? null,
  permissions: row.permissions ?? null,
  createdAt: row.createdAt,
})

@Injectable()
export class UserInviteRepository extends BaseRepository {
  constructor(@Inject(PG_DB_TOKEN) db: AppDatabase) {
    super(db)
  }

  async create(input: {
    id: string
    email: string
    displayName?: string | null
    tokenHash: string
    invitedBy?: string | null
    userId?: string | null
    permissions?: number | null
    expiresAt: Date
  }): Promise<UserInviteRow> {
    const [row] = await this.db
      .insert(userInvites)
      .values({
        id: input.id,
        email: input.email,
        displayName: input.displayName ?? null,
        tokenHash: input.tokenHash,
        invitedBy: input.invitedBy ?? null,
        userId: input.userId ?? null,
        permissions: input.permissions ?? null,
        expiresAt: input.expiresAt,
      })
      .returning()
    return mapRow(row)
  }

  async listPending(now = new Date()): Promise<UserInviteRow[]> {
    const rows = await this.db
      .select()
      .from(userInvites)
      .where(
        and(isNull(userInvites.acceptedAt), gt(userInvites.expiresAt, now)),
      )
      .orderBy(desc(userInvites.createdAt))
    return rows.map(mapRow)
  }

  async findById(id: string): Promise<UserInviteRow | null> {
    const [row] = await this.db
      .select()
      .from(userInvites)
      .where(eq(userInvites.id, id))
      .limit(1)
    return row ? mapRow(row) : null
  }

  async findByTokenHash(tokenHash: string): Promise<UserInviteRow | null> {
    const [row] = await this.db
      .select()
      .from(userInvites)
      .where(eq(userInvites.tokenHash, tokenHash))
      .limit(1)
    return row ? mapRow(row) : null
  }

  async deletePendingByEmail(email: string): Promise<void> {
    await this.db
      .delete(userInvites)
      .where(
        and(
          sql`lower(${userInvites.email}) = lower(${email})`,
          isNull(userInvites.acceptedAt),
        ),
      )
  }

  async deletePendingByUserId(userId: string): Promise<void> {
    await this.db
      .delete(userInvites)
      .where(
        and(eq(userInvites.userId, userId), isNull(userInvites.acceptedAt)),
      )
  }

  async deleteById(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(userInvites)
      .where(eq(userInvites.id, id))
      .returning({ id: userInvites.id })
    return rows.length > 0
  }
}
