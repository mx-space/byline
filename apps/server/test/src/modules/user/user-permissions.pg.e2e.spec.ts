import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { AppErrorCode } from '~/common/errors'
import {
  ALL_PERMISSIONS,
  PERMISSION_PRESETS,
  UserPermission,
} from '~/constants/permission.constant'
import { UserRepository } from '~/modules/user/user.repository'
import {
  CreateInviteSchema,
  UpdateUserPermissionsSchema,
} from '~/modules/user/user.schema'
import { UserService } from '~/modules/user/user.service'
import { UserInviteRepository } from '~/modules/user/user-invite.repository'
import { UserInviteService } from '~/modules/user/user-invite.service'
import { __setTestPostgresInstance } from '~/processors/database/postgres.provider'
import { SnowflakeService } from '~/shared/id/snowflake.service'

const PASSWORD = 'correct-horse-battery'

describe('member permissions (PostgreSQL)', () => {
  let context: PgTestDatabase
  let users: UserService
  let invites: UserInviteService
  let ownerId: string
  const snowflake = new SnowflakeService()

  beforeAll(async () => {
    context = await createPgTestDatabase('byline_user_permissions')
    __setTestPostgresInstance(context.pool, context.db)
    users = new UserService(
      new UserRepository(context.db),
      snowflake,
      { invalidate: async () => {} } as any,
      { emit: vi.fn() } as any,
    )
    invites = new UserInviteService(
      new UserInviteRepository(context.db),
      users,
      {
        get: async (key: string) =>
          key === 'url'
            ? { adminUrl: 'https://admin.example.test/' }
            : { enable: false },
      } as any,
      { checkIsReady: async () => false } as any,
      snowflake,
    )
    const owner = await users.createFirstUser({
      username: 'owner',
      password: PASSWORD,
      mail: 'owner@example.test',
    })
    ownerId = owner.id
  }, 120_000)

  afterAll(async () => {
    __setTestPostgresInstance(null, null)
    await context?.close()
  })

  it('keeps the first user as owner', async () => {
    expect((await users.getDetail(ownerId)).permissions).toBe(ALL_PERMISSIONS)
  })

  it('gives an accepted invite the bits it was sent with', async () => {
    const invite = await invites.create(
      {
        email: 'translator@example.test',
        permissions: PERMISSION_PRESETS.translator,
      },
      { id: ownerId },
    )
    const member = await invites.accept(invite.token, {
      username: 'translator',
      password: PASSWORD,
    })
    expect(member.permissions).toBe(PERMISSION_PRESETS.translator)
  })

  it('gives a claimed author the invite bits instead of keeping full access', async () => {
    const author = await users.createProfileOnly({ displayName: 'Imported' })
    const invite = await invites.inviteExisting(
      author.id,
      {
        email: 'imported@example.test',
        permissions: PERMISSION_PRESETS.editor,
      },
      { id: ownerId },
    )
    const member = await invites.accept(invite.token, {
      username: 'imported',
      password: PASSWORD,
    })
    expect(member).toMatchObject({
      id: author.id,
      permissions: PERMISSION_PRESETS.editor,
    })
  })

  it('falls back to the author preset when an invite names no bits', async () => {
    const invite = await invites.create(
      { email: 'plain@example.test' },
      { id: ownerId },
    )
    const member = await invites.accept(invite.token, {
      username: 'plain',
      password: PASSWORD,
    })
    expect(member.permissions).toBe(PERMISSION_PRESETS.author)
  })

  it('refuses owner or unknown bits on an invite', () => {
    expect(
      CreateInviteSchema.safeParse({
        email: 'x@example.test',
        permissions: ALL_PERMISSIONS,
      }).success,
    ).toBe(false)
    expect(
      CreateInviteSchema.safeParse({
        email: 'x@example.test',
        permissions: 1 << 20,
      }).success,
    ).toBe(false)
    expect(
      UpdateUserPermissionsSchema.safeParse({ permissions: ALL_PERMISSIONS })
        .success,
    ).toBe(true)
  })

  it('changes a member’s bits', async () => {
    const member = (await users.list({ page: 1, size: 20, search: 'plain' }))
      .data[0]
    const updated = await users.setPermissions(
      member.id,
      PERMISSION_PRESETS.author | UserPermission.EditOthersPost,
      ownerId,
    )
    expect(updated.permissions).toBe(
      PERMISSION_PRESETS.author | UserPermission.EditOthersPost,
    )
  })

  it('stops a member removing their own user management', async () => {
    await expect(
      users.setPermissions(ownerId, PERMISSION_PRESETS.editor, ownerId),
    ).rejects.toMatchObject({ code: AppErrorCode.INVALID_PARAMETER })
    expect((await users.getDetail(ownerId)).permissions).toBe(ALL_PERMISSIONS)
  })

  it('filters the member list by preset role', async () => {
    const translators = await users.list({
      page: 1,
      size: 20,
      role: 'translator',
    })
    expect(translators.data.map((user) => user.username)).toEqual([
      'translator',
    ])
    const custom = await users.list({ page: 1, size: 20, role: 'custom' })
    expect(custom.data.map((user) => user.username)).toEqual(['plain'])
  })
})
