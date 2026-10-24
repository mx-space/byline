import {
  Alert,
  createStaticStyles,
  cx,
  Empty,
  Flexbox,
  SearchBar,
  Segmented,
  Tag,
  Text,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import {
  type ProColumns,
  ProTable,
  type ProTableActionType,
} from '@lobehub/ui/pro-table'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserRoundPen } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router'

import type { UserDetail, UserStatusFilter } from '~/api/users'
import { getMe, getUsers } from '~/api/users'
import { adminQueryKeys } from '~/query/keys'
import { Page } from '~/ui/page'
import { emptyOr } from '~/ui/placeholders'
import {
  pinStart,
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import { useUsersCopy } from '../copy'
import { getUserStatus, parseUserStatusFilter, showValue } from '../utils/users'
import { CreateAuthorModal } from './CreateAuthorModal'
import { InviteUserModal } from './InviteUserModal'
import { PendingInvites } from './PendingInvites'
import { UserAvatar } from './UserAvatar'
import { UsersRouteContext } from './users-route-context'
import { UserStatusTag } from './UserStatusTag'

const styles = createStaticStyles(({ css, cssVar }) => ({
  name: css`
    min-width: 0;
    color: ${cssVar.colorText};
    text-decoration: none;
  `,
  filters: css`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    min-width: 0;
  `,
  headerTitle: css`
    white-space: nowrap;
  `,
  row: css`
    cursor: pointer;
  `,
  search: css`
    flex: 1 1 16rem;
    min-width: 12rem;
    max-width: 24rem;
  `,
  selected: css`
    background: ${cssVar.colorPrimaryBg};
  `,
  table: css`
    min-width: 0;
  `,
}))

export function UsersRouteViewContent() {
  const copy = useUsersCopy()
  const table = useRecordTable()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const status = parseUserStatusFilter(searchParams.get('status'))
  const search = searchParams.toString()
  const [draft, setDraft] = useState(q)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [authorOpen, setAuthorOpen] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [listError, setListError] = useState(false)
  const [showStale, setShowStale] = useState(false)
  const hasRows = useRef(false)
  const actionRef = useRef<ProTableActionType>(undefined)

  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
  })

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    if (draft === q) return
    const timer = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          const trimmed = draft.trim()
          if (trimmed) next.set('q', trimmed)
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draft, q, setSearchParams])

  const setStatus = (value: UserStatusFilter) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === 'all') next.delete('status')
        else next.set('status', value)
        return next
      },
      { replace: true },
    )
  }

  const clearFilters = () => {
    setDraft('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const openUser = (id: string) => {
    navigate({
      pathname: `/users/${id}`,
      search: search ? `?${search}` : '',
    })
  }

  const ctxValue = useMemo(
    () => ({
      currentUserId: meQuery.data?.id ?? null,
      onBack: () =>
        navigate({
          pathname: '/users',
          search: search ? `?${search}` : '',
        }),
      onUserChanged: async (user: UserDetail) => {
        queryClient.setQueryData(adminQueryKeys.users.detail(user.id), user)
        await actionRef.current?.reload()
      },
    }),
    [meQuery.data?.id, navigate, queryClient, search],
  )

  const columns = useMemo<ProColumns<UserDetail>[]>(
    () => [
      {
        dataIndex: 'displayName',
        render: (_dom, user) => (
          <Flexbox align="center" allowShrink gap={8} horizontal>
            <UserAvatar
              avatar={user.avatar}
              name={user.displayName || user.username}
              size={32}
            />
            <Link
              className={styles.name}
              to={{
                pathname: `/users/${user.id}`,
                search: search ? `?${search}` : '',
              }}
            >
              <Text ellipsis={{ tooltipWhenOverflow: true }}>
                {emptyOr(user.displayName || user.username)}
              </Text>
            </Link>
            {user.id === meQuery.data?.id ? (
              <Tag>{copy('currentAccount')}</Tag>
            ) : null}
          </Flexbox>
        ),
        title: copy('columnName'),
        ...pinStart(table.pin),
      },
      {
        dataIndex: 'email',
        render: (_dom, user) => (
          <Text ellipsis={{ tooltipWhenOverflow: true }} type="secondary">
            {showValue(user.email)}
          </Text>
        ),
        responsive: ['md'],
        title: copy('columnEmail'),
        width: 240,
      },
      {
        dataIndex: 'status',
        render: (_dom, user) => <UserStatusTag status={getUserStatus(user)} />,
        title: (
          <span className={styles.headerTitle}>{copy('columnStatus')}</span>
        ),
        width: 160,
      },
    ],
    [copy, meQuery.data?.id, search, table.pin],
  )

  const filtered = status !== 'all' || q.trim().length > 0
  const emptyNode =
    listError && !showStale ? (
      <Empty
        action={
          <Button onClick={() => void actionRef.current?.reload()}>
            {copy('retry')}
          </Button>
        }
        title={copy('listError')}
      />
    ) : filtered ? (
      <Empty
        action={<Button onClick={clearFilters}>{copy('clearFilters')}</Button>}
        title={copy('emptyFiltered')}
      />
    ) : (
      <Empty
        action={
          <Button onClick={() => setInviteOpen(true)}>{copy('invite')}</Button>
        }
        description={copy('description')}
        title={copy('emptyTitle')}
      />
    )

  return (
    <UsersRouteContext.Provider value={ctxValue}>
      <Page
        actions={
          <>
            <Button icon={UserRoundPen} onClick={() => setAuthorOpen(true)}>
              {copy('addAuthor')}
            </Button>
            <Button
              icon={UserPlus}
              onClick={() => setInviteOpen(true)}
              type="primary"
            >
              {copy('invite')}
            </Button>
          </>
        }
        count={total ?? undefined}
        description={copy('description')}
        title={copy('title')}
        width="wide"
      >
        {showStale && listError ? (
          <Alert
            action={
              <Button onClick={() => void actionRef.current?.reload()}>
                {copy('retry')}
              </Button>
            }
            title={copy('listStale')}
            type="warning"
          />
        ) : null}
        <PendingInvites />
        <div className={styles.table}>
          <ProTable<UserDetail>
            className={recordTableStyles.root}
            actionRef={actionRef}
            columnEmptyText="--"
            columns={columns}
            scroll={recordTableScroll(columns, table)}
            tableLayout="fixed"
            locale={{ emptyText: emptyNode }}
            onLoad={(rows) => {
              hasRows.current = rows.length > 0
              setHasLoaded(true)
              setListError(false)
              setShowStale(false)
            }}
            onRequestError={() => {
              setShowStale(hasRows.current)
              setListError(true)
              setHasLoaded(true)
            }}
            onRow={(user) => ({
              onClick: (event) => {
                const target = event.target
                if (target instanceof Element && target.closest('a,button')) {
                  return
                }
                openUser(user.id)
              },
            })}
            options={{
              density: false,
              fullScreen: false,
              reload: true,
              search: false,
              setting: false,
            }}
            pagination={{ hideOnSinglePage: true, pageSize: 20 }}
            params={{ q, status }}
            request={async (requestParams) => {
              const keyword =
                typeof requestParams.q === 'string'
                  ? requestParams.q.trim()
                  : ''
              const result = await getUsers({
                page: requestParams.current ?? 1,
                search: keyword || undefined,
                size: Math.min(requestParams.pageSize ?? 20, 100),
                status: parseUserStatusFilter(
                  typeof requestParams.status === 'string'
                    ? requestParams.status
                    : null,
                ),
              })
              setTotal(result.pagination.total)
              return {
                data: result.data,
                success: true,
                total: result.pagination.total,
              }
            }}
            rowClassName={(user) =>
              cx(styles.row, user.id === params.id && styles.selected)
            }
            rowKey="id"
            search={false}
            tableRender={(_props, dom) =>
              !hasLoaded && !listError ? <TableSkeleton rows={6} /> : dom
            }
            toolBarRender={() => [
              <div className={styles.filters} key="filters">
                <div className={styles.search}>
                  <SearchBar
                    aria-label={copy('searchPlaceholder')}
                    enableShortKey={false}
                    onInputChange={setDraft}
                    placeholder={copy('searchPlaceholder')}
                    value={draft}
                  />
                </div>
                <Segmented
                  aria-label={copy('filterStatus')}
                  onChange={(value) => setStatus(value as UserStatusFilter)}
                  options={[
                    { label: copy('statusAll'), value: 'all' },
                    { label: copy('statusActive'), value: 'active' },
                    { label: copy('statusProfileOnly'), value: 'profile_only' },
                    { label: copy('statusDeactivated'), value: 'deactivated' },
                  ]}
                  value={status}
                />
              </div>,
            ]}
            variant="outlined"
          />
        </div>
        <InviteUserModal
          onClose={() => setInviteOpen(false)}
          onCreated={() => {
            void actionRef.current?.reload()
          }}
          open={inviteOpen}
        />
        <CreateAuthorModal
          onClose={() => setAuthorOpen(false)}
          onCreated={(user) => {
            setAuthorOpen(false)
            void actionRef.current?.reload()
            openUser(user.id)
          }}
          open={authorOpen}
        />
        <Outlet />
      </Page>
    </UsersRouteContext.Provider>
  )
}
