import { createE2EApp } from '@/helper/create-e2e-app'
import { authPassHeader } from '@/mock/guard/auth.guard'
import { LobeHubController } from '~/modules/ai/lobehub/lobehub.controller'
import { LobeHubService } from '~/modules/ai/lobehub/lobehub.service'

const flowId = '00000000-0000-4000-8000-000000000001'
const cloud = {
  startDeviceLogin: vi.fn(async () => ({
    flowId,
    userCode: 'ABCD-EFGH',
    verificationUri: 'https://app.lobehub.com/oidc/device',
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
    intervalSeconds: 5,
  })),
  pollDeviceLogin: vi.fn(async () => ({
    status: 'pending',
    intervalSeconds: 5,
  })),
  cancelDeviceLogin: vi.fn(async () => {}),
  getAccount: vi.fn(async () => ({
    status: 'disconnected',
    name: null,
    email: null,
  })),
  disconnect: vi.fn(async () => {}),
}
const ctx = createE2EApp({
  controllers: [LobeHubController],
  providers: [{ provide: LobeHubService, useValue: cloud }],
})
const base = '/ai/providers/lobehub'

it('protects the shared account from unauthenticated and unauthorized users', async () => {
  const anonymous = await ctx.app.inject({
    method: 'POST',
    url: `${base}/device`,
  })
  expect(anonymous.statusCode).toBe(401)
  const forbidden = await ctx.app.inject({
    method: 'DELETE',
    url: `${base}/session`,
    headers: { ...authPassHeader, 'test-permissions': 0 },
  })
  expect(forbidden.statusCode).toBe(403)
  expect(cloud.disconnect).not.toHaveBeenCalled()
})

it('returns device login and polling through the snake-case success envelope', async () => {
  const login = await ctx.app.inject({
    method: 'POST',
    url: `${base}/device`,
    headers: authPassHeader,
  })
  expect(login.statusCode).toBe(200)
  expect(login.json()).toMatchObject({
    data: { flow_id: flowId, user_code: 'ABCD-EFGH', interval_seconds: 5 },
  })
  const poll = await ctx.app.inject({
    method: 'POST',
    url: `${base}/device/${flowId}`,
    headers: authPassHeader,
  })
  expect(poll.json()).toEqual({
    data: { status: 'pending', interval_seconds: 5 },
  })
  const invalid = await ctx.app.inject({
    method: 'POST',
    url: `${base}/device/not-a-flow-id`,
    headers: authPassHeader,
  })
  expect(invalid.statusCode).toBe(400)
  expect(invalid.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } })
  expect(cloud.pollDeviceLogin).toHaveBeenCalledTimes(1)
})
