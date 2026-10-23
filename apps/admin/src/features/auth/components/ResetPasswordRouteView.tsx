import { Button, Input, InputPassword, Text, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { authClient } from '~/utils/authjs/auth'

import { useAuthCopy } from '../use-auth-copy'
import { confirmPasswordIssue, emailIssue } from '../utils/credentials'
import { focusInvalid } from '../utils/focus-invalid'
import { buildHashRouteUrl, readHashSearchParam } from '../utils/login'
import { authStyles } from './auth-styles'
import { AuthSubmitButton, AuthTextLink } from './AuthActions'
import { AuthScreen } from './AuthScreen'
import { StatusAlert } from './StatusAlert'

type RequestValues = {
  email: string
}

type ResetValues = {
  confirm: string
  password: string
}

export function ResetPasswordRouteView() {
  const messages = useAuthCopy()
  const [token] = useState(() => readHashSearchParam('token'))
  const [tokenError] = useState(() => readHashSearchParam('error'))
  const [sent, setSent] = useState(false)
  const [showRequest, setShowRequest] = useState(!token)

  return (
    <AuthScreen
      title={messages('resetTitle')}
      footer={<AuthTextLink to="/login">{messages('goLogin')}</AuthTextLink>}
      subtitle={
        sent
          ? undefined
          : token
            ? messages('resetSetDescription')
            : messages('resetRequestDescription')
      }
      alert={
        !token && tokenError ? (
          <StatusAlert
            description={messages('tokenInvalidDetail')}
            title={messages('tokenInvalidTitle')}
          />
        ) : undefined
      }
    >
      {token ? (
        <SetPasswordForm
          onRequestLink={() => setShowRequest(true)}
          requestVisible={showRequest}
          token={token}
        />
      ) : null}
      {showRequest ? (
        <div className={token ? authStyles.afterForm : undefined} hidden={sent}>
          <RequestResetForm onSent={() => setSent(true)} primary={!token} />
        </div>
      ) : null}
      {sent ? <SentNotice onEdit={() => setSent(false)} /> : null}
    </AuthScreen>
  )
}

function RequestResetForm(props: { onSent: () => void; primary: boolean }) {
  const messages = useAuthCopy()
  const formRef = useRef<HTMLFormElement>(null)
  const rejectEmail = useRef<(message: string) => void>(() => {})
  const [pending, setPending] = useState(false)
  const form = useForm<RequestValues>({
    initialValues: { email: '' },
    onSubmit: async (values) => {
      if (pending) return
      setPending(true)
      try {
        const result = await authClient.requestPasswordReset({
          email: values.email.trim(),
          redirectTo: buildHashRouteUrl('/reset-password'),
        })
        if (result.error) {
          rejectEmail.current(messages('sendFailed'))
          return
        }
        props.onSent()
      } catch {
        rejectEmail.current(messages('sendFailed'))
      } finally {
        setPending(false)
      }
    },
  })
  rejectEmail.current = (message) => {
    form.setErrors({ email: message })
    focusInvalid(formRef.current)
  }

  const submit = (
    <AuthSubmitButton loading={pending}>
      {messages('requestReset')}
    </AuthSubmitButton>
  )

  return (
    <Form
      className={authStyles.form}
      form={form}
      layout="vertical"
      ref={formRef}
      variant="outlined"
    >
      <Form.Field
        label={messages('emailLabel')}
        name="email"
        required={messages('emailRequired')}
        validate={(value) => {
          const issue = emailIssue(String(value ?? ''))
          if (issue === 'invalid') return messages('emailInvalid')
          if (issue === 'required' && String(value ?? '').length > 0) {
            return messages('emailRequired')
          }
        }}
      >
        <Input
          autoComplete="email"
          autoFocus
          name="email"
          size="large"
          type="email"
        />
      </Form.Field>
      {props.primary ? (
        submit
      ) : (
        <Button
          block
          className={authStyles.submit}
          htmlType="submit"
          loading={pending}
          size="large"
          type="default"
        >
          {messages('requestReset')}
        </Button>
      )}
    </Form>
  )
}

function SetPasswordForm(props: {
  onRequestLink: () => void
  requestVisible: boolean
  token: string
}) {
  const messages = useAuthCopy()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const form = useForm<ResetValues>({
    initialValues: { confirm: '', password: '' },
    onSubmit: async (values) => {
      if (pending) return
      setPending(true)
      setFailed(false)
      try {
        const result = await authClient.resetPassword({
          newPassword: values.password,
          token: props.token,
        })
        if (result.error) {
          setFailed(true)
          return
        }
        toast.success(messages('passwordSet'))
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}#/login`,
        )
        navigate('/login', { replace: true })
      } catch {
        setFailed(true)
      } finally {
        setPending(false)
      }
    },
  })

  return (
    <>
      {failed ? (
        <StatusAlert
          action={
            props.requestVisible ? undefined : (
              <Button
                className={authStyles.method}
                htmlType="button"
                onClick={props.onRequestLink}
                size="large"
                type="default"
              >
                {messages('requestReset')}
              </Button>
            )
          }
          description={messages('setFailedDetail')}
          title={messages('setFailedTitle')}
        />
      ) : null}
      <Form
        className={authStyles.form}
        form={form}
        layout="vertical"
        ref={formRef}
        variant="outlined"
      >
        <Form.Field
          desc={messages('passwordHint')}
          label={messages('newPasswordLabel')}
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
            autoFocus
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
        <AuthSubmitButton loading={pending}>
          {messages('setPassword')}
        </AuthSubmitButton>
      </Form>
    </>
  )
}

function SentNotice(props: { onEdit: () => void }) {
  const messages = useAuthCopy()
  return (
    <div className={authStyles.afterForm}>
      <Text className={authStyles.wrap}>{messages('sent')}</Text>
      <Button
        className={authStyles.afterFields}
        htmlType="button"
        onClick={props.onEdit}
        size="large"
        type="link"
      >
        {messages('editEmail')}
      </Button>
    </div>
  )
}
