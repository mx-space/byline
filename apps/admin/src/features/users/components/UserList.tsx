import type { UserDetail } from '~/api/users'
import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import { getUserDisplayName, getUserStatus } from '../utils/users'
import { UserAvatar } from './UserAvatar'
import { UserRoleBadge } from './UserRoleBadge'
import { UserStatusBadge } from './UserStatusBadge'

export function UserList(props: {
  currentUserId: string | null
  onSelect: (user: UserDetail) => void
  selectedId: string | null
  users: UserDetail[]
}) {
  const { t } = useI18n()
  return (
    <>
      {props.users.map((user) => {
        const status = getUserStatus(user)
        return (
          <button
            className={cn(
              'flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0',
              props.selectedId === user.id
                ? 'bg-accent-soft'
                : 'hover:bg-surface-inset',
            )}
            key={user.id}
            onClick={() => props.onSelect(user)}
            type="button"
          >
            <UserAvatar
              avatar={user.avatar}
              className={cn(status === 'deactivated' && 'opacity-50')}
              name={getUserDisplayName(user)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-fg">
                  {getUserDisplayName(user)}
                </span>
                {user.id === props.currentUserId ? (
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {t('users.list.you')}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-xs text-fg-muted">
                {user.username ? `@${user.username}` : user.email || '-'}
              </div>
            </div>
            {status === 'active' ? (
              <UserRoleBadge permissions={user.permissions} />
            ) : (
              <UserStatusBadge status={status} />
            )}
          </button>
        )
      })}
    </>
  )
}
