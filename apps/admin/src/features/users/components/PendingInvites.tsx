import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { getInvites, revokeInvite } from '~/api/users'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { confirmDialog } from '~/ui/feedback/confirm'

import { getUserErrorMessage } from '../utils/users'

export function PendingInvites() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const invitesQuery = useQuery({
    queryFn: getInvites,
    queryKey: adminQueryKeys.users.invites(),
  })
  const revokeMutation = useMutation({
    mutationFn: revokeInvite,
    onError: (error: unknown) =>
      toast.error(getUserErrorMessage(error, t('users.invite.revokeFailed'))),
    onSuccess: async () => {
      toast.success(t('users.invite.revoked'))
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users.invites(),
      })
    },
  })

  const invites = invitesQuery.data ?? []
  if (invites.length === 0) return null

  return (
    <section className="border-b border-border bg-surface-inset/60">
      <h3 className="px-4 pb-1 pt-3 text-xs font-medium uppercase text-fg-subtle">
        {t('users.invite.pendingTitle', { count: invites.length })}
      </h3>
      {invites.map((invite) => {
        const expired = Date.parse(invite.expiresAt) < Date.now()
        return (
          <div className="flex items-center gap-3 px-4 py-2" key={invite.id}>
            <Mail
              aria-hidden="true"
              className="size-4 shrink-0 text-fg-subtle"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm text-fg">
                  {invite.displayName || invite.email}
                </span>
                {invite.userId ? (
                  <span className="shrink-0 rounded-full bg-surface-card px-1.5 py-0.5 text-xs text-fg-muted">
                    {t('users.invite.linkedAuthor')}
                  </span>
                ) : null}
              </div>
              <div className="truncate text-xs text-fg-muted">
                {expired
                  ? t('users.invite.expired')
                  : t('users.invite.expiresAt', {
                      time: new Date(invite.expiresAt).toLocaleString(),
                    })}
                {invite.displayName ? ` · ${invite.email}` : ''}
              </div>
            </div>
            <button
              aria-label={t('users.invite.revoke')}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-fg-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              disabled={revokeMutation.isPending}
              onClick={async () => {
                const ok = await confirmDialog({
                  confirmText: t('users.invite.revoke'),
                  destructive: true,
                  title: t('users.invite.revokeConfirm', {
                    email: invite.email,
                  }),
                })
                if (ok) revokeMutation.mutate(invite.id)
              }}
              title={t('users.invite.revoke')}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        )
      })}
    </section>
  )
}
