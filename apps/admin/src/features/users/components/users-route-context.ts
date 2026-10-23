import { createContext, useContext } from 'react'

import type { UserDetail } from '~/api/users'

export interface UsersRouteContextValue {
  currentUserId: string | null
  currentUserPermissions: number
  onBack: () => void
  onUserChanged: (user: UserDetail) => Promise<void>
}

export const UsersRouteContext = createContext<UsersRouteContextValue | null>(
  null,
)

export function useUsersRouteContext(): UsersRouteContextValue {
  const ctx = useContext(UsersRouteContext)
  if (!ctx) {
    throw new Error(
      'useUsersRouteContext must be used inside <UsersRouteContext.Provider>',
    )
  }
  return ctx
}
