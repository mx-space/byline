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
  for (const c of catalog?.components ?? []) catalogUrls.add(c.url)
  return catalog
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
