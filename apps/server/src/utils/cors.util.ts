import wcmatch from 'wildcard-match'

export const parseOriginHost = (origin: string | undefined): string | null => {
  if (!origin) return null
  try {
    return new URL(origin).host || null
  } catch {
    return null
  }
}

export const createHostMatcher = (patterns: readonly string[]) => {
  const matchers = patterns.map((pattern) => wcmatch(pattern))
  return (host: string) => matchers.some((match) => match(host))
}
