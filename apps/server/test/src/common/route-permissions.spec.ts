import { RequestMethod } from '@nestjs/common'
import { METHOD_METADATA } from '@nestjs/common/constants'

import { PERMISSIONS_METADATA } from '~/common/decorators/permission.decorator'
import { UserPermission } from '~/constants/permission.constant'

const controllers = import.meta.glob<Record<string, unknown>>(
  '../../../src/**/*.controller.ts',
  { eager: true },
)

const MUTATING = new Set([
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  RequestMethod.DELETE,
])

const OPEN_TO_ANY_MEMBER = new Set([
  'AuthController.generateToken',
  'AuthController.deleteToken',
  'DeviceController.verify',
  'InitController.patch',
  'InitController.createFirstUser',
  'UserInviteController.accept',
  'UserController.updateMe',
])

const CHECKED_IN_HANDLER = new Set([
  'TaskController.cancelTask',
  'TaskController.retryTask',
  'TaskController.cancelTasksByGroupId',
])

const MUTATING_GETS = new Set([
  'AppController.cleanCatch',
  'AppController.cleanAllRedisKey',
])

type Route = { name: string; required: number[] | undefined }

const mutatingRoutes = (): Route[] => {
  const routes: Route[] = []
  for (const mod of Object.values(controllers)) {
    for (const value of Object.values(mod)) {
      if (typeof value !== 'function' || !value.name.endsWith('Controller')) {
        continue
      }
      const proto = value.prototype as Record<string, unknown>
      for (const key of Object.getOwnPropertyNames(proto)) {
        const handler = proto[key]
        if (key === 'constructor' || typeof handler !== 'function') continue
        const method = Reflect.getMetadata(METHOD_METADATA, handler)
        const name = `${value.name}.${key}`
        if (!MUTATING.has(method) && !MUTATING_GETS.has(name)) continue
        routes.push({
          name,
          required:
            Reflect.getMetadata(PERMISSIONS_METADATA, handler) ??
            Reflect.getMetadata(PERMISSIONS_METADATA, value),
        })
      }
    }
  }
  return routes
}

describe('route permissions', () => {
  const routes = mutatingRoutes()
  const bitOf = (name: string) =>
    routes.find((route) => route.name === name)?.required

  it('finds the controllers', () => {
    expect(routes.length).toBeGreaterThan(50)
  })

  it('declares a permission on every mutating route', () => {
    const missing = routes
      .filter((route) => !route.required?.length)
      .map((route) => route.name)
      .filter(
        (name) =>
          !OPEN_TO_ANY_MEMBER.has(name) && !CHECKED_IN_HANDLER.has(name),
      )
    expect(missing).toEqual([])
  })

  it('keeps the allowlist pointing at real routes', () => {
    const names = new Set(routes.map((route) => route.name))
    expect(
      [...OPEN_TO_ANY_MEMBER, ...CHECKED_IN_HANDLER, ...MUTATING_GETS].filter(
        (name) => !names.has(name),
      ),
    ).toEqual([])
  })

  it('maps publishing, translations and settings to their bits', () => {
    expect(bitOf('PublishController.create')).toEqual([
      UserPermission.PublishPost,
    ])
    expect(bitOf('PostController.patch')).toEqual([UserPermission.PublishPost])
    expect(bitOf('PostController.deletePost')).toEqual([
      UserPermission.PublishPost,
    ])
    expect(bitOf('AiTranslationController.writeManualTranslation')).toEqual([
      UserPermission.EditTranslation,
    ])
    expect(bitOf('CategoryController.create')).toEqual([
      UserPermission.ManageCategories,
    ])
    expect(bitOf('WebhookController.create')).toEqual([
      UserPermission.ManageSettings,
    ])
  })
})
