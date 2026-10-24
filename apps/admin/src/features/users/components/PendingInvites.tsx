import {
  ActionIcon,
  Alert,
  Flexbox,
  Modal,
  Tag,
  Text,
  toast,
} from '@lobehub/ui'
import { Section } from '@lobehub/ui/dashboard'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { UserInvite } from '~/api/users'
import { getInvites, revokeInvite } from '~/api/users'
import { adminQueryKeys } from '~/query/keys'
import { emptyOr } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useUsersCopy } from '../copy'
import {
  EMPTY_VALUE,
  formatAdminTime,
  getUserErrorMessage,
} from '../utils/users'

export function PendingInvites() {
  const copy = useUsersCopy()
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<UserInvite | null>(null)
  const [error, setError] = useState('')
  const invitesQuery = useQuery({
    queryFn: getInvites,
    queryKey: adminQueryKeys.users.invites(),
  })
  const revoke = useMutation({
    mutationFn: revokeInvite,
    onError: (revokeError: unknown) => {
      setError(getUserErrorMessage(revokeError, copy('revokeFailed')))
    },
    onSuccess: async () => {
      setTarget(null)
      setError('')
      toast.success(copy('revoked'))
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.users.invites(),
      })
    },
  })

  if (invitesQuery.isLoading) return null

  if (invitesQuery.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void invitesQuery.refetch()}>
            {copy('retry')}
          </Button>
        }
        title={copy('invitesError')}
        type="error"
      />
    )
  }

  const invites = invitesQuery.data ?? []
  if (invites.length === 0) return null

  return (
    <Section
      extra={invites.length}
      gap={8}
      title={copy('pendingTitle')}
      variant="card"
    >
      {invites.map((invite) => {
        const expired = Date.parse(invite.expiresAt) < Date.now()
        const time = formatAdminTime(invite.expiresAt)
        return (
          <Flexbox
            align="center"
            gap={8}
            horizontal
            justify="space-between"
            key={invite.id}
          >
            <Flexbox allowShrink flex={1} gap={4}>
              <Flexbox align="center" gap={8} horizontal>
                <Text ellipsis={{ tooltipWhenOverflow: true }}>
                  {emptyOr(invite.displayName || invite.email)}
                </Text>
                {invite.userId ? <Tag>{copy('linked')}</Tag> : null}
                {expired ? <Tag color="warning">{copy('expired')}</Tag> : null}
              </Flexbox>
              <Text ellipsis={{ tooltipWhenOverflow: true }} type="secondary">
                {invite.displayName ? emptyOr(invite.email) : null}
                {invite.displayName && !expired && time !== EMPTY_VALUE
                  ? ' · '
                  : null}
                {!expired && time !== EMPTY_VALUE
                  ? copy('expiresAt', { time })
                  : null}
              </Text>
            </Flexbox>
            <ActionIcon
              aria-label={copy('revoke')}
              danger
              disabled={revoke.isPending && revoke.variables === invite.id}
              icon={Trash2}
              onClick={() => {
                setError('')
                setTarget(invite)
              }}
              size="small"
              title={copy('revoke')}
            />
          </Flexbox>
        )
      })}
      <Modal
        cancelText={copy('cancel')}
        confirmLoading={revoke.isPending}
        maskClosable={!revoke.isPending}
        okButtonProps={{ danger: true }}
        okText={copy('revoke')}
        onCancel={() => {
          if (!revoke.isPending) {
            setTarget(null)
            setError('')
          }
        }}
        onOk={() => {
          if (target) revoke.mutate(target.id)
        }}
        open={target !== null}
        title={
          target ? copy('revokeTitle', { email: target.email }) : copy('revoke')
        }
        width="min(400px, 100%)"
      >
        <Flexbox gap={12}>
          <Text>{copy('revokeBody')}</Text>
          {error ? <Alert title={error} type="error" /> : null}
        </Flexbox>
      </Modal>
    </Section>
  )
}
