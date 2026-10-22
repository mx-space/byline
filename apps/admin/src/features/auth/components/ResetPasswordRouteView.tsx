import { Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useI18n } from '~/i18n'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient } from '~/utils/authjs/auth'
import { cn } from '~/utils/cn'

import {
  buildHashRouteUrl,
  readErrorMessage,
  readHashSearchParam,
} from '../utils/login'
import {
  authInputClassName,
  authLinkClassName,
  authPrimaryButtonClassName,
  AuthScreen,
} from './AuthScreen'

export function ResetPasswordRouteView() {
  const { t } = useI18n()
  const [token] = useState(() => readHashSearchParam('token'))
  const [tokenError] = useState(() => readHashSearchParam('error'))

  return (
    <AuthScreen
      subtitle={
        tokenError
          ? t('auth.reset.invalidToken')
          : token
            ? t('auth.reset.chooseSubtitle')
            : t('auth.reset.requestSubtitle')
      }
      title={t('auth.reset.title')}
    >
      {token ? <ResetForm token={token} /> : <RequestForm />}
      <Link className={cn(authLinkClassName, 'mt-4')} to="/login">
        {t('auth.invite.backToLogin')}
      </Link>
    </AuthScreen>
  )
}

function RequestForm() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || pending) return
    setPending(true)
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: buildHashRouteUrl('/reset-password'),
      })
      if (result.error) {
        toast.error(result.error.message || t('auth.reset.requestFailed'))
        return
      }
      setSent(true)
    } catch (error) {
      toast.error(readErrorMessage(error, t('auth.reset.requestFailed')))
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <p className="max-w-[280px] text-center text-sm text-fg-muted">
        {t('auth.reset.sent')}
      </p>
    )
  }

  return (
    <form
      className="flex w-full max-w-[280px] flex-col gap-3"
      onSubmit={submit}
    >
      <TextInput
        aria-label={t('auth.reset.email')}
        autoComplete="email"
        autoFocus
        controlClassName={authInputClassName}
        onChange={setEmail}
        placeholder={t('auth.reset.email')}
        type="email"
        value={email}
      />
      <button
        className={authPrimaryButtonClassName}
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <Loader2 aria-hidden="true" className="mx-auto size-4 animate-spin" />
        ) : (
          t('auth.reset.requestSubmit')
        )}
      </button>
    </form>
  )
}

function ResetForm(props: { token: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (password.length < 8) {
      toast.error(t('auth.invite.passwordTooShort'))
      return
    }
    if (password !== confirm) {
      toast.error(t('auth.invite.passwordMismatch'))
      return
    }
    setPending(true)
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token: props.token,
      })
      if (result.error) {
        toast.error(result.error.message || t('auth.reset.failed'))
        return
      }
      toast.success(t('auth.reset.done'))
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}#/login`,
      )
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(readErrorMessage(error, t('auth.reset.failed')))
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="flex w-full max-w-[280px] flex-col gap-3"
      onSubmit={submit}
    >
      <TextInput
        aria-label={t('auth.invite.password')}
        autoComplete="new-password"
        autoFocus
        controlClassName={authInputClassName}
        onChange={setPassword}
        placeholder={t('auth.invite.password')}
        type="password"
        value={password}
      />
      <TextInput
        aria-label={t('auth.invite.confirmPassword')}
        autoComplete="new-password"
        controlClassName={authInputClassName}
        onChange={setConfirm}
        placeholder={t('auth.invite.confirmPassword')}
        type="password"
        value={confirm}
      />
      <button
        className={authPrimaryButtonClassName}
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <Loader2 aria-hidden="true" className="mx-auto size-4 animate-spin" />
        ) : (
          t('auth.reset.submit')
        )}
      </button>
    </form>
  )
}
