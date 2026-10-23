import { Tag } from '@lobehub/ui'

import { useUsersCopy } from '../copy'
import type { UserStatus } from '../utils/users'

const STATUS_COLOR: Record<UserStatus, 'error' | 'info' | 'success'> = {
  active: 'success',
  deactivated: 'error',
  profileOnly: 'info',
}

export function UserStatusTag(props: { status: UserStatus }) {
  const copy = useUsersCopy()
  const label = {
    active: copy('statusActive'),
    deactivated: copy('statusDeactivated'),
    profileOnly: copy('statusProfileOnly'),
  }[props.status]

  return (
    <Tag color={STATUS_COLOR[props.status]} variant="filled">
      {label}
    </Tag>
  )
}
