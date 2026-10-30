import {
  ActionIcon,
  Button,
  type ButtonProps,
  Divider,
  Flexbox,
  Input,
  InputPassword,
  toast,
} from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Fingerprint } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { type AllowLoginResponse, getAllowLogin } from '~/api/users'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { authClient } from '~/utils/authjs/auth'

import {
  allowLoginQueryKey,
  initQueryKey,
  loggedStatusQueryKey,
} from '../constants'
import { useAuthCopy } from '../use-auth-copy'
import { checkIsInit } from '../utils/check-init'
import { focusInvalid } from '../utils/focus-invalid'
import { buildHashRouteUrl, readHashSearchParam } from '../utils/login'
import { AppleIcon } from './AppleIcon'
import { authStyles } from './auth-styles'
import { AuthSubmitButton, AuthTextLink } from './AuthActions'
import { AuthScreen } from './AuthScreen'
import { GithubIcon } from './GithubIcon'
import { GoogleIcon } from './GoogleIcon'
import { OauthProviderIcon } from './OauthProviderIcon'
import { StatusAlert } from './StatusAlert'

type MethodId = string

const providerLabel = {
  apple: 'Apple',
  github: 'GitHub',
  google: 'Google',
} as const
type Busy = 'password' | MethodId | null

type SignInMethod = {
  custom?: boolean
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
      footer={messages('inviteOnly')}
      loading={waiting}
      subtitle={
        <span className={authStyles.wrap}>{messages('loginDescription')}</span>
      }
      title={messages('loginHeading')}
    >
      {waiting ? null : (
        <LoginBody
          callbackURL={callbackURL}
          errorCallbackURL={buildHashRouteUrl(
            `/login?from=${encodeURIComponent(searchParams.get('to') || fromPath)}`,
          )}
          oauthError={readHashSearchParam('error')}
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
  errorCallbackURL: string
  oauthError: string | null
  initError: boolean
  methodsError: boolean
  onRetry: () => void
  onSuccess: () => void
  settings: AllowLoginResponse | undefined
}) {
  const messages = useAuthCopy()
  const [busy, setBusy] = useState<Busy>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [returnedError, setReturnedError] = useState(Boolean(props.oauthError))
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
    setReturnedError(false)
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

  const runSocial = async (provider: string) => {
    if (busy) return
    setBusy(provider)
    setNotice(null)
    setReturnedError(false)
    try {
      const method = methods.find((item) => item.id === provider)
      const result = await authClient.signIn.social({
        callbackURL: props.callbackURL,
        errorCallbackURL: props.errorCallbackURL,
        provider,
      })
      if (result.error) failSocial(method?.label ?? provider)
    } catch {
      failSocial(
        methods.find((item) => item.id === provider)?.label ?? provider,
      )
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
  ) : returnedError ? (
    <StatusAlert
      title={messages('oauthReturnedError')}
      description={messages(
        showPassword ? 'socialFailedPassword' : 'socialFailedOnly',
      )}
    />
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
          onStart={() => {
            setNotice(null)
            setReturnedError(false)
          }}
          onSuccess={props.onSuccess}
        />
      ) : null}
      <MethodList
        busy={busy}
        methods={methods}
        onPasskey={runPasskey}
        onSocial={runSocial}
        hasPassword={showPassword}
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
        validate={(value) => {
          if (typeof value === 'string' && value.length > 0 && !value.trim()) {
            return messages('accountRequired')
          }
        }}
      >
        <Input
          autoComplete="username"
          autoFocus
          name="username"
          placeholder={messages('accountHint')}
          size="large"
        />
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
  hasPassword: boolean
}) {
  const messages = useAuthCopy()
  if (props.methods.length === 0) return null

  const run = (method: SignInMethod) => {
    if (method.id === 'passkey') props.onPasskey()
    else props.onSocial(method.id)
  }

  const oauth = props.methods.filter((method) => method.id !== 'passkey')
  const passkey = props.methods.find((method) => method.id === 'passkey')

  return (
    <Flexbox className={authStyles.methods} gap={20}>
      {oauth.length > 0 ? (
        <>
          <Divider>{messages('otherMethods')}</Divider>
          <Flexbox
            align="center"
            gap={12}
            horizontal
            justify="center"
            wrap="wrap"
          >
            {oauth.map((method) => (
              <ActionIcon
                aria-label={method.name}
                disabled={props.busy !== null && props.busy !== method.id}
                icon={method.icon}
                key={method.id}
                loading={props.busy === method.id}
                onClick={() => run(method)}
                size={{ blockSize: 48, size: 24 }}
                title={method.name}
                variant="outlined"
              />
            ))}
          </Flexbox>
        </>
      ) : null}
      {passkey ? (
        <Button
          aria-label={passkey.name}
          block
          disabled={props.busy !== null && props.busy !== passkey.id}
          icon={passkey.icon}
          loading={props.busy === passkey.id}
          onClick={props.onPasskey}
          size="large"
          type={props.hasPassword ? 'default' : 'primary'}
        >
          {passkey.name}
        </Button>
      ) : null}
    </Flexbox>
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
      icon: Fingerprint,
      id: 'passkey',
      label: messages('passkeyLabel'),
      name: messages('passkeyName'),
    })
  }
  for (const provider of settings.oauthProviders ?? []) {
    methods.push({
      custom: true,
      icon: <OauthProviderIcon src={provider.icon} />,
      id: provider.id,
      label: provider.name,
      name: messages('socialName', { provider: provider.name }),
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
