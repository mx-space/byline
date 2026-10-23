export const EMPTY_VALUE = '--'

export function formatBytes(bytes: null | number | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return EMPTY_VALUE
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function formatUploadedAt(
  value: null | number | string | undefined,
): string {
  if (value == null || value === '') return EMPTY_VALUE
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function deletionCounts(attempted: number, deletedCount: number) {
  const success = Number.isFinite(deletedCount) ? Math.max(0, deletedCount) : 0
  const failed = Math.max(0, attempted - success)
  return { failed, success }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
