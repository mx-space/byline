import { Input, InputPassword, Text, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { type AllowLoginResponse, getAllowLogin } from '~/api/users'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { Button, type ButtonProps } from '~/ui/site-button'
import { authClient } from '~/utils/authjs/auth'

import {
  allowLoginQueryKey,
  initQueryKey,
  loggedStatusQueryKey,
} from '../constants'
import { useAuthCopy } from '../use-auth-copy'
import { checkIsInit } from '../utils/check-init'
import { focusInvalid } from '../utils/focus-invalid'
import { buildHashRouteUrl } from '../utils/login'
import { AppleIcon } from './AppleIcon'
import { authStyles } from './auth-styles'
import { AuthSubmitButton, AuthTextLink } from './AuthActions'
import { AuthScreen } from './AuthScreen'
import { GithubIcon } from './GithubIcon'
import { GoogleIcon } from './GoogleIcon'
import { StatusAlert } from './StatusAlert'

type MethodId = 'apple' | 'github' | 'google' | 'passkey'

const providerLabel = {
  apple: 'Apple',
  github: 'GitHub',
  google: 'Google',
} as const
type Busy = 'password' | MethodId | null

type SignInMethod = {
  icon: ButtonProps['icon']
  id: MethodId
  label: string
  name: string
}

type Notice = {
  detail: string
  title: string
}

type LoginValues = {
  identifier: string
  password: string
}

export function LoginRouteViewContent() {
  const messages = useAuthCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const fromPath = searchParams.get('from') || '/dashboard'
  const callbackURL = useMemo(
    () => buildHashRouteUrl(searchParams.get('to') || fromPath),
    [fromPath, searchParams],
  )

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

  useEffect(() => {
    if (initQuery.data === false) {
      navigate('/setup', { replace: true })
    }
  }, [initQuery.data, navigate])

  const waiting =
    initQuery.isLoading ||
    initQuery.data === false ||
    (!initQuery.isError && allowLoginQuery.isLoading)

  const finish = () => {
    sessionStorage.setItem(SESSION_WITH_LOGIN, '1')
    queryClient.removeQueries({ queryKey: loggedStatusQueryKey })
    toast.success(messages('signedIn'))
    navigate(fromPath, { replace: true })
  }

  const retry = () => {
    void initQuery.refetch()
    void allowLoginQuery.refetch()
  }

  return (
    <AuthScreen
      loading={waiting}
      subtitle={
        <span className={authStyles.wrap}>{messages('loginDescription')}</span>
      }
      title={messages('loginTitle')}
    >
      {waiting ? null : (
        <LoginBody
          callbackURL={callbackURL}
          initError={initQuery.isError}
          methodsError={allowLoginQuery.isError}
          onRetry={retry}
          onSuccess={finish}
          settings={allowLoginQuery.data}
        />
      )}
    </AuthScreen>
  )
}

function LoginBody(props: {
  callbackURL: string
  initError: boolean
  methodsError: boolean
  onRetry: () => void
  onSuccess: () => void
  settings: AllowLoginResponse | undefined
}) {
  const messages = useAuthCopy()
  const [busy, setBusy] = useState<Busy>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const showPassword = props.settings?.password !== false
  const methods = buildMethods(props.settings, messages)

  const failSocial = (provider: string) => {
    setNotice({
      detail: messages(
        showPassword ? 'socialFailedPassword' : 'socialFailedOnly',
      ),
      title: messages('socialFailedTitle', { provider }),
    })
  }

  const runPasskey = async () => {
    if (busy) return
    setBusy('passkey')
    setNotice(null)
    try {
      const result = await authClient.signIn.passkey()
      if (result.error) {
        setNotice({
          detail: messages(
            showPassword ? 'passkeyFailedPassword' : 'passkeyFailedOnly',
          ),
          title: messages('passkeyFailedTitle'),
        })
        return
      }
      props.onSuccess()
    } catch {
      setNotice({
        detail: messages(
          showPassword ? 'passkeyFailedPassword' : 'passkeyFailedOnly',
        ),
        title: messages('passkeyFailedTitle'),
      })
    } finally {
      setBusy(null)
    }
  }

  const runSocial = async (provider: Exclude<MethodId, 'passkey'>) => {
    if (busy) return
    setBusy(provider)
    setNotice(null)
    try {
      const result = await authClient.signIn.social({
        callbackURL: props.callbackURL,
        provider,
      })
      if (result.error) failSocial(providerLabel[provider])
    } catch {
      failSocial(providerLabel[provider])
    } finally {
      setBusy(null)
    }
  }

  const alert = props.initError ? (
    <StatusAlert
      description={messages('initFailedDetail')}
      onRetry={props.onRetry}
      retryLabel={messages('retry')}
      title={messages('initFailedTitle')}
    />
  ) : props.methodsError ? (
    <StatusAlert
      description={messages('methodsFailedDetail')}
      onRetry={props.onRetry}
      retryLabel={messages('retry')}
      title={messages('methodsFailedTitle')}
    />
  ) : notice ? (
    <StatusAlert description={notice.detail} title={notice.title} />
  ) : !showPassword && methods.length === 0 ? (
    <StatusAlert
      description={messages('noMethodsDetail')}
      title={messages('noMethodsTitle')}
      type="warning"
    />
  ) : null

  return (
    <>
      {alert}
      {showPassword ? (
        <PasswordForm
          busy={busy === 'password'}
          locked={busy !== null}
          onBusy={(value) => setBusy(value ? 'password' : null)}
          onStart={() => setNotice(null)}
          onSuccess={props.onSuccess}
        />
      ) : null}
      <MethodList
        busy={busy}
        methods={showPassword ? methods : methods.slice(1)}
        onPasskey={runPasskey}
        onSocial={runSocial}
        primary={showPassword ? null : (methods[0] ?? null)}
      />
    </>
  )
}

function PasswordForm(props: {
  busy: boolean
  locked: boolean
  onBusy: (value: boolean) => void
  onStart: () => void
  onSuccess: () => void
}) {
  const messages = useAuthCopy()
  const formRef = useRef<HTMLFormElement>(null)
  const rejectPassword = useRef<(message: string) => void>(() => {})
  const form = useForm<LoginValues>({
    initialValues: { identifier: '', password: '' },
    onSubmit: async (values) => {
      if (props.locked) return
      props.onStart()
      props.onBusy(true)
      const account = values.identifier.trim()
      try {
        const result = account.includes('@')
          ? await authClient.signIn.email({
              email: account,
              password: values.password,
            })
          : await authClient.signIn.username({
              password: values.password,
              username: account.toLowerCase(),
            })
        if (result.error) {
          rejectPassword.current(messages('credentialFailed'))
          return
        }
        props.onSuccess()
      } catch {
        rejectPassword.current(messages('credentialFailed'))
      } finally {
        props.onBusy(false)
      }
    },
  })
  rejectPassword.current = (message) => {
    form.setErrors({ password: message })
    focusInvalid(formRef.current)
  }

  return (
    <Form
      className={authStyles.form}
      form={form}
      layout="vertical"
      ref={formRef}
      variant="outlined"
    >
      <Form.Field
        label={messages('accountLabel')}
        name="identifier"
        required={messages('accountRequired')}
        desc={messages('accountHint')}
        validate={(value) => {
          if (typeof value === 'string' && value.length > 0 && !value.trim()) {
            return messages('accountRequired')
          }
        }}
      >
        <Input autoComplete="username" autoFocus name="username" size="large" />
      </Form.Field>
      <Form.Field
        label={messages('passwordLabel')}
        name="password"
        required={messages('passwordRequired')}
      >
        <InputPassword
          autoComplete="current-password"
          name="password"
          size="large"
        />
      </Form.Field>
      <AuthSubmitButton loading={props.busy}>
        {messages('loginTitle')}
      </AuthSubmitButton>
      <AuthTextLink spaced="fields" to="/reset-password">
        {messages('resetPassword')}
      </AuthTextLink>
    </Form>
  )
}

function MethodList(props: {
  busy: Busy
  methods: SignInMethod[]
  onPasskey: () => void
  onSocial: (provider: Exclude<MethodId, 'passkey'>) => void
  primary: SignInMethod | null
}) {
  const messages = useAuthCopy()
  if (!props.primary && props.methods.length === 0) return null

  const run = (method: SignInMethod) => {
    if (method.id === 'passkey') props.onPasskey()
    else props.onSocial(method.id)
  }

  const rest: ReactNode[] = []
  for (const method of props.methods) {
    rest.push(
      <MethodButton
        busy={props.busy === method.id}
        key={method.id}
        method={method}
        onClick={() => run(method)}
      />,
    )
  }

  return (
    <>
      {props.primary ? (
        <AuthSubmitButton
          flush
          htmlType="button"
          icon={props.primary.icon}
          loading={props.busy === props.primary.id}
          onClick={() => {
            const method = props.primary
            if (method) run(method)
          }}
        >
          {props.primary.name}
        </AuthSubmitButton>
      ) : null}
      {rest.length > 0 ? (
        <div className={authStyles.methods}>
          <Text type="secondary">{messages('otherMethods')}</Text>
          {rest}
        </div>
      ) : null}
    </>
  )
}

function MethodButton(props: {
  busy: boolean
  method: SignInMethod
  onClick: () => void
}) {
  return (
    <Button
      aria-label={props.method.name}
      block
      className={authStyles.method}
      htmlType="button"
      icon={props.method.icon}
      loading={props.busy}
      onClick={props.onClick}
      size="large"
      type="default"
    >
      {props.method.label}
    </Button>
  )
}

function buildMethods(
  settings: AllowLoginResponse | undefined,
  messages: ReturnType<typeof useAuthCopy>,
): SignInMethod[] {
  if (!settings) return []
  const methods: SignInMethod[] = []
  if (settings.passkey) {
    methods.push({
      icon: KeyRound,
      id: 'passkey',
      label: messages('passkeyLabel'),
      name: messages('passkeyName'),
    })
  }
  if (settings.github) {
    methods.push({
      icon: <GithubIcon />,
      id: 'github',
      label: providerLabel.github,
      name: messages('socialName', { provider: providerLabel.github }),
    })
  }
  if (settings.google) {
    methods.push({
      icon: <GoogleIcon />,
      id: 'google',
      label: providerLabel.google,
      name: messages('socialName', { provider: providerLabel.google }),
    })
  }
  if (settings.apple) {
    methods.push({
      icon: <AppleIcon />,
      id: 'apple',
      label: providerLabel.apple,
      name: messages('socialName', { provider: providerLabel.apple }),
    })
  }
  return methods
}
