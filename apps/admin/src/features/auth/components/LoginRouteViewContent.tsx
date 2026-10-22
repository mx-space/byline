import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { getAllowLogin } from '~/api/users'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient } from '~/utils/authjs/auth'
import { cn } from '~/utils/cn'

import {
  allowLoginQueryKey,
  initQueryKey,
  loggedStatusQueryKey,
} from '../constants'
import { checkIsInit } from '../utils/check-init'
import { buildHashRouteUrl, readErrorMessage } from '../utils/login'
import { AppleIcon } from './AppleIcon'
import { authFormClassName, authLinkClassName, AuthScreen } from './AuthScreen'
import { GithubIcon } from './GithubIcon'
import { GoogleIcon } from './GoogleIcon'
import { LoginIconButton } from './LoginIconButton'

export function LoginRouteViewContent() {
  const { t } = useI18n()
  const identifierRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const initQuery = useQuery({
    queryFn: checkIsInit,
    queryKey: initQueryKey,
    retry: false,
  })
  const allowLoginQuery = useQuery({
    enabled: initQuery.data !== false,
    queryFn: getAllowLogin,
    queryKey: allowLoginQueryKey,
    retry: false,
  })

  const settings = allowLoginQuery.data
  const fromPath = searchParams.get('from') || '/dashboard'
  const showPasswordInput = settings?.password !== false
  const hasAlternativeAuth =
    Boolean(settings?.passkey) ||
    Boolean(settings?.github) ||
    Boolean(settings?.google) ||
    Boolean(settings?.apple)

  const callbackURL = useMemo(
    () => buildHashRouteUrl(searchParams.get('to') || fromPath),
    [fromPath, searchParams],
  )

  useEffect(() => {
    if (initQuery.data === false) {
      navigate('/setup', { replace: true })
    }
  }, [initQuery.data, navigate])

  useEffect(() => {
    identifierRef.current?.focus()
  }, [])

  const postSuccessfulLogin = () => {
    sessionStorage.setItem(SESSION_WITH_LOGIN, '1')
    queryClient.removeQueries({ queryKey: loggedStatusQueryKey })
    toast.success(t('auth.login.welcomeBack'))
    navigate(fromPath, { replace: true })
  }

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (isLoggingIn) return

    const account = identifier.trim()
    if (!account || !password) {
      toast.error(t('auth.login.credentialsRequired'))
      return
    }

    setIsLoggingIn(true)

    try {
      const result = account.includes('@')
        ? await authClient.signIn.email({ email: account, password })
        : await authClient.signIn.username({
            password,
            username: account.toLowerCase(),
          })

      if (result.error) {
        toast.error(result.error.message || t('auth.login.failed'))
        return
      }

      postSuccessfulLogin()
    } catch (error) {
      toast.error(readErrorMessage(error, t('auth.login.failed')))
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handlePasskeyLogin = async () => {
    try {
      const result = await authClient.signIn.passkey()

      if (result.error) {
        toast.error(result.error.message || t('auth.login.passkeyFailed'))
        return
      }

      toast.success(t('auth.login.passkeySucceeded'))
      postSuccessfulLogin()
    } catch (error) {
      toast.error(readErrorMessage(error, t('auth.login.passkeyFailed')))
    }
  }

  const handleSocialLogin = (provider: 'apple' | 'github' | 'google') => {
    void authClient.signIn.social({
      callbackURL,
      provider,
    })
  }

  return (
    <AuthScreen subtitle={t('auth.login.subtitle')} title="Byline">
      {showPasswordInput ? (
        <form className={authFormClassName} onSubmit={handlePasswordLogin}>
          <TextInput
            aria-label={t('auth.login.identifierLabel')}
            autoComplete="username"
            disabled={isLoggingIn}
            onChange={setIdentifier}
            placeholder={t('auth.login.identifierPlaceholder')}
            ref={identifierRef}
            value={identifier}
          />
          <TextInput
            aria-label={t('auth.login.passwordLabel')}
            autoComplete="current-password"
            disabled={isLoggingIn}
            onChange={setPassword}
            placeholder={t('auth.login.passwordPlaceholder')}
            type="password"
            value={password}
          />
          <Button className="w-full" disabled={isLoggingIn} type="submit">
            {isLoggingIn ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {t('auth.login.submit')}
          </Button>
          <Link
            className={cn(authLinkClassName, 'self-center')}
            to="/reset-password"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </form>
      ) : null}

      {hasAlternativeAuth ? (
        <div
          className={cn(
            'flex w-full justify-center gap-2',
            showPasswordInput ? 'mt-6 border-t border-border pt-6' : 'mt-6',
          )}
        >
          {settings?.passkey ? (
            <LoginIconButton
              label={t('auth.login.passkey')}
              onClick={handlePasskeyLogin}
            >
              <KeyRound aria-hidden="true" className="size-4" />
            </LoginIconButton>
          ) : null}

          {settings?.github ? (
            <LoginIconButton
              label={t('auth.login.github')}
              onClick={() => handleSocialLogin('github')}
            >
              <GithubIcon />
            </LoginIconButton>
          ) : null}

          {settings?.google ? (
            <LoginIconButton
              label={t('auth.login.google')}
              onClick={() => handleSocialLogin('google')}
            >
              <GoogleIcon />
            </LoginIconButton>
          ) : null}

          {settings?.apple ? (
            <LoginIconButton
              label={t('auth.login.apple')}
              onClick={() => handleSocialLogin('apple')}
            >
              <AppleIcon />
            </LoginIconButton>
          ) : null}
        </div>
      ) : null}

      {allowLoginQuery.isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          {t('auth.login.loadingProfile')}
        </div>
      ) : null}
    </AuthScreen>
  )
}
