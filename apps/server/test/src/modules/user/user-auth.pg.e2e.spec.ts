import { hashPassword } from 'better-auth/crypto'
import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { AppErrorCode } from '~/common/errors'
import { accounts } from '~/database/schema'
import { CreateAuth } from '~/modules/auth/auth.implement'
import { UserRepository } from '~/modules/user/user.repository'
import { UserService } from '~/modules/user/user.service'
import { UserInviteRepository } from '~/modules/user/user-invite.repository'
import { UserInviteService } from '~/modules/user/user-invite.service'
import { __setTestPostgresInstance } from '~/processors/database/postgres.provider'
import { SnowflakeService } from '~/shared/id/snowflake.service'

const PASSWORD = 'correct-horse-battery'

describe('users, invites and sign-in gates (PostgreSQL)', () => {
  let context: PgTestDatabase
  let auth: Awaited<ReturnType<typeof CreateAuth>>['auth']
  let users: UserService
  let invites: UserInviteService
  const snowflake = new SnowflakeService()

  const signIn = (email: string, password = PASSWORD) =>
    auth.api.signInEmail({ body: { email, password } })

  beforeAll(async () => {
    context = await createPgTestDatabase('byline_user_auth')
    __setTestPostgresInstance(context.pool, context.db)
    ;({ auth } = await CreateAuth(
      {},
      undefined,
      'http://127.0.0.1:2333',
      snowflake,
    ))
    users = new UserService(new UserRepository(context.db), snowflake)
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
  }, 120_000)

  afterAll(async () => {
    __setTestPostgresInstance(null, null)
    await context?.close()
  })

  it('creates the first user once and lets them sign in', async () => {
    const first = await users.createFirstUser({
      username: 'Founder',
      password: PASSWORD,
      mail: 'founder@example.test',
    })
    expect(first).toMatchObject({
      username: 'founder',
      isProfileOnly: false,
      deactivatedAt: null,
    })
    await expect(
      users.createFirstUser({
        username: 'second',
        password: PASSWORD,
        mail: 'second@example.test',
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.USER_ALREADY_EXISTS })

    const session = await signIn('founder@example.test')
    expect(session.user.id).toBe(first.id)
  })

  it('accepts an invite exactly once and the new account can sign in', async () => {
    const inviter = (await users.list({ page: 1, size: 10 })).data[0]
    const created = await invites.create(
      { email: 'Writer@Example.test', displayName: 'Writer' },
      { id: inviter.id, name: inviter.displayName },
    )
    expect(created).toMatchObject({
      email: 'writer@example.test',
      displayName: 'Writer',
      invitedBy: inviter.id,
      emailQueued: false,
    })
    expect(created.acceptUrl).toBe(
      `https://admin.example.test/#/invite/${created.token}`,
    )
    await expect(invites.getPublic(created.token)).resolves.toMatchObject({
      email: 'writer@example.test',
    })

    const writer = await invites.accept(created.token, {
      username: 'writer',
      password: PASSWORD,
    })
    expect(writer).toMatchObject({
      email: 'writer@example.test',
      displayName: 'Writer',
      username: 'writer',
    })
    await expect(
      invites.accept(created.token, {
        username: 'writer2',
        password: PASSWORD,
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.INVITE_ALREADY_ACCEPTED })
    expect(await invites.list()).toHaveLength(0)

    const session = await signIn('writer@example.test')
    expect(session.user.id).toBe(writer.id)
  })

  it('rejects unknown and expired invite tokens', async () => {
    await expect(
      invites.getPublic('this-token-does-not-exist'),
    ).rejects.toMatchObject({ code: AppErrorCode.INVITE_NOT_FOUND })

    const created = await invites.create(
      { email: 'late@example.test' },
      {
        id: (await users.list({ page: 1, size: 1 })).data[0].id,
      },
    )
    await context.pool.query(
      `UPDATE user_invites SET expires_at = now() - interval '1 minute' WHERE id = $1`,
      [created.id],
    )
    await expect(
      invites.accept(created.token, { username: 'late', password: PASSWORD }),
    ).rejects.toMatchObject({ code: AppErrorCode.INVITE_EXPIRED })
  })

  it('blocks sign-in for a deactivated user until reactivated', async () => {
    const writer = (await users.list({ search: 'writer', page: 1, size: 1 }))
      .data[0]
    await context.pool.query(
      `INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, 'stale-session', now() + interval '1 day')`,
      [snowflake.nextId(), writer.id],
    )

    const deactivated = await users.deactivate(writer.id)
    expect(deactivated.deactivatedAt).not.toBeNull()
    const remaining = await context.pool.query(
      'SELECT count(*)::int AS count FROM sessions WHERE user_id = $1',
      [writer.id],
    )
    expect(remaining.rows[0].count).toBe(0)
    await expect(signIn('writer@example.test')).rejects.toMatchObject({
      statusCode: 403,
    })

    await users.reactivate(writer.id)
    await expect(signIn('writer@example.test')).resolves.toMatchObject({
      user: { id: writer.id },
    })
  })

  it('never opens a session for a profile-only author', async () => {
    const author = await users.createProfileOnly({
      displayName: 'Guest Author',
      email: 'guest@example.test',
      bio: 'Writes sometimes',
    })
    expect(author).toMatchObject({
      isProfileOnly: true,
      displayName: 'Guest Author',
    })
    await expect(signIn('guest@example.test')).rejects.toBeDefined()

    await context.db.insert(accounts).values({
      id: snowflake.nextId(),
      userId: author.id,
      accountId: author.id,
      providerId: 'credential',
      password: await hashPassword(PASSWORD),
    })
    await expect(signIn('guest@example.test')).rejects.toMatchObject({
      statusCode: 403,
    })
    const sessions = await context.pool.query(
      'SELECT count(*)::int AS count FROM sessions WHERE user_id = $1',
      [author.id],
    )
    expect(sessions.rows[0].count).toBe(0)
  })

  it('sends password reset mail only to users who can sign in', async () => {
    const sendResetPasswordEmail = vi.fn(async () => {})
    const { auth: mailingAuth } = await CreateAuth(
      {},
      undefined,
      'http://127.0.0.1:2333',
      snowflake,
      undefined,
      sendResetPasswordEmail,
    )
    const requestReset = (email: string) =>
      mailingAuth.api.requestPasswordReset({
        body: { email, redirectTo: 'https://admin.example.test/' },
      })

    await requestReset('guest@example.test')
    const writer = (await users.list({ search: 'writer', page: 1, size: 1 }))
      .data[0]
    await users.deactivate(writer.id)
    await requestReset('writer@example.test')
    expect(sendResetPasswordEmail).not.toHaveBeenCalled()

    await users.reactivate(writer.id)
    await requestReset('writer@example.test')
    expect(sendResetPasswordEmail).toHaveBeenCalledTimes(1)
  })
})
