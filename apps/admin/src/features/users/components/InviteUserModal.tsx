import { Alert, Flexbox, Input, Modal, Select, Text, toast } from '@lobehub/ui'
import { Form, useForm, useWatch } from '@lobehub/ui/form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'

import type { CreatedUserInvite, UserDetail } from '~/api/users'
import { createInvite, getUsers, inviteExistingUser } from '~/api/users'
import { adminQueryKeys } from '~/query/keys'
import { FormSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useUsersCopy } from '../copy'
import {
  buildInviteRequest,
  getUserDisplayName,
  getUserErrorMessage,
} from '../utils/users'

const NONE = 'none'

const inviteSchema = z.object({
  displayName: z.string(),
  email: z.string(),
  linkedAuthorId: z.string(),
})

const emailSchema = z.email()

export function InviteUserModal(props: {
  onClose: () => void
  onCreated: () => void
  open: boolean
  user?: Pick<UserDetail, 'displayName' | 'email' | 'id' | 'username'>
}) {
  return (
    <Modal
      footer={false}
      maskClosable
      onCancel={props.onClose}
      open={props.open}
      title={false}
      width="min(400px, 100%)"
    >
      {props.open ? (
        <InviteBody
          onClose={props.onClose}
          onCreated={props.onCreated}
          user={props.user}
        />
      ) : null}
    </Modal>
  )
}

function InviteBody(props: {
  onClose: () => void
  onCreated: () => void
  user?: Pick<UserDetail, 'displayName' | 'email' | 'id' | 'username'>
}) {
  const copy = useUsersCopy()
  const queryClient = useQueryClient()
  const target = props.user
  const [created, setCreated] = useState<CreatedUserInvite | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const authorsQuery = useQuery({
    enabled: !target,
    queryFn: () => getUsers({ page: 1, size: 100, status: 'profile_only' }),
    queryKey: adminQueryKeys.users.list({ search: '', status: 'profile_only' }),
  })
  const linkableAuthors = (authorsQuery.data?.data ?? []).filter(
    (author) => !author.deactivatedAt,
  )

  const invite = useMutation({
    mutationFn: async (values: {
      displayName: string
      email: string
      linkedAuthorId: string
    }) => {
      const request = buildInviteRequest({
        displayName: values.displayName,
        email: values.email,
        linkedAuthorId:
          values.linkedAuthorId === NONE ? '' : values.linkedAuthorId,
      })
      return request.kind === 'existing'
        ? inviteExistingUser(request.userId, { email: request.email })
        : createInvite({
            displayName: request.displayName,
            email: request.email,
          })
    },
    onError: (mutationError: unknown) => {
      setError(getUserErrorMessage(mutationError, copy('inviteFailed')))
    },
    onSuccess: async (result) => {
      setCreated(result)
      props.onCreated()
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users.invites(),
      })
    },
  })

  const form = useForm({
    initialValues: {
      displayName: '',
      email: target?.email ?? '',
      linkedAuthorId: target?.id ?? NONE,
    },
    onSubmit: async (values) => {
      const email = values.email.trim()
      if (!email) {
        form.setErrors({ email: copy('emailRequired') })
        return
      }
      if (!emailSchema.safeParse(email).success) {
        form.setErrors({ email: copy('emailInvalid') })
        return
      }
      setError('')
      try {
        await invite.mutateAsync({ ...values, email })
      } catch {
        return
      }
    },
    schema: inviteSchema,
  })
  const linkedAuthorId = useWatch(form, 'linkedAuthorId')

  const copyLink = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.acceptUrl)
      setCopied(true)
    } catch (copyError) {
      toast.error(getUserErrorMessage(copyError, copy('inviteFailed')))
    }
  }

  if (created) {
    return (
      <Flexbox gap={16}>
        <Text as="h2" weight="bold">
          {copy('inviteCreated')}
        </Text>
        <Text>
          {created.emailQueued
            ? copy('emailQueued', { email: created.email })
            : copy('emailNotQueued')}
        </Text>
        <Text ellipsis={{ tooltip: created.acceptUrl }}>
          {created.acceptUrl}
        </Text>
        <Flexbox gap={8} horizontal justify="flex-end">
          <Button htmlType="button" onClick={() => void copyLink()}>
            {copied ? copy('copied') : copy('copyLink')}
          </Button>
          <Button htmlType="button" onClick={props.onClose}>
            {copy('done')}
          </Button>
        </Flexbox>
      </Flexbox>
    )
  }

  const title = target
    ? copy('inviteExistingTitle', { name: getUserDisplayName(target) })
    : copy('invite')

  return (
    <Form form={form} gap={16} layout="vertical">
      <Text as="h2" weight="bold">
        {title}
      </Text>
      <Form.Field
        label={copy('email')}
        name="email"
        required={copy('emailRequired')}
      >
        <Input type="email" />
      </Form.Field>
      {target ? null : authorsQuery.isLoading ? (
        <FormSkeleton label={copy('loadingAuthors')} rows={1} />
      ) : authorsQuery.isError ? (
        <Alert
          action={
            <Button
              htmlType="button"
              onClick={() => void authorsQuery.refetch()}
            >
              {copy('retry')}
            </Button>
          }
          title={copy('authorsError')}
          type="error"
        />
      ) : linkableAuthors.length === 0 ? null : (
        <Flexbox gap={8}>
          <Form.Field label={copy('linkAuthor')} name="linkedAuthorId">
            <Select
              options={[
                { label: copy('linkAuthorNone'), value: NONE },
                ...linkableAuthors.map((author) => ({
                  label: getUserDisplayName(author),
                  value: author.id,
                })),
              ]}
            />
          </Form.Field>
          {linkedAuthorId && linkedAuthorId !== NONE ? (
            <Text type="secondary">{copy('linkAuthorHint')}</Text>
          ) : null}
        </Flexbox>
      )}
      {target || (linkedAuthorId && linkedAuthorId !== NONE) ? null : (
        <Form.Field label={copy('displayName')} name="displayName">
          <Input />
        </Form.Field>
      )}
      {error ? <Alert title={error} type="error" /> : null}
      <Flexbox gap={8} horizontal justify="flex-end">
        <Button htmlType="button" onClick={props.onClose}>
          {copy('cancel')}
        </Button>
        <Button htmlType="submit" loading={invite.isPending} type="primary">
          {copy('inviteSubmit')}
        </Button>
      </Flexbox>
    </Form>
  )
}
