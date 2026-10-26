const API_PATH = /^\/api\/v\d+\/./

export const stripApiTrailingSlash = (url: string) => {
  const queryAt = url.indexOf('?')
  const path = queryAt === -1 ? url : url.slice(0, queryAt)
  if (!API_PATH.test(path) || !path.endsWith('/')) return url
  return path.replace(/\/+$/, '') + (queryAt === -1 ? '' : url.slice(queryAt))
}
