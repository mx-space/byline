import {
  createStaticStyles,
  Flexbox,
  Select,
  Switch,
  Text,
  toast,
} from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useState } from 'react'

import type { UserDetail } from '~/api/users'
import { setUserPermissions } from '~/api/users'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/site-button'

import type { PermissionRoleOrCustom } from '../utils/permissions'
import {
  applyPermissionRole,
  describeCustomPermissions,
  hasPermission,
  matchPermissionRole,
  Permission,
  PERMISSION_FIELDS,
  ROLE_LABEL_KEYS,
  togglePermission,
} from '../utils/permissions'
import { getUserErrorMessage } from '../utils/users'

const ROLE_ORDER = ['owner', 'editor', 'author', 'translator'] as const

const styles = createStaticStyles(({ css, cssVar }) => ({
  list: css`
    display: flex;
    flex-direction: column;

    padding-inline: 16px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
  `,
  role: css`
    width: 176px;
  `,
  row: css`
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    padding-block: 12px;

    & + & {
      border-block-start: 1px solid ${cssVar.colorBorderSecondary};
    }
  `,
  rowText: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
}))

interface UserPermissionsCardProps {
  canEdit: boolean
  isSelf: boolean
  onSaved: (user: UserDetail) => Promise<void>
  user: UserDetail
}

export function UserPermissionsCard(props: UserPermissionsCardProps) {
  const { t } = useI18n()
  const [mask, setMask] = useState(props.user.permissions)
  const role = matchPermissionRole(mask)
  const dirty = mask !== props.user.permissions

  const mutation = useMutation({
    mutationFn: () => setUserPermissions(props.user.id, mask),
    onError: (error: unknown) =>
      toast.error(getUserErrorMessage(error, t('users.permission.saveFailed'))),
    onSuccess: async (updated) => {
      toast.success(t('users.permission.saved'))
      await props.onSaved(updated)
    },
  })

  const roleOptions: { label: string; value: PermissionRoleOrCustom }[] = [
    ...ROLE_ORDER.map((value) => ({ label: t(ROLE_LABEL_KEYS[value]), value })),
    ...(role === 'custom'
      ? [{ label: t('users.role.custom'), value: 'custom' as const }]
      : []),
  ]

  const custom = role === 'custom' ? describeCustomPermissions(mask) : null
  const addedLabels = custom?.added
    .map((bit) => {
      const field = PERMISSION_FIELDS.find((item) => item.bit === bit)
      return field ? t(field.label) : ''
    })
    .join('、')
  const hint = !custom
    ? t('users.permission.roleOverwrites')
    : custom.base
      ? t('users.permission.customHint', {
          added: addedLabels ?? '',
          base: t(ROLE_LABEL_KEYS[custom.base]),
        })
      : t('users.permission.customHintNoBase', { added: addedLabels ?? '' })

  return (
    <Flexbox aria-labelledby="user-permissions-title" as="section" gap={12}>
      <Flexbox
        align="center"
        gap={12}
        horizontal
        justify="space-between"
        wrap="wrap"
      >
        <Text id="user-permissions-title" strong>
          {t('users.permission.title')}
        </Text>
        <Select
          aria-label={t('users.permission.role')}
          className={styles.role}
          disabled={!props.canEdit}
          onChange={(value: PermissionRoleOrCustom) => {
            if (value !== 'custom') {
              setMask(applyPermissionRole(value, { isSelf: props.isSelf }))
            }
          }}
          options={roleOptions}
          prefix={t('users.permission.role')}
          value={role}
        />
      </Flexbox>
      <Text fontSize={12} type="secondary">
        {props.canEdit ? hint : t('users.permission.readOnly')}
      </Text>
      <div className={styles.list}>
        {PERMISSION_FIELDS.map((field) => {
          const selfLocked =
            props.isSelf && field.bit === Permission.ManageUsers
          return (
            <div className={styles.row} key={field.bit}>
              <div className={styles.rowText}>
                <Text>{t(field.label)}</Text>
                <Text fontSize={12} type="secondary">
                  {selfLocked
                    ? t('users.permission.selfLock')
                    : t(field.description)}
                </Text>
              </div>
              <Switch
                aria-label={t(field.label)}
                checked={hasPermission(mask, field.bit)}
                disabled={!props.canEdit || selfLocked}
                onChange={() =>
                  setMask((current) => togglePermission(current, field.bit))
                }
              />
            </div>
          )
        })}
      </div>
      {props.canEdit ? (
        <Flexbox gap={8} horizontal justify="flex-end">
          <Button
            disabled={!dirty || mutation.isPending}
            onClick={() => setMask(props.user.permissions)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!dirty}
            icon={Save}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
            type="primary"
          >
            {t('users.permission.save')}
          </Button>
        </Flexbox>
      ) : null}
    </Flexbox>
  )
}
