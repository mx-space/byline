import { useI18n } from '~/i18n'
import { Badge } from '~/ui/primitives/badge'

import { matchPermissionRole, ROLE_LABEL_KEYS } from '../utils/permissions'

export function UserRoleBadge(props: { permissions: number }) {
  const { t } = useI18n()
  const role = matchPermissionRole(props.permissions)
  return (
    <Badge
      pill
      size="sm"
      tone={role === 'owner' ? 'accent' : 'neutral'}
      variant={role === 'custom' ? 'outline' : 'soft'}
    >
      {t(ROLE_LABEL_KEYS[role])}
    </Badge>
  )
}
