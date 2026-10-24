import { useEffect, useState } from 'react'

const slowAfterMs = 10_000

export function useSlowPending(pending: boolean) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!pending) {
      setSlow(false)
      return
    }
    const timer = window.setTimeout(() => setSlow(true), slowAfterMs)
    return () => window.clearTimeout(timer)
  }, [pending])

  return slow
}
