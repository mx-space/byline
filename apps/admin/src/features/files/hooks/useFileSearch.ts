import { useEffect, useMemo, useState } from 'react'

export function useFileSearch<T>(
  source: T[],
  getName: (item: T) => string,
  delayMs = 100,
) {
  const [query, setQuery] = useState('')
  const [deferredQuery, setDeferredQuery] = useState('')

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed === deferredQuery) return
    const handle = setTimeout(() => setDeferredQuery(trimmed), delayMs)
    return () => clearTimeout(handle)
  }, [query, deferredQuery, delayMs])

  const items = useMemo(() => {
    if (!deferredQuery) return source
    const needle = deferredQuery.toLowerCase()
    return source.filter((item) => getName(item).toLowerCase().includes(needle))
  }, [source, deferredQuery, getName])

  return { items, query, setQuery }
}
