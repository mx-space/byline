import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getMe, updateMe } from '~/api/users'
import { UserProfileForm } from '~/features/users/components/UserProfileForm'
import { getUserErrorMessage } from '~/features/users/utils/users'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'

import { formatDateTime } from '../utils/settings'
import { SettingsSection, SettingsSkeleton } from './SettingsPrimitives'

export function ProfileSettings() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
  })

  if (meQuery.isLoading || !meQuery.data)
    return <SettingsSkeleton title={t('settings.owner.section.title')} />

  const me = meQuery.data

  return (
    <SettingsSection
      description={
        me.lastLoginAt
          ? t('settings.owner.lastLoginAt', {
              time: formatDateTime(me.lastLoginAt),
            })
          : t('settings.owner.description')
      }
      title={t('settings.owner.section.title')}
    >
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
    </SettingsSection>
  )
}
