import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { firstValueFrom, from, of } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/global/env.global', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/global/env.global')>()
  return { ...actual, isTest: false }
})

const { REDIS } = await import('~/app.config')
const { RequestContext } = await import('~/common/contexts/request.context')
const { HttpCacheInterceptor } =
  await import('~/common/interceptors/cache.interceptor')

interface FakeReply {
  raw: { statusCode: number }
  headers: Record<string, string>
  header: (name: string, value: string) => void
  getHeader: (name: string) => string | undefined
}

const createReply = (): FakeReply => {
  const headers: Record<string, string> = {}
  return {
    raw: { statusCode: 200 },
    headers,
    header(name, value) {
      headers[name] = value
    },
    getHeader(name) {
      return headers[name]
    },
  }
}

const createContext = (request: any, reply: FakeReply): ExecutionContext =>
  ({
    getType: () => 'http',
    getHandler: () => function handler() {},
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => reply,
    }),
  }) as unknown as ExecutionContext

const createHandler = (value: unknown): CallHandler => ({
  handle: () => of(value),
})

const createInterceptor = (
  store: Map<string, unknown>,
  apiCache = { generation: vi.fn(async () => 0), invalidate: vi.fn() },
) => {
  const cacheManager = {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value)
    }),
  }
  const reflector = { get: vi.fn(() => undefined) }
  const httpAdapterHost = {
    httpAdapter: { getRequestMethod: () => 'GET' },
  }
  const interceptor = new HttpCacheInterceptor(
    cacheManager as any,
    reflector as any,
    httpAdapterHost as any,
    apiCache as any,
  )
  return { interceptor, cacheManager }
}

const baseRequest = (overrides: Record<string, unknown> = {}) => ({
  method: 'GET',
  url: '/posts/public-post',
  query: {},
  hasAdminAccess: false,
  hasReaderIdentity: false,
  isAuthenticated: false,
  ...overrides,
})

describe('HttpCacheInterceptor shared caching', () => {
  const originalDisableApiCache = REDIS.disableApiCache

  beforeEach(() => {
    REDIS.disableApiCache = false
  })

  afterEach(() => {
    REDIS.disableApiCache = originalDisableApiCache
  })

  it('sends private cache-control and skips the shared cache for identified requests', async () => {
    const store = new Map<string, unknown>()
    const { interceptor, cacheManager } = createInterceptor(store)
    const reply = createReply()

    await firstValueFrom(
      (await interceptor.intercept(
        createContext(baseRequest({ hasReaderIdentity: true }), reply),
        createHandler({ data: { ok: true } }),
      )) as any,
    )

    expect(cacheManager.get).not.toHaveBeenCalled()
    expect(cacheManager.set).not.toHaveBeenCalled()
    expect(reply.headers['cache-control']).toContain('private')
    expect(reply.headers['cdn-cache-control']).toContain('private')
  })

  it('caches an anonymous response and replays it on the next anonymous request', async () => {
    const store = new Map<string, unknown>()
    const response = { data: { title: 'Public post' } }

    await firstValueFrom(
      (await createInterceptor(store).interceptor.intercept(
        createContext(baseRequest(), createReply()),
        createHandler(response),
      )) as any,
    )
    expect(store.size).toBe(1)

    const { interceptor, cacheManager } = createInterceptor(store)
    const result = await firstValueFrom(
      (await interceptor.intercept(
        createContext(baseRequest(), createReply()),
        createHandler({ data: { title: 'should-not-be-returned' } }),
      )) as any,
    )

    expect(cacheManager.get).toHaveBeenCalled()
    expect(result).toEqual(response)
  })

  it('keys shared cache entries by the header-derived request language', async () => {
    const store = new Map<string, unknown>()
    const runAs = async (lang: string | undefined, title: string) => {
      const { interceptor } = createInterceptor(store)
      const request = baseRequest({ url: '/posts/1' })
      const reply = createReply()
      const context = new RequestContext(request as any, {} as any)
      context.lang = lang
      const result = await RequestContext.run(context, async () =>
        firstValueFrom(
          (await interceptor.intercept(
            createContext(request, reply),
            createHandler({ data: { title } }),
          )) as any,
        ),
      )
      return { result, reply }
    }

    await runAs('zh-TW', 'zh-TW title')
    const { result, reply } = await runAs(undefined, 'source title')

    expect(result).toEqual({ data: { title: 'source title' } })
    expect(store.size).toBe(2)
    expect(reply.headers.vary).toBe('x-lang, accept-language')
  })

  it('stops serving entries cached before a content write', async () => {
    const store = new Map<string, unknown>()
    let generation = 0
    const apiCache = {
      generation: vi.fn(async () => generation),
      invalidate: vi.fn(async () => {
        generation++
      }),
    }
    const read = async (title: string) => {
      const { interceptor } = createInterceptor(store, apiCache)
      return firstValueFrom(
        (await interceptor.intercept(
          createContext(baseRequest({ url: '/posts/1' }), createReply()),
          createHandler({ data: { title } }),
        )) as any,
      )
    }

    await read('before write')
    await expect(read('ignored')).resolves.toEqual({
      data: { title: 'before write' },
    })

    await apiCache.invalidate()

    await expect(read('after write')).resolves.toEqual({
      data: { title: 'after write' },
    })
  })

  it('keeps a read that started before a write from refilling the new generation', async () => {
    const store = new Map<string, unknown>()
    let generation = 0
    const apiCache = {
      generation: vi.fn(async () => generation),
      invalidate: vi.fn(async () => {
        generation++
      }),
    }
    const { interceptor } = createInterceptor(store, apiCache)
    let release!: (value: unknown) => void
    const slowRead = new Promise((resolve) => {
      release = resolve
    })
    const inFlight = interceptor
      .intercept(
        createContext(baseRequest({ url: '/posts/1' }), createReply()),
        { handle: () => from(slowRead) },
      )
      .then((observable) => firstValueFrom(observable as any))

    await new Promise((resolve) => setImmediate(resolve))
    await apiCache.invalidate()
    release({ data: { title: 'stale' } })
    await inFlight

    const { interceptor: next } = createInterceptor(store, apiCache)
    const result = await firstValueFrom(
      (await next.intercept(
        createContext(baseRequest({ url: '/posts/1' }), createReply()),
        createHandler({ data: { title: 'fresh' } }),
      )) as any,
    )

    expect(result).toEqual({ data: { title: 'fresh' } })
  })
})
