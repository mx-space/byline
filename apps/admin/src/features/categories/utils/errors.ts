import { ApiRequestError } from '~/api/http'

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

export function isForbiddenError(error: unknown) {
  return isApiError(error) && (error.status === 401 || error.status === 403)
}

export function isNotFoundError(error: unknown) {
  if (!isApiError(error)) return false
  return (
    error.status === 404 ||
    error.code === 'CATEGORY_NOT_FOUND' ||
    error.code === 'NOT_FOUND'
  )
}

export function isCategoryHasPostsError(error: unknown) {
  return isApiError(error) && error.code === 'CATEGORY_HAS_POSTS'
}
