import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { ApiRequestError } from '~/api/http'
import { acceptInvite, getPublicInvite } from '~/api/users'
import { getUserConflictField } from '~/features/users/utils/users'
import { useI18n } from '~/i18n'
import type { TranslationKey } from '~/i18n/types'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

import { readErrorMessage } from '../utils/login'
import { authFormClassName, authLinkClassName, AuthScreen } from './AuthScreen'

const CONFLICT_ERROR_KEYS = {
  email: 'auth.invite.error.emailTaken',
  username: 'auth.invite.error.usernameTaken',
} satisfies Record<string, TranslationKey>

const INVITE_ERROR_KEYS: Record<string, TranslationKey> = {
  INVITE_ALREADY_ACCEPTED: 'auth.invite.error.accepted',
  INVITE_EXPIRED: 'auth.invite.error.expired',
  INVITE_NOT_FOUND: 'auth.invite.error.notFound',
}

export function InviteAcceptRouteView() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { token = '' } = useParams<{ token: string }>()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const inviteQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => getPublicInvite(token),
    queryKey: ['invite', token],
    retry: false,
  })

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptInvite(token, {
        displayName:
          (displayName ?? inviteQuery.data?.displayName ?? '').trim() ||
          undefined,
        password,
        username: username.trim(),
      }),
    onError: (error: unknown) => {
      const conflict = getUserConflictField(error)
      toast.error(
        conflict
          ? t(CONFLICT_ERROR_KEYS[conflict])
          : readErrorMessage(error, t('auth.invite.acceptFailed')),
      )
    },
    onSuccess: () => {
      toast.success(t('auth.invite.accepted'))
      navigate('/login', { replace: true })
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!username.trim()) {
      toast.error(t('auth.invite.usernameRequired'))
      return
    }
    if (password.length < 8) {
      toast.error(t('auth.invite.passwordTooShort'))
      return
    }
    if (password !== confirm) {
      toast.error(t('auth.invite.passwordMismatch'))
      return
    }
    acceptMutation.mutate()
  }

  if (inviteQuery.isLoading) {
    return (
      <AuthScreen title={t('auth.invite.title')}>
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin text-accent"
        />
      </AuthScreen>
    )
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    const code =
      inviteQuery.error instanceof ApiRequestError
        ? String(inviteQuery.error.code ?? '')
        : ''
    return (
      <AuthScreen
        subtitle={t(INVITE_ERROR_KEYS[code] ?? 'auth.invite.error.notFound')}
        title={t('auth.invite.title')}
      >
        <Link className={authLinkClassName} to="/login">
          {t('auth.invite.backToLogin')}
        </Link>
      </AuthScreen>
    )
  }

  const invite = inviteQuery.data

  return (
    <AuthScreen
      subtitle={t('auth.invite.subtitle', { email: invite.email })}
      title={t('auth.invite.title')}
    >
      <form className={authFormClassName} onSubmit={submit}>
        <TextInput
          aria-label={t('auth.invite.displayName')}
          onChange={setDisplayName}
          placeholder={t('auth.invite.displayName')}
          value={displayName ?? invite.displayName ?? ''}
        />
        <TextInput
          aria-label={t('auth.invite.username')}
          autoComplete="username"
          autoFocus
          onChange={setUsername}
          placeholder={t('auth.invite.username')}
          value={username}
        />
        <TextInput
          aria-label={t('auth.invite.password')}
          autoComplete="new-password"
          onChange={setPassword}
          placeholder={t('auth.invite.password')}
          type="password"
          value={password}
        />
        <TextInput
          aria-label={t('auth.invite.confirmPassword')}
          autoComplete="new-password"
          onChange={setConfirm}
          placeholder={t('auth.invite.confirmPassword')}
          type="password"
          value={confirm}
        />
        <Button
          className="w-full"
          disabled={acceptMutation.isPending}
          type="submit"
        >
          {acceptMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {t('auth.invite.submit')}
        </Button>
      </form>
    </AuthScreen>
  )
}
