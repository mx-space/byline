import { atomWithStorage } from 'jotai/utils'

import { SIDEBAR_COLLAPSED_STORAGE_KEY } from '~/constants/layout'

export const sidebarCollapsedAtom = atomWithStorage<boolean>(
  SIDEBAR_COLLAPSED_STORAGE_KEY,
  false,
  undefined,
  { getOnInit: true },
)
