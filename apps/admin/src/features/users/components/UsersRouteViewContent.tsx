import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserRoundPen, Users } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import type { UserDetail, UserStatusFilter } from '~/api/users'
import { getMe, getUsers } from '~/api/users'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { MasterDetailShell } from '~/ui/layout/master-detail-shell'
import { MobileHeaderAffordance } from '~/ui/layout/mobile-header-affordance'
import { EmptyState } from '~/ui/patterns/EmptyState'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SegmentedControl } from '~/ui/primitives/segmented-control'
import { TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { presentCreateAuthor } from './CreateAuthorModal'
import { presentInviteUser } from './InviteUserModal'
import { PendingInvites } from './PendingInvites'
import { UserList } from './UserList'
import { UsersRouteContext } from './users-route-context'

const USER_PAGE_SIZE = 100

export function UsersRouteViewContent() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const [status, setStatus] = useState<UserStatusFilter>('all')
  const [search, setSearch] = useState('')
  const trimmedSearch = search.trim()

  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
  })
  const usersQuery = useQuery({
    queryFn: () =>
      getUsers({
        page: 1,
        search: trimmedSearch,
        size: USER_PAGE_SIZE,
        status,
      }),
    queryKey: adminQueryKeys.users.list({ search: trimmedSearch, status }),
  })
  const users = usersQuery.data?.data ?? []
  const total = usersQuery.data?.pagination.total ?? users.length

  const invalidateUsers = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users.root }),
    [queryClient],
  )

  const onBack = useCallback(() => navigate('/users'), [navigate])

  const ctxValue = useMemo(
    () => ({
      currentUserId: meQuery.data?.id ?? null,
      onBack,
      onUserChanged: async (user: UserDetail) => {
        queryClient.setQueryData(adminQueryKeys.users.detail(user.id), user)
        await invalidateUsers()
      },
    }),
    [invalidateUsers, meQuery.data?.id, onBack, queryClient],
  )

  const statusOptions: { label: string; value: UserStatusFilter }[] = [
    { label: t('users.filter.all'), value: 'all' },
    { label: t('users.filter.active'), value: 'active' },
    { label: t('users.filter.profileOnly'), value: 'profile_only' },
    { label: t('users.filter.deactivated'), value: 'deactivated' },
  ]

  const invite = async () => {
    const created = await presentInviteUser()
    if (created) await invalidateUsers()
  }

  const createAuthor = async () => {
    const created = await presentCreateAuthor()
    if (!created) return
    await invalidateUsers()
    navigate(`/users/${created.id}`)
  }

  return (
    <UsersRouteContext.Provider value={ctxValue}>
      <MasterDetailShell
        emptyDetail={
          <div className="flex h-full items-center justify-center bg-surface-card">
            <EmptyState
              description={t('users.detailEmpty.description')}
              icon={Users}
              title={t('users.detailEmpty.title')}
            />
          </div>
        }
        list={
          <section className="flex h-full min-h-0 flex-col">
            <div
              className={cn(
                'flex shrink-0 items-center justify-between border-b border-border px-4',
                APP_SHELL_HEADER_HEIGHT_CLASS,
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <MobileHeaderAffordance />
                <span className="text-sm font-semibold text-fg">
                  {t('routes.users.title')}
                </span>
                <span className="text-xs text-fg-subtle">{total}</span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  aria-label={t('users.author.title')}
                  className="h-8 px-2"
                  onClick={() => void createAuthor()}
                  title={t('users.author.title')}
                  type="button"
                  variant="subtle"
                >
                  <UserRoundPen aria-hidden="true" className="size-3.5" />
                </Button>
                <Button
                  className="h-8 px-2"
                  onClick={() => void invite()}
                  type="button"
                >
                  <UserPlus aria-hidden="true" className="size-3.5" />
                  {t('users.invite.action')}
                </Button>
              </div>
            </div>
            <div className="grid shrink-0 gap-2 border-b border-border px-4 py-3">
              <TextInput
                aria-label={t('users.search')}
                onChange={setSearch}
                placeholder={t('users.search')}
                value={search}
              />
              <SegmentedControl
                aria-label={t('users.filter.label')}
                fill
                onValueChange={setStatus}
                options={statusOptions}
                value={status}
              />
            </div>
            <Scroll className="flex-1">
              <PendingInvites />
              {usersQuery.isLoading ? (
                <div className="px-4 py-6 text-sm text-fg-muted">
                  {t('common.loading')}
                </div>
              ) : users.length === 0 ? (
                <div className="px-4 py-6 text-sm text-fg-muted">
                  {t('users.list.empty')}
                </div>
              ) : (
                <UserList
                  currentUserId={meQuery.data?.id ?? null}
                  onSelect={(user) => navigate(`/users/${user.id}`)}
                  selectedId={params.id ?? null}
                  users={users}
                />
              )}
            </Scroll>
          </section>
        }
      />
    </UsersRouteContext.Provider>
  )
}
