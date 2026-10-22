import { useMutation } from '@tanstack/react-query'
import { Camera, Loader2, Save } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { uploadFile } from '~/api/files'
import type { UserDetail, UserProfileInput } from '~/api/users'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { TextArea, TextInput } from '~/ui/primitives/text-field'

import { getUserErrorMessage } from '../utils/users'
import { UserAvatar } from './UserAvatar'

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

export function toProfileInput(form: ProfileFormState): UserProfileInput {
  return {
    avatar: form.avatar.trim() || null,
    bio: form.bio.trim() || null,
    displayName: form.displayName.trim(),
    email: form.email.trim() || null,
    url: form.url.trim() || null,
    ...(form.username.trim() ? { username: form.username.trim() } : {}),
  }
}

export function UserProfileForm(props: {
  footer?: ReactNode
  onSubmit: (input: UserProfileInput) => Promise<unknown>
  submitLabel?: string
  user?: Partial<UserDetail>
}) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => toFormState(props.user))
  const [submitting, setSubmitting] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const avatarUpload = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'avatar'),
    onError: (error: unknown) =>
      toast.error(getUserErrorMessage(error, t('users.toast.avatarFailed'))),
    onSuccess: (result) => {
      setForm((current) => ({ ...current, avatar: result.url }))
    },
  })

  const setField = (key: keyof ProfileFormState) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.displayName.trim()) {
      toast.error(t('users.validation.displayNameRequired'))
      return
    }
    setSubmitting(true)
    try {
      await props.onSubmit(toProfileInput(form))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="flex items-center gap-4">
        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) avatarUpload.mutate(file)
          }}
          ref={avatarInputRef}
          type="file"
        />
        <button
          aria-label={t('users.field.avatarUpload')}
          className="group relative rounded-full focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-accent/15"
          onClick={() => avatarInputRef.current?.click()}
          title={t('users.field.avatarUpload')}
          type="button"
        >
          <UserAvatar
            avatar={form.avatar}
            className="size-16 text-lg"
            name={form.displayName || form.username}
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            {avatarUpload.isPending ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin text-white"
              />
            ) : (
              <Camera aria-hidden="true" className="size-4 text-white" />
            )}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <TextInput
            label={t('users.field.avatar')}
            onChange={setField('avatar')}
            placeholder="https://"
            value={form.avatar}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label={t('users.field.displayName')}
          onChange={setField('displayName')}
          required
          value={form.displayName}
        />
        <TextInput
          label={t('users.field.username')}
          onChange={setField('username')}
          value={form.username}
        />
        <TextInput
          label={t('users.field.email')}
          onChange={setField('email')}
          type="email"
          value={form.email}
        />
        <TextInput
          label={t('users.field.url')}
          onChange={setField('url')}
          placeholder="https://"
          value={form.url}
        />
      </div>
      <TextArea
        label={t('users.field.bio')}
        onChange={setField('bio')}
        value={form.bio}
      />

      <div className="flex items-center justify-end gap-2">
        {props.footer}
        <Button disabled={submitting || avatarUpload.isPending} type="submit">
          {submitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {props.submitLabel ?? t('common.save')}
        </Button>
      </div>
    </form>
  )
}
