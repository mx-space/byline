import { Input, InputPassword, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { ApiRequestError } from '~/api/http'
import { acceptInvite, getPublicInvite, type PublicInvite } from '~/api/users'
import { getUserConflictField } from '~/features/users/utils/users'

import { useAuthCopy } from '../use-auth-copy'
import { classifyInviteCode, confirmPasswordIssue } from '../utils/credentials'
import { focusInvalid } from '../utils/focus-invalid'
import { authStyles } from './auth-styles'
import { AuthSubmitButton, AuthTextLink } from './AuthActions'
import { AuthScreen } from './AuthScreen'
import { StatusAlert } from './StatusAlert'

type InviteValues = {
  confirm: string
  displayName: string
  password: string
  username: string
}

export function InviteAcceptRouteView() {
  const messages = useAuthCopy()
  const navigate = useNavigate()
  const { token = '' } = useParams<{ token: string }>()
  const inviteQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => getPublicInvite(token),
    queryKey: ['invite', token],
    retry: false,
  })

  const footer = <AuthTextLink to="/login">{messages('goLogin')}</AuthTextLink>

  if (inviteQuery.isLoading) {
    return <AuthScreen loading title={messages('inviteTitle')} />
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    const code =
      inviteQuery.error instanceof ApiRequestError
        ? String(inviteQuery.error.code ?? '')
        : ''
    const state = token ? classifyInviteCode(code) : 'notFound'
    const titleKey = {
      accepted: 'inviteAcceptedTitle',
      expired: 'inviteExpiredTitle',
      notFound: 'inviteNotFoundTitle',
      unknown: 'inviteUnknownTitle',
    } as const
    const detailKey = {
      accepted: 'inviteAcceptedDetail',
      expired: 'inviteExpiredDetail',
      notFound: 'inviteNotFoundDetail',
      unknown: 'inviteUnknownDetail',
    } as const

    return (
      <AuthScreen
        footer={footer}
        title={messages('inviteTitle')}
        alert={
          <StatusAlert
            description={messages(detailKey[state])}
            onRetry={
              state === 'unknown' ? () => void inviteQuery.refetch() : undefined
            }
            retryLabel={messages('retry')}
            title={messages(titleKey[state])}
          />
        }
      />
    )
  }

  return (
    <AuthScreen
      title={messages('inviteTitle')}
      subtitle={
        <span className={authStyles.wrap}>
          {messages('inviteFor', { email: inviteQuery.data.email })}
        </span>
      }
    >
      <InviteForm
        invite={inviteQuery.data}
        onAccepted={() => {
          toast.success(messages('inviteAccepted'))
          navigate('/login', { replace: true })
        }}
        token={token}
      />
    </AuthScreen>
  )
}

function InviteForm(props: {
  invite: PublicInvite
  onAccepted: () => void
  token: string
}) {
  const messages = useAuthCopy()
  const formRef = useRef<HTMLFormElement>(null)
  const [notice, setNotice] = useState<'accept' | 'email' | null>(null)
  const submitRef = useRef<(values: InviteValues) => void>(() => {})
  const form = useForm<InviteValues>({
    initialValues: {
      confirm: '',
      displayName: props.invite.displayName ?? '',
      password: '',
      username: '',
    },
    onSubmit: (values) => {
      setNotice(null)
      submitRef.current(values)
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (values: InviteValues) =>
      acceptInvite(props.token, {
        displayName: values.displayName.trim() || undefined,
        password: values.password,
        username: values.username.trim(),
      }),
    onError: (error: unknown) => {
      const conflict = getUserConflictField(error)
      if (conflict === 'username') {
        form.setErrors({ username: messages('usernameTaken') })
        focusInvalid(formRef.current)
        return
      }
      if (conflict === 'email') {
        setNotice('email')
        return
      }
      setNotice('accept')
    },
    onSuccess: () => {
      props.onAccepted()
    },
  })
  submitRef.current = (values) => {
    acceptMutation.mutate(values)
  }

  return (
    <>
      {notice === 'email' ? (
        <StatusAlert
          action={
            <AuthTextLink to="/login">{messages('goLogin')}</AuthTextLink>
          }
          title={messages('emailTakenTitle')}
        />
      ) : null}
      {notice === 'accept' ? (
        <StatusAlert
          description={messages('acceptFailedDetail')}
          onRetry={() => void form.submit()}
          retryLabel={messages('retry')}
          title={messages('acceptFailedTitle')}
        />
      ) : null}
      <Form
        className={authStyles.form}
        form={form}
        layout="vertical"
        ref={formRef}
        variant="outlined"
      >
        <Form.Field label={messages('displayNameLabel')} name="displayName">
          <Input autoComplete="name" name="name" size="large" />
        </Form.Field>
        <Form.Field
          label={messages('usernameLabel')}
          name="username"
          required={messages('usernameRequired')}
          validate={(value) => {
            if (
              typeof value === 'string' &&
              value.length > 0 &&
              !value.trim()
            ) {
              return messages('usernameRequired')
            }
          }}
        >
          <Input
            autoComplete="username"
            autoFocus
            name="username"
            size="large"
          />
        </Form.Field>
        <Form.Field
          desc={messages('passwordHint')}
          label={messages('passwordLabel')}
          name="password"
          required={messages('passwordRequired')}
          validate={(value) => {
            if (
              typeof value === 'string' &&
              value.length > 0 &&
              value.length < 8
            ) {
              return messages('passwordTooShort')
            }
          }}
        >
          <InputPassword
            autoComplete="new-password"
            name="password"
            size="large"
          />
        </Form.Field>
        <Form.Field
          deps={['password']}
          label={messages('confirmPasswordLabel')}
          name="confirm"
          required={messages('confirmRequired')}
          validate={(value, values) => {
            if (
              confirmPasswordIssue(
                String(values.password ?? ''),
                String(value ?? ''),
              ) === 'mismatch'
            ) {
              return messages('passwordMismatch')
            }
          }}
        >
          <InputPassword
            autoComplete="new-password"
            name="confirmPassword"
            size="large"
          />
        </Form.Field>
        <AuthSubmitButton loading={acceptMutation.isPending}>
          {messages('acceptInvite')}
        </AuthSubmitButton>
      </Form>
    </>
  )
}
