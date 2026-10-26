import { Alert, toast } from '@lobehub/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getMe, updateMe } from '~/api/users'
import { UserProfileForm } from '~/features/users/components/UserProfileForm'
import { getUserErrorMessage } from '~/features/users/utils/users'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { FormSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { settingsCopy } from '../copy'
import { formatDateTime, getErrorMessage } from '../utils/settings'
import { SettingsGroup } from './SettingsPrimitives'

export function ProfileSettings() {
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
  })

  if (!meQuery.isLoading && !meQuery.data) {
    return (
      <Alert
        action={
          <Button onClick={() => meQuery.refetch()} size="small">
            {settingsCopy(locale, 'retry')}
          </Button>
        }
        description={getErrorMessage(
          meQuery.error,
          settingsCopy(locale, 'loadFailedDetail'),
        )}
        showIcon
        title={settingsCopy(locale, 'loadFailed')}
        type="error"
      />
    )
  }

  const me = meQuery.data

  return (
    <SettingsGroup
      desc={
        me?.lastLoginAt
          ? t('settings.owner.lastLoginAt', {
              time: formatDateTime(me.lastLoginAt),
            })
          : undefined
      }
      title={t('settings.owner.section.title')}
    >
      {me ? (
        <UserProfileForm
          key={me.updatedAt ?? me.id}
          onSubmit={async (input) => {
            try {
              const updated = await updateMe(input)
              queryClient.setQueryData(adminQueryKeys.users.me(), updated)
              await queryClient.invalidateQueries({
                queryKey: adminQueryKeys.users.root,
              })
              toast.success(t('settings.owner.success.save'))
            } catch (error) {
              toast.error(
                getUserErrorMessage(error, t('settings.owner.error.save')),
              )
            }
          }}
          user={me}
        />
      ) : (
        <FormSkeleton label={t('settings.common.loading')} rows={5} />
      )}
    </SettingsGroup>
  )
}
