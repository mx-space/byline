import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { lastValueFrom, of } from 'rxjs'

import { PERMISSIONS_METADATA } from '~/common/decorators/permission.decorator'
import { AppErrorCode } from '~/common/errors'
import { PermissionsInterceptor } from '~/common/interceptors/permissions.interceptor'
import {
  ALL_PERMISSIONS,
  matchPermissionPreset,
  PERMISSION_PRESETS,
  UserPermission,
} from '~/constants/permission.constant'
import { hasPermission } from '~/utils/permission.util'

describe('hasPermission', () => {
  it('checks the bit on the user', () => {
    const author = { permissions: UserPermission.EditPost }
    expect(hasPermission(author, UserPermission.EditPost)).toBe(true)
    expect(hasPermission(author, UserPermission.PublishPost)).toBe(false)
  })

  it('denies a missing user or missing bits', () => {
    expect(hasPermission(null, UserPermission.EditPost)).toBe(false)
    expect(hasPermission({}, UserPermission.EditPost)).toBe(false)
  })

  it('grants every bit, including new ones, to the owner mask', () => {
    const owner = { permissions: ALL_PERMISSIONS }
    for (const bit of Object.values(UserPermission)) {
      expect(hasPermission(owner, bit)).toBe(true)
    }
  })
})

describe('permission presets', () => {
  it('names a mask that equals a preset and nothing else', () => {
    expect(matchPermissionPreset(ALL_PERMISSIONS)).toBe('owner')
    expect(matchPermissionPreset(PERMISSION_PRESETS.translator)).toBe(
      'translator',
    )
    expect(
      matchPermissionPreset(
        PERMISSION_PRESETS.author | UserPermission.EditOthersPost,
      ),
    ).toBeNull()
  })
})

describe('PermissionsInterceptor', () => {
  const contextFor = (user: unknown, required?: number[]) => {
    const handler = () => {}
    if (required)
      Reflect.defineMetadata(PERMISSIONS_METADATA, required, handler)
    return {
      getHandler: () => handler,
      getClass: () => class {},
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => ({ raw: {}, user }) }),
    } as unknown as ExecutionContext
  }
  const next = { handle: () => of('handled') }
  const interceptor = new PermissionsInterceptor(new Reflector())

  it('rejects a member without the bit with PERMISSION_DENIED', () => {
    expect(() =>
      interceptor.intercept(
        contextFor({ permissions: UserPermission.EditPost }, [
          UserPermission.PublishPost,
        ]),
        next,
      ),
    ).toThrow(expect.objectContaining({ code: AppErrorCode.PERMISSION_DENIED }))
  })

  it('rejects a request with no user as not logged in', () => {
    expect(() =>
      interceptor.intercept(
        contextFor(undefined, [UserPermission.PublishPost]),
        next,
      ),
    ).toThrow(
      expect.objectContaining({ code: AppErrorCode.AUTH_NOT_LOGGED_IN }),
    )
  })

  it('passes a member with every required bit, and routes without metadata', async () => {
    const member = {
      permissions: UserPermission.EditPost | UserPermission.PublishPost,
    }
    await expect(
      lastValueFrom(
        interceptor.intercept(
          contextFor(member, [UserPermission.PublishPost]),
          next,
        ),
      ),
    ).resolves.toBe('handled')
    await expect(
      lastValueFrom(interceptor.intercept(contextFor(undefined), next)),
    ).resolves.toBe('handled')
  })
})
