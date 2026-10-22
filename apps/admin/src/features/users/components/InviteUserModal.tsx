import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Loader2, UserPlus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import type { CreatedUserInvite } from '~/api/users'
import { createInvite } from '~/api/users'
import { useI18n } from '~/i18n'
import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

import { getUserErrorMessage } from '../utils/users'

function InviteUserModal() {
  const { t } = useI18n()
  const modal = useModal<CreatedUserInvite>()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedUserInvite | null>(null)
  const [copied, setCopied] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createInvite({
        displayName: displayName.trim() || undefined,
        email: email.trim(),
      }),
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
      <ModalHeader icon={UserPlus} title={t('users.invite.title')} />
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
        <TextInput
          label={t('users.field.displayName')}
          onChange={setDisplayName}
          value={displayName}
        />
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

export async function presentInviteUser() {
  return await present<Record<string, never>, CreatedUserInvite>(
    InviteUserModal,
    {},
    { modalProps: { popupStyle: { width: 'min(94vw, 32rem)' } } },
  )
}
