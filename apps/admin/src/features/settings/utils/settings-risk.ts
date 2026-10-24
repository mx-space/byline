import type { ConfigFormField } from '~/api/options'

const SECRET_KEY =
  /api[-_]?key|secret(?:key|id)?|password|private[-_]?key|^pass$/i

export function isSecretField(field: ConfigFormField) {
  if (field.ui.component === 'password') return true
  if (field.key === 'secretId') return false
  return SECRET_KEY.test(field.key)
}

export function hasPath(source: unknown, path: string) {
  const parts = path.split('.')
  let current: unknown = source
  for (const part of parts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return false
    }
    if (!Object.hasOwn(current, part)) return false
    current = (current as Record<string, unknown>)[part]
  }
  return true
}
