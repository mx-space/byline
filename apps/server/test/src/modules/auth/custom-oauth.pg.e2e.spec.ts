import { createServer, type Server } from 'node:http'

import { eq } from 'drizzle-orm'
import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { accounts, users } from '~/database/schema'
import { CreateAuth } from '~/modules/auth/auth.implement'
import { buildCustomOAuthProviders } from '~/modules/auth/social-providers'
import { __setTestPostgresInstance } from '~/processors/database/postgres.provider'
import { SnowflakeService } from '~/shared/id/snowflake.service'

describe('custom OAuth sign-in and account gates', () => {
  let database: PgTestDatabase
  let identity: Server
  let authServer: Server
  let authUrl: string
  let auth: Awaited<ReturnType<typeof CreateAuth>>['auth']
  const exchanges: URLSearchParams[] = []
  const origin = 'http://localhost:2323'
  const userId = '1001'

  beforeAll(async () => {
    identity = createServer(async (request, response) => {
      let body = ''
      for await (const chunk of request) body += chunk
      response.setHeader('content-type', 'application/json')
      const address = identity.address() as { port: number }
      const base = `http://127.0.0.1:${address.port}`
      if (request.url === '/discovery') {
        response.end(
          JSON.stringify({
            issuer: base,
            authorization_endpoint: `${base}/authorize`,
            token_endpoint: `${base}/token`,
            userinfo_endpoint: `${base}/userinfo`,
          }),
        )
      } else if (request.url === '/token') {
        const params = new URLSearchParams(body)
        exchanges.push(params)
        response.end(
          JSON.stringify({
            access_token: params.get('code'),
            token_type: 'Bearer',
            expires_in: 3600,
          }),
        )
      } else if (request.url === '/userinfo') {
        const token = request.headers.authorization?.replace('Bearer ', '')
        response.end(
          JSON.stringify({
            sub:
              token === 'unverified'
                ? 'unverified-subject'
                : token === 'unknown'
                  ? 'stranger-subject'
                  : 'same-subject',
            email:
              token === 'unknown'
                ? 'stranger@example.test'
                : 'writer@example.test',
            name: 'Writer',
            email_verified: token === 'unverified' ? 'false' : true,
          }),
        )
      } else {
        response.statusCode = 404
        response.end('{}')
      }
    })
    await new Promise<void>((resolve) =>
      identity.listen(0, '127.0.0.1', resolve),
    )
    const discoveryUrl = `http://127.0.0.1:${(identity.address() as { port: number }).port}/discovery`
    database = await createPgTestDatabase('byline_custom_oauth')
    __setTestPostgresInstance(database.pool, database.db)
    await database.db.insert(users).values({
      id: userId,
      email: 'writer@example.test',
      name: 'Writer',
      username: 'writer',
      emailVerified: true,
    })
    let handler: Awaited<ReturnType<typeof CreateAuth>>['handler']
    authServer = createServer((request, response) => {
      request.originalUrl = request.url!
      void handler(request, response)
    })
    await new Promise<void>((resolve) =>
      authServer.listen(0, '127.0.0.1', resolve),
    )
    authUrl = `http://127.0.0.1:${(authServer.address() as { port: number }).port}`
    const providers = buildCustomOAuthProviders(
      {
        customClients: [
          ...['first-sso', 'second-sso'].map((id) => ({
            id,
            name: id,
            enabled: true,
            protocol: 'oidc' as const,
            clientId: id,
            discoveryUrl,
          })),
          {
            id: 'plain-oauth',
            name: 'OAuth 2.0',
            enabled: true,
            protocol: 'oauth2',
            clientId: 'byline-oauth2',
            authorizationUrl: discoveryUrl.replace('/discovery', '/authorize'),
            tokenUrl: discoveryUrl.replace('/discovery', '/token'),
            userInfoUrl: discoveryUrl.replace('/discovery', '/userinfo'),
          },
        ],
        secrets: {
          'first-sso': { clientSecret: 'first-secret' },
          'second-sso': { clientSecret: 'second-secret' },
          'plain-oauth': { clientSecret: 'oauth2-secret' },
        },
      },
      authUrl,
    )
    ;({ auth, handler } = await CreateAuth(
      {},
      undefined,
      authUrl,
      new SnowflakeService(),
      undefined,
      undefined,
      providers,
    ))
  })

  afterAll(async () => {
    __setTestPostgresInstance(null, null)
    await database?.close()
    await new Promise<void>((resolve, reject) =>
      authServer?.close((error) => (error ? reject(error) : resolve())),
    )
    await new Promise<void>((resolve, reject) =>
      identity?.close((error) => (error ? reject(error) : resolve())),
    )
  })

  async function signIn(
    providerId: string,
    code: string,
    requestSignUp = false,
  ) {
    const started = await auth.api.signInSocial({
      asResponse: true,
      headers: new Headers({ origin }),
      body: {
        provider: providerId,
        callbackURL: `${origin}/#/dashboard`,
        errorCallbackURL: `${origin}/#/login`,
        requestSignUp,
      },
    })
    expect(started.status).toBe(200)
    const authorization = new URL((await started.json()).url)
    expect(authorization.searchParams.get('redirect_uri')).toBe(
      `${authUrl}/auth/oauth2/callback/${providerId}`,
    )
    expect(authorization.searchParams.get('code_challenge')).toBeTruthy()
    const cookie = started.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')
    const callback = new URL(authorization.searchParams.get('redirect_uri')!)
    callback.searchParams.set('code', code)
    callback.searchParams.set('state', authorization.searchParams.get('state')!)
    return fetch(callback, { headers: { origin, cookie }, redirect: 'manual' })
  }

  it('signs in an existing invited user through two independently identified clients', async () => {
    for (const id of ['first-sso', 'second-sso']) {
      const response = await signIn(id, 'existing')
      expect(response.headers.get('location')).toBe(`${origin}/#/dashboard`)
    }
    const linked = await database.db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
    expect(linked.map((account) => account.providerId).sort()).toEqual([
      'first-sso',
      'second-sso',
    ])
    expect(linked.map((account) => account.accountId)).toEqual([
      'same-subject',
      'same-subject',
    ])
    expect(
      exchanges.every((params) => Boolean(params.get('code_verifier'))),
    ).toBe(true)
  })

  it('does not open registration even when the caller requests sign-up', async () => {
    const response = await signIn('first-sso', 'unknown', true)
    expect(response.headers.get('location')).not.toBe(`${origin}/#/dashboard`)
    expect(
      await database.db
        .select()
        .from(users)
        .where(eq(users.email, 'stranger@example.test')),
    ).toHaveLength(0)
  })

  it('signs in using explicit OAuth 2.0 endpoints without discovery', async () => {
    const response = await signIn('plain-oauth', 'existing')
    expect(response.headers.get('location')).toBe(`${origin}/#/dashboard`)
    expect(
      await database.db
        .select()
        .from(accounts)
        .where(eq(accounts.providerId, 'plain-oauth')),
    ).toEqual([expect.objectContaining({ userId })])
  })

  it('does not link a different identity using a string false verification claim', async () => {
    const response = await signIn('first-sso', 'unverified')
    expect(response.headers.get('location')).not.toBe(`${origin}/#/dashboard`)
    expect(
      await database.db
        .select()
        .from(accounts)
        .where(eq(accounts.accountId, 'unverified-subject')),
    ).toHaveLength(0)
  })

  it('rejects a deactivated user who already linked the provider', async () => {
    await database.db
      .update(users)
      .set({ deactivatedAt: new Date() })
      .where(eq(users.id, userId))
    const response = await signIn('first-sso', 'existing')
    expect(response.headers.get('location')).not.toBe(`${origin}/#/dashboard`)
  })
})
