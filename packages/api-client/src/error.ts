export class BylineApiError extends Error {
  override readonly name = 'BylineApiError'

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly path: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export const isBylineApiError = (
  error: unknown,
  code?: string,
): error is BylineApiError =>
  error instanceof BylineApiError && (code === undefined || error.code === code)
