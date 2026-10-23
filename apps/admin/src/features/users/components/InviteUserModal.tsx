import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Copy, Loader2, UserPlus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import type { CreatedUserInvite, UserDetail } from '~/api/users'
import { createInvite, getUsers, inviteExistingUser } from '~/api/users'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'

import {
  buildInviteRequest,
  getUserDisplayName,
  getUserErrorMessage,
} from '../utils/users'

interface InviteUserModalProps {
  user?: Pick<UserDetail, 'displayName' | 'email' | 'id' | 'username'>
}

function InviteUserModal(props: InviteUserModalProps) {
  const { t } = useI18n()
  const modal = useModal<CreatedUserInvite>()
  const target = props.user
  const [email, setEmail] = useState(target?.email ?? '')
  const [displayName, setDisplayName] = useState('')
  const [linkedAuthorId, setLinkedAuthorId] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedUserInvite | null>(null)
  const [copied, setCopied] = useState(false)

  const authorsQuery = useQuery({
    enabled: !target,
    queryFn: () => getUsers({ page: 1, size: 100, status: 'profile_only' }),
    queryKey: adminQueryKeys.users.list({ search: '', status: 'profile_only' }),
  })
  const linkableAuthors = (authorsQuery.data?.data ?? []).filter(
    (author) => !author.deactivatedAt,
  )

  const mutation = useMutation({
    mutationFn: () => {
      const request = buildInviteRequest({
        displayName,
        email,
        linkedAuthorId: target?.id ?? linkedAuthorId,
      })
      return request.kind === 'existing'
        ? inviteExistingUser(request.userId, { email: request.email })
        : createInvite({
            displayName: request.displayName,
            email: request.email,
          })
    },
    onError: (mutationError: unknown) =>
      setError(getUserErrorMessage(mutationError, t('users.invite.failed'))),
    onSuccess: setCreated,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      setError(t('users.invite.emailRequired'))
      return
    }
    setError('')
    mutation.mutate()
  }

  const copyLink = async () => {
    if (!created) return
    await navigator.clipboard.writeText(created.acceptUrl)
    setCopied(true)
  }

  if (created) {
    return (
      <div className="flex min-h-0 flex-col">
        <ModalHeader icon={UserPlus} title={t('users.invite.createdTitle')} />
        <div className="grid gap-3 px-5 py-5 text-sm">
          <p className="text-fg-muted">
            {created.emailQueued
              ? t('users.invite.emailQueued', { email: created.email })
              : t('users.invite.emailNotQueued')}
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-sm border border-border bg-surface-inset px-2 py-1.5 font-mono text-xs text-fg">
              {created.acceptUrl}
            </code>
            <Button onClick={copyLink} type="button" variant="subtle">
              {copied ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                <Copy aria-hidden="true" className="size-4" />
              )}
              {t('users.invite.copyLink')}
            </Button>
          </div>
        </div>
        <ModalFooter>
          <Button onClick={() => modal.close(created)} type="button">
            {t('users.invite.done')}
          </Button>
        </ModalFooter>
      </div>
    )
  }

  return (
    <form className="flex min-h-0 flex-col" onSubmit={submit}>
      <ModalHeader
        icon={UserPlus}
        subtitle={target ? t('users.invite.existingDescription') : undefined}
        title={
          target
            ? t('users.invite.existingTitle', {
                name: getUserDisplayName(target),
              })
            : t('users.invite.title')
        }
      />
      <div className="grid gap-4 px-5 py-5">
        <TextInput
          autoFocus
          label={t('users.field.email')}
          onChange={(value) => {
            setError('')
            setEmail(value)
          }}
          required
          type="email"
          value={email}
        />
        {target || linkableAuthors.length === 0 ? null : (
          <div className="grid gap-1.5 text-sm">
            <span className="font-medium text-fg">
              {t('users.invite.linkAuthor')}
            </span>
            <SelectField
              aria-label={t('users.invite.linkAuthor')}
              onValueChange={setLinkedAuthorId}
              options={[
                { label: t('users.invite.linkAuthorNone'), value: '' },
                ...linkableAuthors.map((author) => ({
                  label: getUserDisplayName(author),
                  value: author.id,
                })),
              ]}
              value={linkedAuthorId}
            />
            {linkedAuthorId ? (
              <p className="text-xs text-fg-muted">
                {t('users.invite.linkAuthorHint')}
              </p>
            ) : null}
          </div>
        )}
        {target || linkedAuthorId ? null : (
          <TextInput
            label={t('users.field.displayName')}
            onChange={setDisplayName}
            value={displayName}
          />
        )}
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <ModalFooter>
        <Button onClick={() => modal.dismiss()} type="button" variant="subtle">
          {t('common.cancel')}
        </Button>
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {t('users.invite.submit')}
        </Button>
      </ModalFooter>
    </form>
  )
}

export async function presentInviteUser(user?: InviteUserModalProps['user']) {
  return await present<InviteUserModalProps, CreatedUserInvite>(
    InviteUserModal,
    { user },
    { modalProps: { popupStyle: { width: 'min(94vw, 32rem)' } } },
  )
}
