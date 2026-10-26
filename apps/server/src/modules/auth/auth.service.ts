import { IncomingMessage } from 'node:http'

import { defaultKeyHasher } from '@better-auth/api-key'
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { omit } from 'es-toolkit/compat'
import { customAlphabet } from 'nanoid'

import { SECRET_STORAGE_V2 } from '~/app.config'
import { AppErrorCode, createAppException } from '~/common/errors'
import { alphabet } from '~/constants/other.constant'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import { UserRepository } from '../user/user.repository'
import { isUserActive, type UserRow } from '../user/user.types'
import {
  AuthInstanceInjectKey,
  HASHED_API_KEY_CONFIG_ID,
} from './auth.constant'
import type { TokenDto } from './auth.controller'
import type { InjectAuthInstance } from './auth.interface'
import { AuthRepository } from './auth.repository'
import type { SessionUser } from './auth.types'

const toSessionUser = (user: UserRow): SessionUser => ({
  id: user.id,
  email: user.email,
  name: user.displayName,
  image: user.avatar,
  handle: user.handle,
  username: user.username,
  displayUsername: user.displayName,
  permissions: user.permissions,
})

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
    @Inject(AuthInstanceInjectKey)
    private readonly authInstance: InjectAuthInstance,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  private pickFirstHeader(
    headers: Record<string, string | string[] | undefined>,
    ...names: string[]
  ): string | undefined {
    for (const name of names) {
      const value = headers[name]
      const picked = Array.isArray(value) ? value[0] : value
      if (typeof picked === 'string' && picked.length > 0) {
        return picked
      }
    }
    return undefined
  }

  async getAllAccessToken(userId: string) {
    const keys = await this.authRepository.listApiKeysForUser(userId)

    return keys.map((token) => ({
      id: token.id,
      token: this.maskApiKey(token),
      name: token.name,
      createdAt: token.createdAt,
      expired: token.expiresAt ?? undefined,
    }))
  }

  private maskApiKey(token: {
    key?: string | null
    start?: string | null
    prefix?: string | null
  }): string {
    const prefix = token.prefix || ''
    const start = token.start || ''
    const visible = start.startsWith(prefix) ? start : `${prefix}${start}`
    return visible ? `${visible}••••••••` : '••••••••••••••••••••••••'
  }

  async getToken(id: string, userId?: string) {
    const token = await this.authRepository.findApiKeyById(id)

    if (!token) {
      return null
    }
    if (userId && token.referenceId !== userId && token.userId !== userId) {
      return null
    }
    return {
      id: token.id,
      token: this.maskApiKey(token),
      name: token.name,
      createdAt: token.createdAt,
      expired: token.expiresAt ?? undefined,
    }
  }

  async generateAccessToken() {
    const nanoid = customAlphabet(alphabet, 40)()

    return `txo${nanoid}`
  }

  async verifyCustomToken(
    token: string,
  ): Promise<[true, { userId: string }] | [false, null]> {
    const apiKey = await this.verifyApiKey(token)
    if (!apiKey) {
      return [false, null]
    }
    return [true, { userId: apiKey.referenceId }]
  }

  async createAccessToken(body: TokenDto, userId: string) {
    const auth = this.authInstance.get()
    if (!auth) {
      throw new InternalServerErrorException('auth not found')
    }

    const expiresIn =
      body.expired instanceof Date
        ? Math.floor((body.expired.getTime() - Date.now()) / 1000)
        : undefined

    if (expiresIn !== undefined && expiresIn <= 0) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'expired must be in the future',
      })
    }

    const created = await auth.api.createApiKey({
      body: {
        name: body.name,
        userId,
        configId: SECRET_STORAGE_V2 ? HASHED_API_KEY_CONFIG_ID : 'default',
        // Automation keys must not inherit the provider's 10-request daily quota.
        rateLimitEnabled: false,
        ...(expiresIn ? { expiresIn } : {}),
      },
    })

    return {
      name: created.name ?? body.name,
      token: created.key,
      expired: created.expiresAt ? new Date(created.expiresAt) : undefined,
    }
  }

  async saveToken(model: TokenDto & { token: string }, userId: string) {
    const now = new Date()
    const start = model.token.slice(0, 6)
    const prefix = model.token.startsWith('txo') ? 'txo' : undefined
    await this.authRepository.createApiKey({
      id: this.snowflakeService.nextId(),
      name: model.name,
      start,
      prefix,
      key: SECRET_STORAGE_V2
        ? await defaultKeyHasher(model.token)
        : model.token,
      configId: SECRET_STORAGE_V2 ? HASHED_API_KEY_CONFIG_ID : 'default',
      userId,
      referenceId: userId,
      enabled: true,
      rateLimitEnabled: true,
      expiresAt: model.expired ?? null,
      lastRefillAt: now,
    })
    return model
  }

  async deleteToken(id: string) {
    await this.authRepository.deleteApiKey(id)
  }

  private readonly sessionUserPromiseByRequest = new WeakMap<
    IncomingMessage,
    ReturnType<AuthService['getSessionUserFromHeaders']>
  >()

  getSessionUser(req: IncomingMessage) {
    const cached = this.sessionUserPromiseByRequest.get(req)
    if (cached) return cached

    const promise = this.getSessionUserFromHeaders(
      this.buildHeadersFromRequest(req.headers),
    )
    // Only memoize in-flight/successful resolutions: callers (e.g. RolesGuard)
    // swallow transient failures and retry, so a rejection must not be cached.
    promise.catch(() => {
      if (this.sessionUserPromiseByRequest.get(req) === promise) {
        this.sessionUserPromiseByRequest.delete(req)
      }
    })
    this.sessionUserPromiseByRequest.set(req, promise)
    return promise
  }

  async getSessionUserFromHeaders(headers: Headers) {
    const auth = this.authInstance.get()
    if (!auth) {
      throw new InternalServerErrorException('auth not found')
    }

    if (!headers.get('cookie') && !headers.get('authorization')) {
      return null
    }
    const session = await auth.api.getSession({
      query: {
        disableCookieCache: true,
      },
      headers,
    })

    if (!session) {
      return null
    }

    const accounts = await auth.api.listUserAccounts({
      headers,
    })

    if (!accounts || accounts.length === 0) {
      return null
    }

    const sessionProvider = (session as { session?: { provider?: string } })
      .session?.provider
    const matchedAccount = sessionProvider
      ? accounts.find((account) => account.providerId === sessionProvider)
      : undefined
    const primaryAccount = matchedAccount || accounts[0]
    const providerAccountId = primaryAccount.accountId || primaryAccount.id
    const provider = primaryAccount.providerId

    const sessionUser = session?.user as (typeof session)['user'] & {
      handle?: string
      permissions?: number
    }
    if (sessionUser?.id) {
      const user = await this.userRepository.findById(sessionUser.id)
      if (!isUserActive(user)) {
        return null
      }
    }

    return {
      ...session,
      providerAccountId,
      provider: provider || sessionProvider,
      user: sessionUser,
    }
  }

  async getOauthUserAccount(providerAccountId: string) {
    const account =
      await this.authRepository.findAccountByProviderAccountId(
        providerAccountId,
      )

    if (!account) {
      return { id: undefined }
    }

    const user = account.userId
      ? await this.userRepository.findById(account.userId)
      : null

    return {
      ...omit(account, [
        'password',
        'accessToken',
        'refreshToken',
        'idToken',
        'raw',
      ]),
      provider: account.providerId,
      ...(user
        ? {
            email: user.email,
            name: user.displayName,
            image: user.avatar,
            handle: user.handle,
          }
        : {}),
      id: account.userId,
    }
  }

  getOauthProviders() {
    return this.authInstance.get().api.getProviders()
  }

  hasCredentialAccount() {
    return this.authRepository.hasCredentialAccounts()
  }

  async hasPasskey() {
    return (await this.authRepository.countPasskeys()) > 0
  }

  getApiKeyFromRequest(req: {
    headers?: Record<string, string | string[] | undefined>
  }) {
    const headers = req.headers || {}

    // Only the `x-api-key` header is honored. The legacy `?token=` query path
    // was removed: query strings leak into access logs, the Referer header, and
    // browser history, and are trivially replayable for full owner access.
    const apiKeyHeader = this.pickFirstHeader(headers, 'x-api-key', 'X-API-Key')
    if (apiKeyHeader) {
      return { key: apiKeyHeader }
    }

    return null
  }

  async verifyApiKey(token: string) {
    const auth = this.authInstance.get()
    if (!auth) {
      throw new InternalServerErrorException('auth not found')
    }
    // Explicit config IDs prevent a stored hash from matching the legacy plaintext lookup.
    for (const configId of [HASHED_API_KEY_CONFIG_ID, 'default']) {
      const result = await auth.api.verifyApiKey({
        body: { key: token, configId },
      })
      if (result?.valid && result.key?.referenceId) return result.key
    }
    return this.verifyLegacyApiKey(token)
  }

  private async verifyLegacyApiKey(token: string) {
    const legacyDoc = await this.authRepository.findApiKey(token)

    if (
      !legacyDoc ||
      legacyDoc.configId === HASHED_API_KEY_CONFIG_ID ||
      legacyDoc.referenceId
    ) {
      return null
    }

    if (legacyDoc.enabled === false) {
      return null
    }

    if (legacyDoc.expiresAt && legacyDoc.expiresAt.getTime() <= Date.now()) {
      return null
    }

    const referenceId =
      legacyDoc.referenceId ||
      (legacyDoc.userId ? legacyDoc.userId.toString() : null)

    if (!referenceId) {
      return null
    }

    return {
      ...legacyDoc,
      referenceId,
      configId: legacyDoc.configId ?? 'default',
      enabled: legacyDoc.enabled ?? true,
      rateLimitEnabled: legacyDoc.rateLimitEnabled ?? true,
      requestCount: legacyDoc.requestCount ?? 0,
    }
  }

  async isActiveUserId(userId: string) {
    return isUserActive(await this.userRepository.findById(userId))
  }

  private buildHeadersFromRequest(
    headers: Record<string, string | string[] | undefined>,
  ) {
    const header = new Headers()
    const cookie = this.pickFirstHeader(headers, 'cookie')
    if (cookie) {
      header.set('cookie', cookie)
    }
    const origin = this.pickFirstHeader(headers, 'origin')
    if (origin) {
      header.set('origin', origin)
    }
    const authorization = this.pickFirstHeader(
      headers,
      'authorization',
      'Authorization',
    )
    if (authorization) {
      header.set('authorization', authorization)
    }
    return header
  }

  async getActiveUserById(userId: string): Promise<SessionUser | null> {
    if (!userId) {
      return null
    }
    const user = await this.userRepository.findById(userId)
    if (!isUserActive(user)) {
      return null
    }
    return toSessionUser(user!)
  }
}
