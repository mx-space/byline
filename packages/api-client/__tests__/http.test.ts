import { describe, expect, it } from 'vitest'

import { BylineApiError, camelcaseKeys, createClient } from '../src'
import { mockFetch } from './helpers'

describe('HttpCore', () => {
  it('sends the api key, unwraps the envelope and camelizes data and meta', async () => {
    const { fetch, calls } = mockFetch(() => ({
      body: {
        data: [{ id: '1', display_name: 'Ada', is_profile_only: true }],
        meta: { pagination: { page: 1, size: 20, total: 1, total_pages: 1 } },
      },
    }))
    const client = createClient({
      endpoint: 'https://cms.test/api/v3/',
      apiKey: 'secret',
      fetch,
    })

    const { data, meta } = await client.users.list({ status: 'profile_only' })

    expect(calls[0].url.toString()).toBe(
      'https://cms.test/api/v3/users?status=profile_only',
    )
    expect(calls[0].headers['x-api-key']).toBe('secret')
    expect(data).toEqual([{ id: '1', displayName: 'Ada', isProfileOnly: true }])
    expect(meta?.pagination.totalPages).toBe(1)
  })

  it('uses a bearer token when given', async () => {
    const { fetch, calls } = mockFetch(() => ({ body: { data: { ok: 1 } } }))
    const client = createClient({ endpoint: 'http://x', token: 'tok', fetch })
    await client.users.checkLogged()
    expect(calls[0].headers.authorization).toBe('Bearer tok')
  })

  it('maps the error envelope to BylineApiError', async () => {
    const { fetch } = mockFetch(() => ({
      status: 410,
      body: {
        error: {
          code: 'INVITE_EXPIRED',
          message: 'Invite expired',
          details: { expires_at: '2026-01-01' },
        },
      },
    }))
    const client = createClient({ endpoint: 'http://x', fetch })
    const error = await client.invites.get('t'.repeat(20)).catch((e) => e)
    expect(error).toBeInstanceOf(BylineApiError)
    expect(error).toMatchObject({
      status: 410,
      code: 'INVITE_EXPIRED',
      details: { expiresAt: '2026-01-01' },
    })
  })

  it('wraps non-JSON failures', async () => {
    const { fetch } = mockFetch(() => ({ status: 502, body: 'Bad gateway' }))
    const client = createClient({ endpoint: 'http://x', fetch })
    await expect(client.users.me()).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
      message: 'Bad gateway',
    })
  })

  it('returns undefined data for 204', async () => {
    const { fetch } = mockFetch(() => ({ status: 204 }))
    const client = createClient({ endpoint: 'http://x', fetch })
    await expect(client.invites.revoke('9')).resolves.toEqual({
      data: undefined,
    })
  })

  it('can skip case conversion', async () => {
    const { fetch } = mockFetch(() => ({
      body: { data: { display_name: 'A' } },
    }))
    const client = createClient({
      endpoint: 'http://x',
      fetch,
      camelCase: false,
    })
    const { data } = await client.users.me()
    expect(data).toEqual({ display_name: 'A' })
  })
})

describe('camelcaseKeys', () => {
  it('keeps preserved subtrees verbatim', () => {
    const value = camelcaseKeys(
      {
        components: [
          { initial_height: 1, props_schema: { snake_key: { max_len: 2 } } },
        ],
        version: 1,
      },
      ['components[].propsSchema'],
    )
    expect(value).toEqual({
      components: [
        { initialHeight: 1, propsSchema: { snake_key: { max_len: 2 } } },
      ],
      version: 1,
    })
  })
})
