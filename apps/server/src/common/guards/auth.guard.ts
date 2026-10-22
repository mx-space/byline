import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Injectable } from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'
import { AuthService } from '~/modules/auth/auth.service'
import type { SessionUser } from '~/modules/auth/auth.types'
import type { FastifyBizRequest } from '~/transformers/get-req.transformer'
import { getNestExecutionContextRequest } from '~/transformers/get-req.transformer'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context)

    const session = await this.authService.getSessionUser(request.raw)

    if (session?.user?.id) {
      this.attachUserAndToken(
        request,
        session.user as SessionUser,
        session.session?.token || '',
      )
      return true
    }

    const apiKey = this.authService.getApiKeyFromRequest({
      headers: request.headers,
    })

    if (!apiKey) {
      throw createAppException(AppErrorCode.AUTH_NOT_LOGGED_IN)
    }

    const result = await this.authService.verifyApiKey(apiKey.key)
    if (!result?.referenceId) {
      throw createAppException(AppErrorCode.AUTH_TOKEN_INVALID)
    }

    const user = await this.authService.getActiveUserById(result.referenceId)
    if (!user) {
      throw createAppException(AppErrorCode.AUTH_TOKEN_INVALID)
    }
    this.attachUserAndToken(request, user, apiKey.key)
    return true
  }

  getRequest(context: ExecutionContext) {
    return getNestExecutionContextRequest(context)
  }

  attachUserAndToken(
    request: FastifyBizRequest,
    user: SessionUser,
    token: string,
  ) {
    request.user = user
    request.token = token

    Object.assign(request.raw, { user, token })
  }
}
