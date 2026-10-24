import { Tag } from '@lobehub/ui'

import { useI18n } from '~/i18n'

import { matchPermissionRole, ROLE_LABEL_KEYS } from '../utils/permissions'

export function UserRoleTag(props: { permissions: number }) {
  const { t } = useI18n()
  const role = matchPermissionRole(props.permissions)
  return (
    <Tag color={role === 'owner' ? 'processing' : undefined}>
      {t(ROLE_LABEL_KEYS[role])}
    </Tag>
  )
}
