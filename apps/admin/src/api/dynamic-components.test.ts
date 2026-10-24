import { afterEach, expect, it, vi } from 'vitest'

import { AUTH_BEARER_TOKEN_KEY } from '~/constants/keys'

import {
  getDynamicComponents,
  registerDynamicComponentEntry,
} from './dynamic-components'

vi.mock('~/constants/env', () => ({ API_URL: 'https://api.example' }))

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

afterEach(() => {
  fetchMock.mockReset()
  localStorage.clear()
})

const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json' },
      status,
    }),
  )

it('reads the catalog from GET /dynamic-components without rewriting props schema keys', async () => {
  respond(200, {
    data: {
      version: 2,
      components: [
        {
          name: 'Chart',
          description: 'A chart',
          url: 'https://cdn.example/chart.js',
          initial_height: 240,
          props_schema: { properties: { max_count: { type: 'number' } } },
        },
      ],
    },
  })

  const catalog = await getDynamicComponents()

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.example/dynamic-components')
  expect(init.method).toBe('GET')
  expect(catalog).toEqual({
    version: 2,
    components: [
      {
        name: 'Chart',
        description: 'A chart',
        url: 'https://cdn.example/chart.js',
        initialHeight: 240,
        propsSchema: { properties: { max_count: { type: 'number' } } },
      },
    ],
  })
})

it('posts a new entry to /dynamic-components and returns the appended catalog', async () => {
  const entry = {
    name: 'Counter',
    description: 'Counter',
    url: 'https://cdn.example/counter.js',
    initialHeight: 320,
    propsSchema: {},
  }
  respond(200, { data: { version: 1, components: [entry] } })

  const catalog = await registerDynamicComponentEntry(entry)

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.example/dynamic-components')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body)).toEqual(entry)
  expect(catalog.components).toEqual([entry])
})

it('surfaces the server error envelope', async () => {
  respond(409, { error: { code: 'CONFLICT', message: 'Duplicate url' } })

  await expect(getDynamicComponents()).rejects.toMatchObject({
    code: 'CONFLICT',
    message: 'Duplicate url',
    status: 409,
  })
})

it('includes the current session bearer token in catalog requests', async () => {
  localStorage.setItem(AUTH_BEARER_TOKEN_KEY, 'session-token')
  respond(200, { data: { version: 1, components: [] } })

  await getDynamicComponents()

  const [, init] = fetchMock.mock.calls[0]
  expect(new Headers(init.headers).get('authorization')).toBe(
    'Bearer session-token',
  )
})
