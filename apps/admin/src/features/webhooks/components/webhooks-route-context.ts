import { createContext, useContext } from 'react'

export interface WebhooksRouteContextValue {
  onBack: () => void
  onDeleted: (id: string) => void
}

export const WebhooksRouteContext =
  createContext<WebhooksRouteContextValue | null>(null)

export function useWebhooksRouteContext() {
  const value = useContext(WebhooksRouteContext)
  if (!value) {
    throw new Error(
      'useWebhooksRouteContext must be used inside WebhooksRouteContext',
    )
  }
  return value
}
