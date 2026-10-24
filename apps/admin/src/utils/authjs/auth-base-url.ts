import { API_URL } from '~/constants/env'

export function resolveAuthBaseURL(apiURL = API_URL, origin?: string) {
  const baseURL = (apiURL || origin || location.origin).replace(/\/$/, '')

  return `${baseURL}/auth`
}
