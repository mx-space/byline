import { describe, expect, it, vi } from 'vitest'

import { AppController } from '~/app.controller'

const createController = () => {
  const redisService = {
    cleanCatch: vi.fn(),
    cleanAllRedisKey: vi.fn(),
  }
  const controller = new AppController(redisService as any)
  return { controller, redisService }
}

describe('AppController', () => {
  it('returns the liveness pong without a database dependency', () => {
    const { controller } = createController()

    expect(controller.ping()).toBe('pong')
  })
})
