import {
  Alert,
  createStaticStyles,
  DraggablePanel,
  Empty,
  Flexbox,
  Modal,
  Text,
  toast,
} from '@lobehub/ui'
import { PageHeader } from '@lobehub/ui/dashboard'
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
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { ARTICLE_MAX_WIDTH } from '~/ui/page'
import { FormSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useUsersCopy } from '../copy'
import {
  canEditSignInIdentity,
  getUserDisplayName,
  getUserErrorMessage,
  getUserStatus,
} from '../utils/users'
import { AuthoredPosts } from './AuthoredPosts'
import { InviteUserModal } from './InviteUserModal'
import { UserIdentityPanel, UserIdentitySkeleton } from './UserIdentityPanel'
import { UserProfileForm } from './UserProfileForm'
import { useUsersRouteContext } from './users-route-context'

const styles = createStaticStyles(({ css, cssVar }) => ({
  column: css`
    display: flex;
    flex-direction: column;
    gap: 24px;

    width: 100%;
    max-width: ${ARTICLE_MAX_WIDTH};
    margin-inline: auto;
  `,
  fallback: css`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;

    height: 100%;
    min-height: 0;
    padding: 24px;
  `,
  frame: css`
    display: flex;
    flex: 1;
    align-items: stretch;

    height: 100%;
    min-width: 0;
    min-height: 0;
  `,
  identity: css`
    overflow: auto;
    display: flex;
    flex-direction: column;

    block-size: 100%;
    padding-block: 24px;
    padding-inline: 20px 16px;

    background: ${cssVar.colorBgContainer};
  `,
  panel: css`
    flex: none;
    height: 100%;
    min-width: 0;
    min-height: 0;
  `,
  main: css`
    overflow: auto;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 24px;

    min-width: 0;
    min-height: 0;
    padding: 24px;
  `,
  mobile: css`
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;

    height: 100%;
    min-height: 0;
    padding: 16px;
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
}))

export function UserDetailRoute() {
  const copy = useUsersCopy()
  const { t } = useI18n()
  const { id = '' } = useParams<{ id: string }>()
  const ctx = useUsersRouteContext()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
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
  const name = user ? getUserDisplayName(user) : ''
  const busy = deactivate.isPending || enable.isPending

  const modals = user ? (
    <>
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
    </>
  ) : null

  if (userQuery.isError || (!userQuery.isLoading && !user)) {
    return (
      <div className={styles.fallback}>
        {notFound || !userQuery.isError ? (
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
        )}
      </div>
    )
  }

  const identity =
    user && status ? (
      <UserIdentityPanel
        busy={busy}
        compact={!isDesktop}
        isSelf={isSelf}
        onDeactivate={() => {
          setError('')
          setConfirmOpen(true)
        }}
        onEnable={() => enable.mutate()}
        onInvite={() => setInviteOpen(true)}
        status={status}
        user={user}
      />
    ) : (
      <UserIdentitySkeleton compact={!isDesktop} />
    )

  const detail = (
    <div className={styles.column}>
      <PageHeader
        description={copy('detailDescription')}
        title={t('routes.users.detail')}
      />
      <div className={styles.stack}>
        {user ? (
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
        ) : (
          <FormSkeleton label={copy('loading')} rows={5} />
        )}
        {user ? <AuthoredPosts userId={user.id} /> : null}
      </div>
    </div>
  )

  if (!isDesktop) {
    return (
      <div className={styles.mobile}>
        {identity}
        {detail}
        {modals}
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <DraggablePanel
        expandable
        showBorder
        showHandleWhenCollapsed
        className={styles.panel}
        classNames={{ content: styles.identity }}
        defaultSize={{ width: 320 }}
        maxWidth={480}
        minWidth={280}
        mode="fixed"
        placement="left"
      >
        {identity}
      </DraggablePanel>
      <div className={styles.main}>
        {detail}
        {modals}
      </div>
    </div>
  )
}

export default UserDetailRoute
