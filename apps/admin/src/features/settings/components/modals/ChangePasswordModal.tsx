import { createStaticStyles, toast } from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { resetAllCollections } from '~/data/resource/collection'
import { useI18n } from '~/i18n'
import { ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient, clearAuthBearerToken } from '~/utils/authjs/auth'

import { getErrorMessage } from '../../utils/settings'

const lobeStyles = createStaticStyles(({ css }) => ({
  ued384759: css`
    display: flex;
    width: 100%;
    flex-direction: column;
  `,
  u9064cfd6: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem;
    }
    padding-inline: 1.25rem;
    padding-block: 1rem;
  `,
  u6efbbc71: css`
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  `,
}))

function ChangePasswordModal() {
  const { t } = useI18n()
  const modal = useModal<boolean>()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword)
        throw new Error(t('settings.password.error.empty'))
      if (newPassword !== confirmPassword)
        throw new Error(t('settings.password.error.mismatch'))
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (result.error)
        throw new Error(
          result.error.message || t('settings.password.error.failed'),
        )
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.password.error.failed'))),
    onSuccess: async () => {
      toast.success(t('settings.password.success'))
      modal.close(true)
      await authClient.signOut()
      clearAuthBearerToken()
      resetAllCollections()
      navigate('/login')
    },
  })

  return (
    <div className={lobeStyles.ued384759}>
      <ModalHeader title={t('settings.password.title')} />
      <form
        className={lobeStyles.u9064cfd6}
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <TextInput
          label={t('settings.password.field.current')}
          onChange={setCurrentPassword}
          type="password"
          value={currentPassword}
        />
        <TextInput
          label={t('settings.password.field.new')}
          onChange={setNewPassword}
          type="password"
          value={newPassword}
        />
        <TextInput
          label={t('settings.password.field.confirm')}
          onChange={setConfirmPassword}
          type="password"
          value={confirmPassword}
        />
        <div className={lobeStyles.u6efbbc71}>
          <Button
            onClick={() => modal.dismiss()}
            type="button"
            variant="subtle"
          >
            {t('common.cancel')}
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            {t('settings.password.confirm.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function presentChangePassword() {
  return present(
    ChangePasswordModal,
    {},
    { modalProps: { popupStyle: { width: 'min(92vw, 28rem)' } } },
  )
}
