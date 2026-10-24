import { Flexbox, Modal, Text, toast } from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'

import type { UserDetail, UserProfileInput } from '~/api/users'
import { createProfileOnlyUser } from '~/api/users'

import { useUsersCopy } from '../copy'
import { getUserErrorMessage } from '../utils/users'
import { UserProfileForm } from './UserProfileForm'

export function CreateAuthorModal(props: {
  onClose: () => void
  onCreated: (user: UserDetail) => void
  open: boolean
}) {
  const copy = useUsersCopy()
  const create = useMutation({
    mutationFn: (input: UserProfileInput) => {
      const { email, ...profile } = input
      return createProfileOnlyUser({
        ...profile,
        ...(email ? { email } : {}),
        displayName: input.displayName ?? '',
      })
    },
    onError: (error: unknown) => {
      toast.error(getUserErrorMessage(error, copy('authorFailed')))
    },
    onSuccess: (user) => {
      props.onCreated(user)
    },
  })

  return (
    <Modal
      footer={false}
      maskClosable={!create.isPending}
      onCancel={() => {
        if (!create.isPending) props.onClose()
      }}
      open={props.open}
      title={copy('addAuthor')}
      width="min(400px, 100%)"
    >
      <Flexbox gap={16}>
        <Text type="secondary">{copy('addAuthorHint')}</Text>
        {props.open ? (
          <UserProfileForm
            onSubmit={async (input) => {
              try {
                await create.mutateAsync(input)
              } catch {
                return undefined
              }
            }}
            submitLabel={copy('createAuthor')}
          />
        ) : null}
      </Flexbox>
    </Modal>
  )
}
