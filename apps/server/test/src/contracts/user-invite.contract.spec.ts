import { describe, expect, test, vi } from 'vitest'

import { apiRoutePrefix } from '~/common/decorators/api-controller.decorator'
import { AuthService } from '~/modules/auth/auth.service'
import { ConfigsService } from '~/modules/configs/configs.service'
import { UserController } from '~/modules/user/user.controller'
import { UserService } from '~/modules/user/user.service'
import { UserInviteService } from '~/modules/user/user-invite.service'

import { createE2EApp } from '../../helper/create-e2e-app'
import { authPassHeader, mockUser1 } from '../../mock/guard/auth.guard'

const invite = {
  id: '9001',
  email: 'guest@example.test',
  displayName: 'Guest',
  invitedBy: mockUser1.id,
  userId: '42',
  expiresAt: new Date('2026-11-01T00:00:00Z'),
  acceptedAt: null,
  createdAt: new Date('2026-10-22T00:00:00Z'),
  token: 'token',
  acceptUrl: 'https://admin.example.test/#/invite/token',
  emailQueued: false,
}

const inviteService = {
  create: vi.fn(async () => invite),
  inviteExisting: vi.fn(async () => invite),
}

describe('UserController invite contract (e2e)', () => {
  const proxy = createE2EApp({
    controllers: [UserController],
    providers: [
      { provide: UserInviteService, useValue: inviteService },
      { provide: UserService, useValue: {} },
      { provide: AuthService, useValue: {} },
      { provide: ConfigsService, useValue: {} },
    ],
  })

  test('POST /users/:id/invite invites an existing author and reports the target user', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'POST',
      url: `${apiRoutePrefix}/users/42/invite`,
      payload: { email: 'guest@example.test', display_name: 'Guest' },
    })

    expect(res.statusCode).toBe(201)
    expect(inviteService.inviteExisting).toHaveBeenCalledWith(
      '42',
      { email: 'guest@example.test', displayName: 'Guest' },
      { id: mockUser1.id, name: mockUser1.name },
    )
    expect(res.json().data).toMatchObject({ user_id: '42', token: 'token' })
  })

  test('POST /users/:id/invite accepts an empty body', async () => {
    const res = await proxy.app.inject({
      headers: authPassHeader,
      method: 'POST',
      url: `${apiRoutePrefix}/users/42/invite`,
      payload: {},
    })

    expect(res.statusCode).toBe(201)
  })

  test('POST /users/:id/invite requires a signed-in user', async () => {
    inviteService.inviteExisting.mockClear()
    const res = await proxy.app.inject({
      method: 'POST',
      url: `${apiRoutePrefix}/users/42/invite`,
      payload: { email: 'guest@example.test' },
    })

    expect(res.statusCode).toBe(401)
    expect(inviteService.inviteExisting).not.toHaveBeenCalled()
  })
})
