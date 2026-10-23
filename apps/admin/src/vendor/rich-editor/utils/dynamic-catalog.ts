import type { ChatMessage } from '@haklex/rich-agent-core'
import { useEffect, useState } from 'react'

import type {
  DynamicCatalog,
  DynamicCatalogEntry,
} from '~/api/dynamic-components'
import {
  getDynamicComponents,
  getDynamicComponentsUrl,
  registerDynamicComponentEntry,
} from '~/api/dynamic-components'
import { ApiRequestError } from '~/api/http'
import { API_URL } from '~/constants/env'

export type { DynamicCatalog, DynamicCatalogEntry }

export function getDynamicCatalogUrl(): string {
  return getDynamicComponentsUrl()
}

const catalogUrls = new Set<string>()

let cachedCatalogPromise: Promise<DynamicCatalog | null> | null = null

function rememberCatalog(catalog: DynamicCatalog | null) {
  for (const c of catalog?.components ?? []) {
    catalogUrls.add(c.url)
    if (c.parentUrl) catalogUrls.add(c.parentUrl)
    for (const url of c.previousUrls ?? []) catalogUrls.add(url)
  }
  return catalog
}

export function currentCatalogEntries(
  entries: DynamicCatalogEntry[],
): DynamicCatalogEntry[] {
  const superseded = new Set(entries.map((entry) => entry.parentUrl))
  return entries.filter((entry) => !superseded.has(entry.url))
}

export function resolveCatalogEntry(
  entries: DynamicCatalogEntry[],
  url: string,
): { entry: DynamicCatalogEntry; outdated: boolean } | null {
  const successorOf = (target: string) =>
    entries.find((entry) => entry.parentUrl === target)
  let entry =
    entries.find((item) => item.url === url) ??
    successorOf(url) ??
    entries.find((item) => item.previousUrls?.includes(url))
  if (!entry) return null
  const visited = new Set([entry.url])
  for (let next = successorOf(entry.url); next; next = successorOf(entry.url)) {
    if (visited.has(next.url)) break
    visited.add(next.url)
    entry = next
  }
  return { entry, outdated: entry.url !== url }
}

const NAME_CONFLICT_CODE = 'DYNAMIC_COMPONENT_NAME_CONFLICT'
const MAX_NAME_ATTEMPTS = 20

export async function registerDynamicComponent(
  entry: DynamicCatalogEntry,
): Promise<DynamicCatalogEntry> {
  for (let attempt = 1; ; attempt++) {
    const candidate =
      attempt === 1 ? entry : { ...entry, name: `${entry.name} ${attempt}` }
    try {
      const catalog = await registerDynamicComponentEntry(candidate)
      rememberCatalog(catalog)
      catalogUrls.add(entry.url)
      cachedCatalogPromise = Promise.resolve(catalog)
      return candidate
    } catch (error) {
      const conflict =
        error instanceof ApiRequestError && error.code === NAME_CONFLICT_CODE
      if (!conflict || attempt >= MAX_NAME_ATTEMPTS) throw error
    }
  }
}

export function primeDynamicCatalog(catalog: DynamicCatalog) {
  rememberCatalog(catalog)
  cachedCatalogPromise = Promise.resolve(catalog)
}

export function isAllowedDynamicUrl(url: string): boolean {
  if (catalogUrls.has(url)) return true
  try {
    const api = new URL(API_URL)
    const resolved = new URL(url, api.origin)
    return (
      resolved.origin === api.origin && resolved.pathname.includes('/objects/')
    )
  } catch {
    return false
  }
}

export function buildDynamicCatalogSystemMessage(
  catalog: DynamicCatalog,
): ChatMessage {
  const entries = catalog.components
    .map(
      (c) =>
        `- ${c.name}: ${c.description}\n  url: ${c.url}\n  initial-height: ${c.initialHeight}\n  props schema: ${JSON.stringify(c.propsSchema)}`,
    )
    .join('\n')

  return {
    role: 'system',
    content: `## Dynamic Component Catalog\n\nThe following interactive components are available for <dynamic> nodes. Use exactly these URLs and the listed initial-height; props must conform to each schema.\n\n${entries}`,
  }
}

function fetchDynamicCatalog(): Promise<DynamicCatalog | null> {
  cachedCatalogPromise ??= getDynamicComponents()
    .catch(() => null)
    .then(rememberCatalog)
  return cachedCatalogPromise
}

export async function findCatalogEntryForUrl(
  url: string,
): Promise<DynamicCatalogEntry | null> {
  const catalog = await fetchDynamicCatalog()
  return catalog
    ? (resolveCatalogEntry(catalog.components, url)?.entry ?? null)
    : null
}

export function useDynamicCatalog(): DynamicCatalog | null {
  const [catalog, setCatalog] = useState<DynamicCatalog | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchDynamicCatalog().then((next) => {
      if (!cancelled) setCatalog(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return catalog
}

export function useDynamicCatalogSystemMessages(): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchDynamicCatalog().then((catalog) => {
      if (cancelled || !catalog?.components?.length) return
      setMessages([buildDynamicCatalogSystemMessage(catalog)])
    })
    return () => {
      cancelled = true
    }
  }, [])

  return messages
}
