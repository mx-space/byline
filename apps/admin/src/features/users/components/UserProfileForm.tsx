import {
  createStaticStyles,
  Descriptions,
  Flexbox,
  Input,
  Text,
  TextArea,
  toast,
} from '@lobehub/ui'
import { Form, useForm, useWatch } from '@lobehub/ui/form'
import { useMutation } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { z } from 'zod'

import { uploadFile } from '~/api/files'
import type { UserDetail, UserProfileInput } from '~/api/users'
import { useI18n } from '~/i18n'
import { emptyOr } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useUsersCopy } from '../copy'
import { getUserErrorMessage } from '../utils/users'
import { UserAvatar } from './UserAvatar'

const styles = createStaticStyles(({ css }) => ({
  file: css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `,
  upload: css`
    position: relative;
  `,
}))

const profileSchema = z.object({
  avatar: z.string(),
  bio: z.string(),
  displayName: z.string(),
  email: z.string(),
  url: z.string(),
  username: z.string(),
})

interface ProfileFormState {
  avatar: string
  bio: string
  displayName: string
  email: string
  url: string
  username: string
}

function toFormState(user?: Partial<UserDetail>): ProfileFormState {
  return {
    avatar: user?.avatar ?? '',
    bio: user?.bio ?? '',
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    url: user?.url ?? '',
    username: user?.username ?? '',
  }
}

export function toProfileInput(
  form: ProfileFormState,
  options: { identityLocked?: boolean } = {},
): UserProfileInput {
  const profile: UserProfileInput = {
    avatar: form.avatar.trim() || null,
    bio: form.bio.trim() || null,
    displayName: form.displayName.trim(),
    url: form.url.trim() || null,
  }
  if (options.identityLocked) return profile
  return {
    ...profile,
    email: form.email.trim() || null,
    ...(form.username.trim() ? { username: form.username.trim() } : {}),
  }
}

export function UserProfileForm(props: {
  footer?: ReactNode
  identityLocked?: boolean
  onSubmit: (input: UserProfileInput) => Promise<unknown>
  submitLabel?: string
  user?: Partial<UserDetail>
}) {
  const copy = useUsersCopy()
  const { t } = useI18n()
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const form = useForm({
    initialValues: toFormState(props.user),
    onSubmit: async (values) => {
      const base = toFormState(props.user)
      const merged: ProfileFormState = {
        ...base,
        ...values,
        email: props.identityLocked ? base.email : values.email,
        username: props.identityLocked ? base.username : values.username,
      }
      if (!merged.displayName.trim()) {
        form.setErrors({ displayName: copy('displayNameRequired') })
        return
      }
      setSubmitting(true)
      try {
        await props.onSubmit(
          toProfileInput(merged, { identityLocked: props.identityLocked }),
        )
      } finally {
        setSubmitting(false)
      }
    },
    schema: profileSchema,
  })
  const avatar = useWatch(form, 'avatar')
  const displayName = useWatch(form, 'displayName')
  const username = useWatch(form, 'username')

  const avatarUpload = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'avatar'),
    onError: (error: unknown) =>
      toast.error(getUserErrorMessage(error, copy('avatarFailed'))),
    onSuccess: (result) => {
      form.setValue('avatar', result.url)
    },
  })

  return (
    <Form form={form} gap={16} layout="vertical">
      <Flexbox align="center" gap={12} horizontal>
        <UserAvatar avatar={avatar} name={displayName || username} size={48} />
        <Flexbox className={styles.upload} flex={1} gap={8}>
          <input
            accept="image/*"
            aria-label={copy('uploadAvatar')}
            className={styles.file}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) avatarUpload.mutate(file)
            }}
            ref={fileRef}
            type="file"
          />
          <Button
            htmlType="button"
            loading={avatarUpload.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {copy('uploadAvatar')}
          </Button>
          <Form.Field label={copy('avatarUrl')} name="avatar">
            <Input placeholder="https://" />
          </Form.Field>
        </Flexbox>
      </Flexbox>

      <Form.Field
        label={copy('displayName')}
        name="displayName"
        required={copy('displayNameRequired')}
      >
        <Input />
      </Form.Field>

      {props.identityLocked ? (
        <Flexbox gap={8}>
          <Descriptions
            column={1}
            items={[
              {
                children: emptyOr(props.user?.email),
                key: 'email',
                label: copy('email'),
              },
              {
                children: emptyOr(props.user?.username),
                key: 'username',
                label: copy('username'),
              },
            ]}
          />
          <Text type="secondary">{copy('identityLocked')}</Text>
        </Flexbox>
      ) : (
        <>
          <Form.Field label={copy('username')} name="username">
            <Input />
          </Form.Field>
          <Form.Field label={copy('email')} name="email">
            <Input type="email" />
          </Form.Field>
        </>
      )}

      <Form.Field label={copy('url')} name="url">
        <Input placeholder="https://" />
      </Form.Field>
      <Form.Field label={copy('bio')} name="bio">
        <TextArea />
      </Form.Field>

      <Flexbox align="center" gap={8} horizontal justify="flex-end">
        {props.footer}
        <Button
          htmlType="submit"
          loading={submitting || avatarUpload.isPending}
          type="primary"
        >
          {props.submitLabel ?? t('common.save')}
        </Button>
      </Flexbox>
    </Form>
  )
}
