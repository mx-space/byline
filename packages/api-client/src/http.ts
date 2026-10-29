import { camelcaseKeys } from './case'
import { BylineApiError } from './error'
import type { ApiResponse } from './types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryValue =
  string | number | boolean | null | undefined | ReadonlyArray<string | number>

export interface ClientOptions {
  endpoint: string
  apiKey?: string
  token?: string
  lang?: string
  headers?: Record<string, string>
  fetch?: typeof globalThis.fetch
  camelCase?: boolean
}

export interface RequestOptions {
  query?: Record<string, QueryValue>
  body?: unknown
  headers?: Record<string, string>
  preserve?: readonly string[]
  signal?: AbortSignal
}

const ENVELOPE_KEYS = new Set(['data', 'meta'])

const isEnvelope = (body: unknown): body is { data: unknown; meta?: unknown } =>
  !!body &&
  typeof body === 'object' &&
  !Array.isArray(body) &&
  'data' in body &&
  Object.keys(body).every((key) => ENVELOPE_KEYS.has(key))

const isBinaryBody = (body: unknown) =>
  (typeof FormData !== 'undefined' && body instanceof FormData) ||
  (typeof Blob !== 'undefined' && body instanceof Blob) ||
  body instanceof ArrayBuffer ||
  body instanceof URLSearchParams ||
  typeof body === 'string'

export class HttpCore {
  readonly endpoint: string
  private readonly fetchImpl: typeof globalThis.fetch

  constructor(private readonly options: ClientOptions) {
    if (!options.endpoint) throw new TypeError('endpoint is required')
    this.endpoint = options.endpoint.replace(/\/+$/, '')
    const fetchImpl = options.fetch ?? globalThis.fetch
    if (!fetchImpl) throw new TypeError('No fetch implementation available')
    this.fetchImpl = fetchImpl
  }

  get lang() {
    return this.options.lang
  }

  buildUrl(path: string, query?: Record<string, QueryValue>) {
    const url = new URL(`${this.endpoint}/${path.replace(/^\/+/, '')}`)
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null) continue
      url.searchParams.set(
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      )
    }
    return url.toString()
  }

  async request<T, M = Record<string, unknown>>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T, M>> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.options.headers,
      ...options.headers,
    }
    if (this.options.apiKey) headers['x-api-key'] = this.options.apiKey
    if (this.options.token)
      headers.authorization = `Bearer ${this.options.token}`

    let body: BodyInit | undefined
    if (options.body !== undefined) {
      if (isBinaryBody(options.body)) {
        body = options.body as BodyInit
      } else {
        headers['content-type'] = 'application/json'
        body = JSON.stringify(options.body)
      }
    }

    const url = this.buildUrl(path, options.query)
    const response = await this.fetchImpl(url, {
      method,
      headers,
      body,
      signal: options.signal,
    })

    if (response.status === 204) return { data: undefined as T }

    const contentType = response.headers.get('content-type') ?? ''
    const payload: unknown = contentType.includes('json')
      ? await this.readJson(response, path)
      : await response.text()

    if (!response.ok) throw this.toError(response.status, path, payload)

    if (!isEnvelope(payload)) {
      return { data: this.transform<T>(payload, options.preserve) }
    }
    return {
      data: this.transform<T>(payload.data, options.preserve),
      ...(payload.meta === undefined
        ? {}
        : { meta: this.transform<M>(payload.meta) }),
    }
  }

  private async readJson(response: Response, path: string) {
    try {
      return await response.json()
    } catch (error) {
      if (!response.ok) return null
      if (!(error instanceof SyntaxError)) throw error
      throw new BylineApiError(
        response.status,
        'INVALID_RESPONSE',
        `Response body is not valid JSON: ${error.message}`,
        path,
      )
    }
  }

  private transform<T>(value: unknown, preserve?: readonly string[]): T {
    if (this.options.camelCase === false) return value as T
    return camelcaseKeys<T>(value, preserve)
  }

  private toError(status: number, path: string, payload: unknown) {
    const error =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload as { error?: Record<string, unknown> }).error
        : undefined
    if (error && typeof error === 'object') {
      return new BylineApiError(
        status,
        String(error.code ?? 'HTTP_ERROR'),
        String(error.message ?? `Request failed with status ${status}`),
        path,
        error.details === undefined ? undefined : camelcaseKeys(error.details),
      )
    }
    return new BylineApiError(
      status,
      'HTTP_ERROR',
      typeof payload === 'string' && payload
        ? payload.slice(0, 500)
        : `Request failed with status ${status}`,
      path,
    )
  }
}
