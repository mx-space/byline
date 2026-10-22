import { useI18n } from '~/i18n'
import { Badge } from '~/ui/primitives/badge'

import type { UserStatus } from '../utils/users'

export function UserStatusBadge(props: { status: UserStatus }) {
  const { t } = useI18n()
  if (props.status === 'deactivated') {
    return (
      <Badge pill size="sm" tone="danger" variant="soft">
        {t('users.status.deactivated')}
      </Badge>
    )
  }
  if (props.status === 'profileOnly') {
    return (
      <Badge pill size="sm" tone="neutral" variant="soft">
        {t('users.status.profileOnly')}
      </Badge>
    )
  }
  return (
    <Badge pill size="sm" tone="success" variant="soft">
      {t('users.status.active')}
    </Badge>
  )
}
