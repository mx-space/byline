import type { InitResponse } from '../types/login'

export function isInitEnvelope(
  value: InitResponse | { data?: InitResponse },
): value is { data?: InitResponse } {
  return 'data' in value
}

export function buildHashRouteUrl(path: string) {
  return `${window.location.origin}${window.location.pathname}#${path}`
}

export function readHashSearchParam(name: string) {
  const hash = window.location.hash
  const queryIndex = hash.indexOf('?')
  const fromHash =
    queryIndex === -1
      ? null
      : new URLSearchParams(hash.slice(queryIndex + 1)).get(name)
  return fromHash ?? new URLSearchParams(window.location.search).get(name)
}
