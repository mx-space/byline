import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Mail, UserCheck, UserX } from 'lucide-react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import {
  deactivateUser,
  getUser,
  reactivateUser,
  updateUser,
} from '~/api/users'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { confirmDialog } from '~/ui/feedback/confirm'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import {
  canEditSignInIdentity,
  getUserDisplayName,
  getUserErrorMessage,
  getUserStatus,
} from '../utils/users'
import { presentInviteUser } from './InviteUserModal'
import { UserAvatar } from './UserAvatar'
import { UserProfileForm } from './UserProfileForm'
import { useUsersRouteContext } from './users-route-context'
import { UserStatusBadge } from './UserStatusBadge'

export function UserDetailRoute() {
  const { t } = useI18n()
  const { id = '' } = useParams<{ id: string }>()
  const ctx = useUsersRouteContext()
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getUser(id),
    queryKey: adminQueryKeys.users.detail(id),
  })
  const user = userQuery.data
  useDocumentTitle(user ? getUserDisplayName(user) : null)

  const statusMutation = useMutation({
    mutationFn: (action: 'deactivate' | 'reactivate') =>
      action === 'deactivate' ? deactivateUser(id) : reactivateUser(id),
    onError: (error: unknown) =>
      toast.error(getUserErrorMessage(error, t('users.toast.statusFailed'))),
    onSuccess: async (updated, action) => {
      toast.success(
        action === 'deactivate'
          ? t('users.toast.deactivated')
          : t('users.toast.reactivated'),
      )
      await ctx.onUserChanged(updated)
    },
  })

  if (userQuery.isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-card text-sm text-fg-muted">
        {userQuery.isError ? (
          getUserErrorMessage(userQuery.error, t('users.toast.loadFailed'))
        ) : (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        )}
      </div>
    )
  }

  const status = getUserStatus(user)
  const isSelf = user.id === ctx.currentUserId
  const name = getUserDisplayName(user)

  const inviteToSignIn = async () => {
    const created = await presentInviteUser(user)
    if (!created) return
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.users.invites(),
    })
  }

  const toggleStatus = async () => {
    if (status === 'deactivated') {
      statusMutation.mutate('reactivate')
      return
    }
    const ok = await confirmDialog({
      confirmText: t('users.action.deactivate'),
      description: t('users.action.deactivateDescription'),
      destructive: true,
      title: t('users.action.deactivateConfirm', { name }),
    })
    if (ok) statusMutation.mutate('deactivate')
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface-card">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-border px-4',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label={t('users.action.back')}
            className="h-8 px-2 lg:hidden"
            onClick={ctx.onBack}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <UserAvatar avatar={user.avatar} className="size-6" name={name} />
          <span className="truncate text-sm font-semibold text-fg">{name}</span>
          <UserStatusBadge status={status} />
        </div>
        {isSelf ? null : (
          <div className="flex shrink-0 items-center gap-1.5">
            {status === 'profileOnly' ? (
              <Button
                className="h-8 px-2"
                onClick={() => void inviteToSignIn()}
                type="button"
                variant="subtle"
              >
                <Mail aria-hidden="true" className="size-3.5" />
                {t('users.invite.existingAction')}
              </Button>
            ) : null}
            <Button
              className="h-8 px-2"
              disabled={statusMutation.isPending}
              onClick={() => void toggleStatus()}
              type="button"
              variant="subtle"
            >
              {status === 'deactivated' ? (
                <UserCheck aria-hidden="true" className="size-3.5" />
              ) : (
                <UserX aria-hidden="true" className="size-3.5" />
              )}
              {status === 'deactivated'
                ? t('users.action.reactivate')
                : t('users.action.deactivate')}
            </Button>
          </div>
        )}
      </div>
      <Scroll
        className="flex-1"
        innerClassName="mx-auto w-full max-w-3xl px-5 py-6"
      >
        {status === 'profileOnly' ? (
          <p className="mb-5 rounded-md border border-border bg-surface-inset px-3 py-2 text-xs text-fg-muted">
            {t('users.detail.profileOnlyHint')}
          </p>
        ) : null}
        <UserProfileForm
          identityLocked={!canEditSignInIdentity(user, ctx.currentUserId)}
          key={user.updatedAt ?? user.id}
          onSubmit={async (input) => {
            try {
              const updated = await updateUser(user.id, input)
              toast.success(t('users.toast.saved'))
              await ctx.onUserChanged(updated)
            } catch (error) {
              toast.error(
                getUserErrorMessage(error, t('users.toast.saveFailed')),
              )
            }
          }}
          user={user}
        />
        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border pt-4 text-xs">
          <dt className="text-fg-muted">{t('users.detail.createdAt')}</dt>
          <dd className="text-fg">{formatTime(user.createdAt)}</dd>
          <dt className="text-fg-muted">{t('users.detail.lastLoginAt')}</dt>
          <dd className="text-fg">{formatTime(user.lastLoginAt)}</dd>
          {user.deactivatedAt ? (
            <>
              <dt className="text-fg-muted">
                {t('users.detail.deactivatedAt')}
              </dt>
              <dd className="text-fg">{formatTime(user.deactivatedAt)}</dd>
            </>
          ) : null}
        </dl>
      </Scroll>
    </section>
  )
}

function formatTime(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

export default UserDetailRoute
