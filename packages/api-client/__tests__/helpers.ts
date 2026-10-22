import { vi } from 'vitest'

export interface RecordedCall {
  url: URL
  method: string
  headers: Record<string, string>
  body: unknown
}

type Responder = (call: RecordedCall) => {
  status?: number
  body?: unknown
  contentType?: string
}

export const mockFetch = (responder: Responder) => {
  const calls: RecordedCall[] = []
  const fetch = vi.fn(async (input: string | URL, init: RequestInit = {}) => {
    const rawBody = init.body
    const call: RecordedCall = {
      url: new URL(String(input)),
      method: init.method ?? 'GET',
      headers: Object.fromEntries(
        Object.entries((init.headers ?? {}) as Record<string, string>).map(
          ([key, value]) => [key.toLowerCase(), value],
        ),
      ),
      body:
        typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody ?? null),
    }
    calls.push(call)
    const { status = 200, body, contentType } = responder(call)
    if (status === 204) return new Response(null, { status })
    const isText = typeof body === 'string'
    return new Response(isText ? body : JSON.stringify(body), {
      status,
      headers: {
        'content-type':
          contentType ?? (isText ? 'text/plain' : 'application/json'),
      },
    })
  })
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls }
}
