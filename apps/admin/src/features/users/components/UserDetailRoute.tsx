import {
  Alert,
  Button,
  createStaticStyles,
  Descriptions,
  Drawer,
  Empty,
  Flexbox,
  Modal,
  SkeletonText,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'

import { ApiRequestError } from '~/api/http'
import type { UserProfileInput } from '~/api/users'
import {
  deactivateUser,
  getUser,
  reactivateUser,
  updateUser,
} from '~/api/users'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { adminQueryKeys } from '~/query/keys'

import { useUsersCopy } from '../copy'
import {
  canEditSignInIdentity,
  formatAdminTime,
  getUserDisplayName,
  getUserErrorMessage,
  getUserStatus,
} from '../utils/users'
import { AuthoredPosts } from './AuthoredPosts'
import { InviteUserModal } from './InviteUserModal'
import { UserAvatar } from './UserAvatar'
import { UserProfileForm } from './UserProfileForm'
import { useUsersRouteContext } from './users-route-context'
import { UserStatusTag } from './UserStatusTag'

const styles = createStaticStyles(({ css }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 24px;
  `,
}))

export function UserDetailRoute() {
  const copy = useUsersCopy()
  const { id = '' } = useParams<{ id: string }>()
  const ctx = useUsersRouteContext()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [error, setError] = useState('')

  const userQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getUser(id),
    queryKey: adminQueryKeys.users.detail(id),
  })
  const user = userQuery.data
  useDocumentTitle(user ? getUserDisplayName(user) : null)

  const save = useMutation({
    mutationFn: (input: UserProfileInput) => updateUser(id, input),
    onError: (saveError: unknown) => {
      toast.error(getUserErrorMessage(saveError, copy('saveFailed')))
    },
    onSuccess: async (updated) => {
      toast.success(copy('saved'))
      await ctx.onUserChanged(updated)
    },
  })
  const deactivate = useMutation({
    mutationFn: () => deactivateUser(id),
    onError: (statusError: unknown) => {
      setError(getUserErrorMessage(statusError, copy('statusFailed')))
    },
    onSuccess: async (updated) => {
      setError('')
      setConfirmOpen(false)
      toast.success(copy('deactivated'))
      await ctx.onUserChanged(updated)
    },
  })
  const enable = useMutation({
    mutationFn: () => reactivateUser(id),
    onError: (statusError: unknown) => {
      toast.error(getUserErrorMessage(statusError, copy('statusFailed')))
    },
    onSuccess: async (updated) => {
      toast.success(copy('enabled'))
      await ctx.onUserChanged(updated)
    },
  })

  const notFound =
    userQuery.error instanceof ApiRequestError && userQuery.error.status === 404
  const status = user ? getUserStatus(user) : null
  const isSelf = user?.id === ctx.currentUserId
  const name = user ? getUserDisplayName(user) : copy('loading')

  return (
    <Drawer
      maskClosable={!deactivate.isPending}
      onClose={ctx.onBack}
      open
      title={
        <Flexbox align="center" gap={8} horizontal>
          {user ? (
            <UserAvatar
              avatar={user.avatar}
              name={user.displayName || user.username}
              size={28}
            />
          ) : null}
          <Text ellipsis={{ tooltipWhenOverflow: true }}>{name}</Text>
          {status ? <UserStatusTag status={status} /> : null}
        </Flexbox>
      }
      width="min(400px, 100%)"
    >
      {userQuery.isLoading ? (
        <Flexbox gap={8}>
          <Text type="secondary">{copy('loading')}</Text>
          <SkeletonText />
        </Flexbox>
      ) : userQuery.isError || !user || !status ? (
        notFound || !userQuery.isError ? (
          <Empty title={copy('notFound')} />
        ) : (
          <Alert
            action={
              <Button onClick={() => void userQuery.refetch()}>
                {copy('retry')}
              </Button>
            }
            title={copy('detailError')}
            type="error"
          />
        )
      ) : (
        <div className={styles.body}>
          {status === 'profileOnly' ? (
            <Flexbox gap={8}>
              <Alert title={copy('profileOnlyHint')} type="info" />
              <Button onClick={() => setInviteOpen(true)}>
                {copy('inviteSignIn')}
              </Button>
            </Flexbox>
          ) : null}
          <UserProfileForm
            identityLocked={!canEditSignInIdentity(user, ctx.currentUserId)}
            key={user.updatedAt ?? user.id}
            onSubmit={async (input) => {
              try {
                await save.mutateAsync(input)
              } catch {
                return undefined
              }
            }}
            submitLabel={copy('saveProfile')}
            user={user}
          />
          <Descriptions
            column={1}
            items={[
              {
                children: formatAdminTime(user.lastLoginAt),
                key: 'lastLogin',
                label: copy('lastLogin'),
              },
              ...(user.deactivatedAt
                ? [
                    {
                      children: formatAdminTime(user.deactivatedAt),
                      key: 'deactivatedAt',
                      label: copy('deactivatedAt'),
                    },
                  ]
                : []),
            ]}
          />
          <AuthoredPosts userId={user.id} />
          <Flexbox gap={8}>
            {status === 'deactivated' ? (
              <Button
                loading={enable.isPending}
                onClick={() => enable.mutate()}
              >
                {copy('enable')}
              </Button>
            ) : (
              <Tooltip title={isSelf ? copy('deactivateSelf') : undefined}>
                <span>
                  <Button
                    danger
                    disabled={isSelf}
                    loading={deactivate.isPending}
                    onClick={() => {
                      setError('')
                      setConfirmOpen(true)
                    }}
                    title={isSelf ? copy('deactivateSelf') : copy('deactivate')}
                  >
                    {copy('deactivate')}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Flexbox>
          <Modal
            cancelText={copy('cancel')}
            confirmLoading={deactivate.isPending}
            maskClosable={!deactivate.isPending}
            okButtonProps={{ danger: true }}
            okText={copy('deactivate')}
            onCancel={() => {
              if (!deactivate.isPending) {
                setConfirmOpen(false)
                setError('')
              }
            }}
            onOk={() => deactivate.mutate()}
            open={confirmOpen}
            title={copy('deactivateTitle', { name })}
            width="min(400px, 100%)"
          >
            <Flexbox gap={12}>
              <Text>{copy('deactivateBody')}</Text>
              {error ? <Alert title={error} type="error" /> : null}
            </Flexbox>
          </Modal>
          <InviteUserModal
            onClose={() => setInviteOpen(false)}
            onCreated={() => undefined}
            open={inviteOpen}
            user={user}
          />
        </div>
      )}
    </Drawer>
  )
}

export default UserDetailRoute
