import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { AppErrorCode } from '~/common/errors'
import { UserRepository } from '~/modules/user/user.repository'
import { UserService } from '~/modules/user/user.service'
import { SnowflakeService } from '~/shared/id/snowflake.service'

describe('first user creation (PostgreSQL)', () => {
  let context: PgTestDatabase
  let service: UserService

  beforeAll(async () => {
    context = await createPgTestDatabase('byline_first_user')
    service = new UserService(
      new UserRepository(context.db),
      new SnowflakeService(),
      { invalidate: async () => {} } as any,
      { emit: () => true } as any,
    )
  }, 120_000)

  afterAll(async () => {
    await context?.close()
  })

  it('lets exactly one of several concurrent first-user calls succeed', async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) =>
        service.createFirstUser({
          username: `founder${index}`,
          password: 'correct-horse-battery',
          mail: `founder${index}@example.test`,
        }),
      ),
    )

    const fulfilled = attempts.filter((item) => item.status === 'fulfilled')
    const rejected = attempts.filter(
      (item): item is PromiseRejectedResult => item.status === 'rejected',
    )
    expect(fulfilled).toHaveLength(1)
    for (const item of rejected) {
      expect(item.reason).toMatchObject({
        code: AppErrorCode.USER_ALREADY_EXISTS,
      })
    }
    const { rows } = await context.pool.query(
      'SELECT count(*)::int AS count FROM users WHERE is_profile_only = false',
    )
    expect(rows[0].count).toBe(1)
  })
})
