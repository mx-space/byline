import type { ExecutionContext } from '@nestjs/common'
import { UnauthorizedException } from '@nestjs/common'

import { ALL_PERMISSIONS } from '~/constants/permission.constant'
import type { SessionUser } from '~/modules/auth/auth.types'

import { authJWTToken } from '../constants/token'

export const mockUser1: SessionUser = {
  id: '1',
  name: 'John Doe',
  email: 'example@ee.com',
  username: 'johndoe',
  permissions: ALL_PERMISSIONS,
}

export class AuthTestingGuard {
  async canActivate(context: ExecutionContext): Promise<any> {
    const req = context.switchToHttp().getRequest()

    if (req.headers['test-token']) {
      const permissions = req.headers['test-permissions']
      req.user = {
        ...mockUser1,
        ...(permissions === undefined
          ? {}
          : { permissions: Number(permissions) }),
      }
      req.token = authJWTToken
      req.isAuthenticated = true

      return true
    }

    throw new UnauthorizedException()
  }
}

export const authPassHeader = {
  'test-token': 1,
}
