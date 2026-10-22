import { AppErrorCode } from '~/common/errors'
import type { UserRepository } from '~/modules/user/user.repository'
import { UserService } from '~/modules/user/user.service'
import type { UserRow } from '~/modules/user/user.types'
import { SnowflakeService } from '~/shared/id/snowflake.service'

const baseRow: UserRow = {
  id: '2',
  email: 'writer@example.test',
  emailVerified: true,
  username: 'writer',
  handle: 'writer',
  displayName: 'Writer',
  avatar: null,
  bio: null,
  url: null,
  permissions: 0,
  isProfileOnly: false,
  deactivatedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: null,
}

const createService = (row: UserRow) => {
  const repository = {
    findById: vi.fn(async () => row),
    findByIdDetailed: vi.fn(async () => row),
    existsByUsernameOrEmail: vi.fn(async () => false),
    updateProfile: vi.fn(async () => row),
  }
  const service = new UserService(
    repository as unknown as UserRepository,
    new SnowflakeService(),
  )
  return { service, repository }
}

describe('UserService.updateProfile sign-in identity', () => {
  it.each([
    ['email', { email: 'attacker@example.test' }],
    ['username', { username: 'attacker' }],
  ])(
    "rejects another user changing a sign-in account's %s",
    async (_field, patch) => {
      const { service, repository } = createService(baseRow)

      await expect(
        service.updateProfile('2', patch, '1'),
      ).rejects.toMatchObject({ code: AppErrorCode.USER_IDENTITY_LOCKED })
      expect(repository.updateProfile).not.toHaveBeenCalled()
    },
  )

  it('accepts unchanged identity fields sent back by another user', async () => {
    const { service, repository } = createService(baseRow)

    await service.updateProfile(
      '2',
      {
        email: 'Writer@Example.test',
        username: 'writer',
        displayName: 'Renamed',
      },
      '1',
    )

    expect(repository.updateProfile).toHaveBeenCalled()
  })

  it('lets users change their own email and username', async () => {
    const { service, repository } = createService(baseRow)

    await service.updateProfile(
      '2',
      { email: 'new@example.test', username: 'renamed' },
      '2',
    )

    expect(repository.updateProfile).toHaveBeenCalled()
  })

  it('lets anyone edit a profile-only author identity', async () => {
    const { service, repository } = createService({
      ...baseRow,
      isProfileOnly: true,
    })

    await service.updateProfile('2', { email: 'guest@example.test' }, '1')

    expect(repository.updateProfile).toHaveBeenCalled()
  })
})
