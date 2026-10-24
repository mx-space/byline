import { afterEach, expect, it, vi } from 'vitest'

import { AUTH_BEARER_TOKEN_KEY } from '~/constants/keys'

import {
  deleteDynamicComponentEntry,
  getDynamicComponents,
  registerDynamicComponentEntry,
  updateDynamicComponentEntry,
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

it('patches an entry by id and keeps the id from the catalog', async () => {
  const stored = {
    id: '42',
    name: 'Counter',
    description: 'Edited',
    url: 'https://cdn.example/counter.js',
    initial_height: 320,
    props_schema: { max_count: 1 },
  }
  respond(200, { data: { version: 1, components: [stored] } })

  const catalog = await updateDynamicComponentEntry('42', {
    description: 'Edited',
  })

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.example/dynamic-components/42')
  expect(init.method).toBe('PATCH')
  expect(JSON.parse(init.body)).toEqual({ description: 'Edited' })
  expect(catalog.components[0]).toEqual({
    id: '42',
    name: 'Counter',
    description: 'Edited',
    url: 'https://cdn.example/counter.js',
    initialHeight: 320,
    propsSchema: { max_count: 1 },
  })
})

it('reads the earlier urls of an entry', async () => {
  respond(200, {
    data: {
      version: 1,
      components: [
        {
          id: '7',
          name: 'Ring',
          description: '',
          url: 'https://cdn.example/v3.js',
          initial_height: 100,
          props_schema: {},
          previous_urls: [
            'https://cdn.example/v1.js',
            'https://cdn.example/v2.js',
          ],
        },
      ],
    },
  })

  const catalog = await getDynamicComponents()

  expect(catalog.components[0].previousUrls).toEqual([
    'https://cdn.example/v1.js',
    'https://cdn.example/v2.js',
  ])
})

it('deletes an entry by id', async () => {
  respond(200, { data: { version: 1, components: [] } })

  const catalog = await deleteDynamicComponentEntry('42')

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://api.example/dynamic-components/42')
  expect(init.method).toBe('DELETE')
  expect(catalog.components).toEqual([])
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
