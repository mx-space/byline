import { isDeepEqual } from './settings'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isBlank(value: unknown) {
  return value === undefined || value === null || value === ''
}

/** Counts changed leaves; arrays count as one leaf. */
export function countChanges(origin: unknown, current: unknown): number {
  if (isPlainObject(origin) || isPlainObject(current)) {
    const left = isPlainObject(origin) ? origin : {}
    const right = isPlainObject(current) ? current : {}
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    let count = 0
    for (const key of keys) count += countChanges(left[key], right[key])
    return count
  }
  if (isBlank(origin) && isBlank(current)) return 0
  return isDeepEqual(origin, current) ? 0 : 1
}

/** A blank value falls back to the server default, so it is not a change from it. */
export function differsFromDefault(value: unknown, defaultValue: unknown) {
  if (isBlank(value) || isBlank(defaultValue)) return false
  return !isDeepEqual(value, defaultValue)
}

export interface ConfigValidationIssue {
  message: string
  path?: string
}

/** Splits the server's `path: message; path: message` validation summary. */
export function parseConfigValidationMessage(
  message: string,
): ConfigValidationIssue[] {
  return message
    .split(/;\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^([\w.]+):\s*(\S.*)$/.exec(part)
      return match ? { message: match[2]!, path: match[1]! } : { message: part }
    })
}
