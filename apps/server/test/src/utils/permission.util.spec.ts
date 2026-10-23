import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AppErrorCode } from '~/common/errors'
import {
  PERMISSIONS_METADATA,
  PermissionsGuard,
} from '~/common/guards/permissions.guard'
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

describe('PermissionsGuard', () => {
  const contextFor = (user: unknown, required: number[]) => {
    const handler = () => {}
    Reflect.defineMetadata(PERMISSIONS_METADATA, required, handler)
    return {
      getHandler: () => handler,
      getClass: () => class {},
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => ({ raw: {}, user }) }),
    } as unknown as ExecutionContext
  }

  it('rejects a member without the bit with PERMISSION_DENIED', () => {
    const guard = new PermissionsGuard(new Reflector())
    expect(() =>
      guard.canActivate(
        contextFor({ permissions: UserPermission.EditPost }, [
          UserPermission.PublishPost,
        ]),
      ),
    ).toThrow(expect.objectContaining({ code: AppErrorCode.PERMISSION_DENIED }))
  })

  it('lets a member with every required bit through', () => {
    const guard = new PermissionsGuard(new Reflector())
    expect(
      guard.canActivate(
        contextFor(
          {
            permissions: UserPermission.EditPost | UserPermission.PublishPost,
          },
          [UserPermission.PublishPost],
        ),
      ),
    ).toBe(true)
  })
})
