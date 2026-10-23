import { useMutation } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { UserDetail } from '~/api/users'
import { setUserPermissions } from '~/api/users'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { Switch } from '~/ui/primitives/switch'

import type { PermissionRoleOrCustom } from '../utils/permissions'
import {
  describeCustomPermissions,
  hasPermission,
  matchPermissionRole,
  Permission,
  PERMISSION_FIELDS,
  PERMISSION_ROLES,
  ROLE_LABEL_KEYS,
  togglePermission,
} from '../utils/permissions'
import { getUserErrorMessage } from '../utils/users'

const ROLE_ORDER = ['owner', 'editor', 'author', 'translator'] as const

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
    <section
      aria-labelledby="user-permissions-title"
      className="mt-8 space-y-4 border-t border-border pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-sm font-semibold text-fg"
          id="user-permissions-title"
        >
          {t('users.permission.title')}
        </h2>
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          {t('users.permission.role')}
          <SelectField<PermissionRoleOrCustom>
            aria-label={t('users.permission.role')}
            className="w-44"
            disabled={!props.canEdit}
            onValueChange={(value) => {
              if (value !== 'custom') setMask(PERMISSION_ROLES[value])
            }}
            options={roleOptions}
            value={role}
          />
        </label>
      </div>
      <p className="text-xs text-fg-muted">
        {props.canEdit ? hint : t('users.permission.readOnly')}
      </p>
      <div className="grid gap-x-8 md:grid-cols-2">
        {PERMISSION_FIELDS.map((field) => {
          const locked =
            !props.canEdit ||
            (props.isSelf && field.bit === Permission.ManageUsers)
          return (
            <div
              className="flex items-center justify-between gap-3 border-t border-border/60 py-3"
              key={field.bit}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg">
                  {t(field.label)}
                </div>
                <div className="text-xs text-fg-muted">
                  {props.isSelf && field.bit === Permission.ManageUsers
                    ? t('users.permission.selfLock')
                    : t(field.description)}
                </div>
              </div>
              <Switch
                aria-label={t(field.label)}
                checked={hasPermission(mask, field.bit)}
                disabled={locked}
                onCheckedChange={() =>
                  setMask((current) => togglePermission(current, field.bit))
                }
              />
            </div>
          )
        })}
      </div>
      {props.canEdit ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={!dirty || mutation.isPending}
            onClick={() => setMask(props.user.permissions)}
            type="button"
            variant="subtle"
          >
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!dirty || mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {t('users.permission.save')}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
