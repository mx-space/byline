export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function describeDraftError(error: unknown, fallback: string) {
  const message = getErrorMessage(error, fallback)
  if (!message || message === 'Request failed') return fallback
  return message
}
