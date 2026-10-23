import { Avatar, Button, Input, Text, toast } from '@lobehub/ui'
import { Form, useForm, useWatch } from '@lobehub/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { uploadFile } from '~/api/files'
import { checkInit, createFirstUser } from '~/api/system'
import { getMe, updateMe } from '~/api/users'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { loggedStatusQueryKey } from '~/features/auth/constants'
import { authClient } from '~/utils/authjs/auth'

import { useSetupCopy } from '../copy'
import {
  isValidOnboardingUsername,
  markOnboardingPending,
} from '../utils/onboarding'
import { getErrorMessage } from '../utils/setup'
import {
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

const minPasswordLength = 8

interface AccountValues {
  mail: string
  password: string
  username: string
}

export function AccountStep(props: {
  onBack: () => void
  onCreated: (ownerId: string) => void
}) {
  // lobe-design-ignore DETAIL-NO-RETRY: 创建账号是一次提交，失败用 toast 说明原因，没有可重读的列表
  const copy = useSetupCopy()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!avatar) return
    const url = URL.createObjectURL(avatar)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatar])

  const continueAtLogin = () => {
    window.injectData.INIT = true
    markOnboardingPending()
    toast.error(copy('accountSignInError'))
    navigate(`/login?from=${encodeURIComponent('/setup')}`, { replace: true })
  }

  const form = useForm<AccountValues>({
    initialValues: { mail: '', password: '', username: '' },
    onSubmit: async (values) => {
      if (lock.current) return
      lock.current = true
      setSubmitting(true)
      const name = values.username.trim()
      try {
        try {
          await createFirstUser({
            mail: values.mail.trim(),
            name,
            password: values.password,
            username: name,
          })
        } catch (error) {
          const status = await checkInit().catch(() => null)
          if (status?.isInit) {
            continueAtLogin()
            return
          }
          toast.error(getErrorMessage(error, copy('accountCreateError')))
          return
        }
        window.injectData.INIT = true

        try {
          const result = await authClient.signIn.username({
            password: values.password,
            username: name,
          })
          if (result.error) throw new Error(result.error.message)
        } catch {
          continueAtLogin()
          return
        }
        sessionStorage.setItem(SESSION_WITH_LOGIN, '1')
        queryClient.removeQueries({ queryKey: loggedStatusQueryKey })

        if (avatar) {
          try {
            const uploaded = await uploadFile(avatar, 'avatar')
            await updateMe({ avatar: uploaded.url })
          } catch (error) {
            toast.error(getErrorMessage(error, copy('accountAvatarError')))
          }
        }

        try {
          const owner = await getMe()
          props.onCreated(owner.id)
        } catch {
          continueAtLogin()
        }
      } finally {
        lock.current = false
        setSubmitting(false)
      }
    },
  })
  const values = useWatch(form, (current) => current)
  const usernameValid = isValidOnboardingUsername(values.username.trim())
  const canSubmit =
    usernameValid &&
    values.mail.trim() !== '' &&
    values.password.length >= minPasswordLength

  return (
    <OnboardingShell step="account">
      <Form form={form} gap={16} layout="vertical">
        <OnboardingCard
          description={copy('accountDescription')}
          footer={
            <OnboardingFooter onBack={props.onBack}>
              <Button
                data-testid="onboarding-submit"
                disabled={!canSubmit || submitting}
                htmlType="submit"
                loading={submitting}
                title={canSubmit ? undefined : copy('accountBlocked')}
                type="primary"
              >
                {copy('accountSubmit')}
              </Button>
            </OnboardingFooter>
          }
          title={copy('accountTitle')}
        >
          <div className={wizardStyles.stack}>
            <div className={wizardStyles.provider}>
              {avatarPreview ? (
                <Avatar alt="" avatar={avatarPreview} shape="circle" />
              ) : null}
              <Button
                aria-label={copy('accountAvatarUpload')}
                htmlType="button"
                icon={ImagePlus}
                onClick={() => fileInputRef.current?.click()}
                type="default"
              >
                {copy('accountAvatar')}
              </Button>
              <input
                accept="image/*"
                aria-label={copy('accountAvatarUpload')}
                hidden
                onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
                ref={fileInputRef}
                type="file"
              />
            </div>
            <Text type="secondary">{copy('accountAvatarHint')}</Text>
            <Form.Field
              desc={copy('accountUsernameHint')}
              label={copy('accountUsername')}
              name="username"
            >
              <Input
                autoComplete="username"
                autoFocus
                name="username"
                type="text"
              />
            </Form.Field>
            <Form.Field
              desc={copy('accountEmailHint')}
              label={copy('accountEmail')}
              name="mail"
            >
              <Input autoComplete="email" name="mail" type="email" />
            </Form.Field>
            <Form.Field
              desc={copy('accountPasswordHint')}
              label={copy('accountPassword')}
              name="password"
            >
              <Input
                autoComplete="new-password"
                name="password"
                type="password"
              />
            </Form.Field>
            <Text type="secondary">{copy('accountLaterLogin')}</Text>
          </div>
        </OnboardingCard>
      </Form>
    </OnboardingShell>
  )
}
