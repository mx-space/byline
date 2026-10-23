import { createStaticStyles, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fingerprint, Plus, Shield, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { deletePasskey, listPasskeys } from '~/api/auth'
import { getOption, patchOption } from '~/api/options'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { FormSwitch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'
import { authClient } from '~/utils/authjs/auth'

import { accountQueryKey } from '../../constants'
import { formatDateTime, getErrorMessage } from '../../utils/settings'
import { EmptyState } from '../SettingsPrimitives'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  uf27cdd9d: css`
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding: 1rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  u8a292509: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  `,
  uebf7b214: css`
    min-width: 12rem;
    flex: 1 1 0%;
  `,
  u36e579c0: css`
    flex: 1 1 0%;
  `,
  uf01b33ec: css`
    padding: 1rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ucc46d0fa: css`
    width: 1.75rem;
    height: 1.75rem;
  `,
  u80b47be2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      border-top-width: 1px;
      border-top-style: solid;
    }
    border-color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  uf21304d3: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem;
  `,
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  ue43bc276: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
  `,
  u85c4ac8b: css`
    margin-top: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u8342d5c2: css`
    margin-top: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
}))

export function PasskeyPanelHeaderAction() {
  const { t } = useI18n()
  const validateMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.passkey()
      if (result.error) {
        throw new Error(
          result.error.message || t('settings.passkey.error.validate'),
        )
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.passkey.error.validate'))),
    onSuccess: () => {
      toast.success(t('settings.passkey.success.validate'))
    },
  })

  return (
    <Button
      disabled={validateMutation.isPending}
      onClick={() => validateMutation.mutate()}
      type="button"
      variant="subtle"
    >
      <Shield aria-hidden="true" className={lobeStyles.uf7b5fa97} />
      {t('settings.passkey.action.validate')}
    </Button>
  )
}

export function PasskeyPanel() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const authSecurityQuery = useQuery({
    queryFn: () =>
      getOption<{ disablePasswordLogin?: boolean }>('authSecurity'),
    queryKey: adminQueryKeys.settings.authSecurity(),
  })

  const passkeysQuery = useQuery({
    queryFn: listPasskeys,
    queryKey: adminQueryKeys.settings.passkeys(),
  })

  const updateAuthSecurityMutation = useMutation({
    mutationFn: (disablePasswordLogin: boolean) =>
      patchOption('authSecurity', { disablePasswordLogin }),
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.passkey.error.updateAuthSecurity')),
      ),
    onSuccess: async () => {
      toast.success(t('settings.passkey.success.updateAuthSecurity'))
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey({
        name:
          name.trim() ||
          t('settings.passkey.nameDefault', {
            date: new Date().toLocaleDateString(),
          }),
      })
      if (result.error)
        throw new Error(
          result.error.message || t('settings.passkey.error.addFailed'),
        )
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.passkey.error.add'))),
    onSuccess: async () => {
      toast.success(t('settings.passkey.success.add'))
      setName('')
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePasskey,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.passkey.error.delete'))),
    onSuccess: async () => {
      toast.success(t('settings.passkey.success.delete'))
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  return (
    <>
      <div className={lobeStyles.uf27cdd9d}>
        <FormSwitch
          checked={Boolean(authSecurityQuery.data?.disablePasswordLogin)}
          description={t('settings.passkey.switch.disablePasswordDescription')}
          disabled={
            authSecurityQuery.isLoading || updateAuthSecurityMutation.isPending
          }
          label={t('settings.passkey.switch.disablePassword')}
          onCheckedChange={(checked) => {
            if (checked && (passkeysQuery.data ?? []).length === 0) {
              toast.error(t('settings.passkey.error.needOne'))
              return
            }
            updateAuthSecurityMutation.mutate(checked)
          }}
        />
      </div>
      <div className={lobeStyles.uf27cdd9d}>
        <form
          className={lobeStyles.u8a292509}
          onSubmit={(event) => {
            event.preventDefault()
            addMutation.mutate()
          }}
        >
          <TextInput
            className={lobeStyles.uebf7b214}
            onChange={setName}
            placeholder={t('settings.passkey.namePlaceholder')}
            value={name}
          />
          <Button disabled={addMutation.isPending} type="submit">
            <Plus aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            {t('settings.passkey.action.add')}
          </Button>
        </form>
      </div>
      <Scroll className={lobeStyles.u36e579c0}>
        {passkeysQuery.isLoading ? (
          <div className={lobeStyles.uf01b33ec}>
            {t('settings.common.loading')}
          </div>
        ) : (passkeysQuery.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Fingerprint className={lobeStyles.ucc46d0fa} />}
            label={t('settings.passkey.empty')}
          />
        ) : (
          <div className={lobeStyles.u80b47be2}>
            {passkeysQuery.data?.map((passkey) => (
              <div className={lobeStyles.uf21304d3} key={passkey.id}>
                <div className={lobeStyles.u7e0b7cdf}>
                  <h3 className={lobeStyles.ue43bc276}>
                    {passkey.name || passkey.id}
                  </h3>
                  <p className={lobeStyles.u85c4ac8b}>{passkey.credentialID}</p>
                  <p className={lobeStyles.u8342d5c2}>
                    {t('settings.passkey.createdAt', {
                      time: formatDateTime(passkey.createdAt),
                    })}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (window.confirm(t('settings.passkey.confirm.delete'))) {
                      deleteMutation.mutate(passkey.id)
                    }
                  }}
                  type="button"
                  variant="subtle"
                >
                  <Trash2 aria-hidden="true" className={lobeStyles.uf7b5fa97} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Scroll>
    </>
  )
}
