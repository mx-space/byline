import { type LobeAppearance, setLobeTheme } from '@lobehub/ui'
import { useEffect } from 'react'

import type { ThemeMode } from '~/store/theme'

const resolveAppearance = (
  mode: ThemeMode,
  query: MediaQueryList,
): LobeAppearance => {
  if (mode === 'dark' || mode === 'light') return mode
  return query.matches ? 'dark' : 'light'
}

export function useSyncLobeAppearance(themeMode: ThemeMode) {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const appearance = resolveAppearance(themeMode, query)
      setLobeTheme({ appearance })
      document.documentElement.style.colorScheme = appearance
      document.documentElement.classList.toggle('dark', appearance === 'dark')
    }

    apply()
    if (themeMode === 'dark' || themeMode === 'light') return

    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [themeMode])
}
