import {
  EventScope,
  type WebhookEventRecord,
  type WebhookModel,
} from '~/api/webhooks'

import { scopeOptions } from '../constants'
import type { WebhookCopyKey } from '../copy'

type Copy = (
  key: WebhookCopyKey,
  values?: Record<string, number | string>,
) => string

export const HEALTH_CHECK_EVENT = 'health_check'

export function endpointUrl(
  webhook?: Pick<WebhookModel, 'payloadUrl' | 'url'> | null,
) {
  return webhook?.payloadUrl?.trim() || webhook?.url?.trim() || ''
}

export function splitEndpoint(url: string) {
  try {
    const parsed = new URL(url)
    const path = `${parsed.pathname === '/' ? '' : parsed.pathname}${parsed.search}`
    return { host: parsed.host, path: path || '/' }
  } catch {
    return { host: url, path: '' }
  }
}

export function webhookCreatedAt(webhook: WebhookModel) {
  const legacy = (webhook as WebhookModel & { timestamp?: string | null })
    .timestamp
  return webhook.created || legacy || null
}

export function scopeText(scope: number | null | undefined, text: Copy) {
  const bits = scope ?? 0
  const labels = scopeOptions
    .filter((option) => (bits & option.value) === option.value)
    .map((option) => text(option.labelKey))
  if (labels.length === 0) return text('scopeNone')
  return labels.join(text('scopeSeparator'))
}

export function formatAbsoluteTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatJson(content: unknown) {
  if (content == null || content === '') return ''
  if (typeof content === 'string') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      return content
    }
  }
  try {
    return JSON.stringify(content, null, 2)
  } catch {
    return ''
  }
}

export function errorText(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== 'Request failed'
  ) {
    return error.message.trim()
  }
  return fallback
}

export type DeliveryFact =
  | { detail?: string; status: number; type: 'http' }
  | { message: string; type: 'message' }
  | { type: 'none' }
  | { message: string; type: 'ssrf' }
  | { type: 'success' }

export function describeDelivery(
  record: Pick<WebhookEventRecord, 'response' | 'status' | 'success'>,
): DeliveryFact {
  if (record.success === true) return { type: 'success' }
  const response = record.response
  if (response && typeof response === 'object') {
    const body = response as Record<string, unknown>
    if (body.error === 'SSRF_BLOCKED') {
      return {
        message: typeof body.message === 'string' ? body.message.trim() : '',
        type: 'ssrf',
      }
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return { message: body.message.trim().slice(0, 200), type: 'message' }
    }
    const detail = readDetail(body.data)
    if (record.status > 0 || detail) {
      return { detail, status: record.status, type: 'http' }
    }
  }
  if (record.status > 0) return { status: record.status, type: 'http' }
  return { type: 'none' }
}

function readDetail(data: unknown) {
  if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 200)
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string' && message.trim())
      return message.trim().slice(0, 200)
  }
  return undefined
}

export function failureText(fact: DeliveryFact, text: Copy) {
  if (fact.type === 'success') return ''
  if (fact.type === 'ssrf') {
    return fact.message
      ? text('ssrfDetail', { message: fact.message })
      : text('ssrf')
  }
  if (fact.type === 'message') return fact.message
  if (fact.type === 'http' && fact.status > 0) {
    return fact.detail
      ? text('httpStatusDetail', { detail: fact.detail, status: fact.status })
      : text('httpStatus', { status: fact.status })
  }
  return text('noResponse')
}

/**
 * The server stamps the record before sending and the response after it
 * returns, so the gap is the delivery time including retries.
 */
export function deliveryDuration(
  record: Pick<WebhookEventRecord, 'response' | 'timestamp'>,
) {
  const started = Date.parse(record.timestamp)
  const response = record.response
  if (Number.isNaN(started) || !response || typeof response !== 'object')
    return null
  const finished = (response as { timestamp?: unknown }).timestamp
  if (typeof finished !== 'number') return null
  const duration = finished - started
  return duration >= 0 ? duration : null
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`
}

export function responseBody(response: unknown) {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data?: unknown }).data
  }
  return response
}

export function responseHeaders(response: unknown) {
  if (response && typeof response === 'object' && 'headers' in response) {
    return (response as { headers?: unknown }).headers
  }
  return undefined
}

export interface EventGroup {
  events: string[]
  key: string
}

export function groupEvents(events: string[]): EventGroup[] {
  const groups = new Map<string, string[]>()
  for (const event of events) {
    const key = event.includes('.') ? event.slice(0, event.indexOf('.')) : event
    const list = groups.get(key)
    if (list) list.push(event)
    else groups.set(key, [event])
  }
  return [...groups].map(([key, list]) => ({ events: list, key }))
}

export function generateSecret() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function defaultScope() {
  return EventScope.TO_SYSTEM
}
