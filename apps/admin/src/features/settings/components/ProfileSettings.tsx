import { Alert, Button, Flexbox, SkeletonText, Text, toast } from '@lobehub/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getMe, updateMe } from '~/api/users'
import { UserProfileForm } from '~/features/users/components/UserProfileForm'
import { getUserErrorMessage } from '~/features/users/utils/users'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'

import { settingsCopy } from '../copy'
import { formatDateTime, getErrorMessage } from '../utils/settings'

export function ProfileSettings() {
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
  })

  if (meQuery.isLoading) return <SkeletonText rows={6} />

  if (!meQuery.data) {
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
    <Flexbox gap={16}>
      {me.lastLoginAt ? (
        <Text type="secondary">
          {t('settings.owner.lastLoginAt', {
            time: formatDateTime(me.lastLoginAt),
          })}
        </Text>
      ) : null}
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
    </Flexbox>
  )
}
