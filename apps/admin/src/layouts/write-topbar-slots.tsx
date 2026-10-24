import { createContext, useContext } from 'react'

export interface WriteTopbarSlots {
  actions: HTMLElement | null
  identity: HTMLElement | null
  setPageTitle: (title: string | null) => void
}

export const WriteTopbarSlotsContext = createContext<WriteTopbarSlots>({
  actions: null,
  identity: null,
  setPageTitle: () => {},
})

export function useWriteTopbarSlots() {
  return useContext(WriteTopbarSlotsContext)
}
