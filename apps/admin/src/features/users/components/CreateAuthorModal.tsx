import { UserRoundPen } from 'lucide-react'
import { toast } from 'sonner'

import type { UserDetail } from '~/api/users'
import { createProfileOnlyUser } from '~/api/users'
import { useI18n } from '~/i18n'
import { ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'

import { getUserErrorMessage } from '../utils/users'
import { UserProfileForm } from './UserProfileForm'

function CreateAuthorModal() {
  const { t } = useI18n()
  const modal = useModal<UserDetail>()

  return (
    <div className="flex min-h-0 flex-col">
      <ModalHeader
        icon={UserRoundPen}
        subtitle={t('users.author.description')}
        title={t('users.author.title')}
      />
      <div className="px-5 py-5">
        <UserProfileForm
          onSubmit={async (input) => {
            try {
              const { email, ...profile } = input
              const created = await createProfileOnlyUser({
                ...profile,
                ...(email ? { email } : {}),
                displayName: input.displayName ?? '',
              })
              modal.close(created)
            } catch (error) {
              toast.error(getUserErrorMessage(error, t('users.author.failed')))
            }
          }}
          submitLabel={t('common.create')}
        />
      </div>
    </div>
  )
}

export async function presentCreateAuthor() {
  return await present<Record<string, never>, UserDetail>(
    CreateAuthorModal,
    {},
    { modalProps: { popupStyle: { width: 'min(94vw, 40rem)' } } },
  )
}
