import { API_URL } from '~/constants/env'

import { ApiRequestError, buildAdminRequestHeaders } from './http'

export interface DynamicCatalogEntry {
  parentUrl?: string
  description: string
  initialHeight: number
  name: string
  propsSchema: Record<string, unknown>
  url: string
}

export interface DynamicCatalog {
  components: DynamicCatalogEntry[]
  version: number
}

const DYNAMIC_COMPONENTS_PATH = '/dynamic-components'

export function getDynamicComponentsUrl(): string {
  return `${API_URL}${DYNAMIC_COMPONENTS_PATH}`
}

export async function getDynamicComponents(): Promise<DynamicCatalog> {
  return requestCatalog({ cache: 'no-store', method: 'GET' })
}

export async function registerDynamicComponentEntry(
  entry: DynamicCatalogEntry,
): Promise<DynamicCatalog> {
  return requestCatalog({
    body: JSON.stringify(entry),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
}

// Bypasses the shared JSON helpers: their deep key camelizing would rewrite
// the property names inside each entry's free-form propsSchema.
async function requestCatalog(init: RequestInit): Promise<DynamicCatalog> {
  const response = await fetch(getDynamicComponentsUrl(), {
    credentials: 'include',
    ...init,
    headers: buildAdminRequestHeaders(init.headers),
  })
  const body = (await response.json().catch(() => null)) as {
    data?: unknown
    error?: {
      code?: string
      details?: Record<string, unknown>
      message?: string
    }
  } | null

  if (!response.ok) {
    throw new ApiRequestError(
      body?.error?.message || response.statusText || 'Request failed',
      body?.error?.code,
      response.status,
      body?.error?.details,
    )
  }

  return parseCatalog(body && 'data' in body ? body.data : body)
}

function parseCatalog(value: unknown): DynamicCatalog {
  const record = asRecord(value)
  if (!Array.isArray(record.components) || typeof record.version !== 'number') {
    throw new TypeError('Invalid dynamic component catalog')
  }
  return {
    components: record.components.map(parseEntry),
    version: record.version,
  }
}

function parseEntry(value: unknown): DynamicCatalogEntry {
  const record = asRecord(value)
  const parentUrl = record.parentUrl ?? record.parent_url
  return {
    ...(typeof parentUrl === 'string' ? { parentUrl } : {}),
    description: String(record.description ?? ''),
    initialHeight: Number(record.initialHeight ?? record.initial_height ?? 0),
    name: String(record.name ?? ''),
    propsSchema: asRecord(record.propsSchema ?? record.props_schema),
    url: String(record.url ?? ''),
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
