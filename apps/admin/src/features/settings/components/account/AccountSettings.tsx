import { createStaticStyles, Flexbox, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useQueryClient } from '@tanstack/react-query'
import { Fingerprint, Key, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { useI18n } from '~/i18n'
import { Drawer } from '~/ui/feedback/drawer'
import { Button } from '~/ui/site-button'
import { authClient } from '~/utils/authjs/auth'

import { accountQueryKey } from '../../constants'
import { settingsAccountCopy } from '../../copy'
import type { OauthProviderType } from '../../types/settings'
import { presentChangePassword } from '../modals/ChangePasswordModal'
import { SettingRow, SettingsGroup } from '../SettingsPrimitives'
import { OauthSection } from './OauthSection'
import { PasskeyPanel, PasskeyPanelHeaderAction } from './PasskeyPanel'
import { SessionSection } from './SessionSection'
import { TokenPanel, TokenPanelHeaderAction } from './TokenPanel'

const styles = createStaticStyles(({ css }) => ({
  drawer: css`
    width: min(90vw, 32rem);
  `,
  drawerBody: css`
    overflow: hidden;
  `,
}))

export function AccountSettings() {
  const { locale, t } = useI18n()
  const copy = (key: Parameters<typeof settingsAccountCopy>[1]) =>
    settingsAccountCopy(locale, key)
  const form = useForm()
  const [activePanel, setActivePanel] = useState<'passkeys' | 'tokens' | null>(
    null,
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const validateProvider = searchParams.get(
    'validate',
  ) as OauthProviderType | null

  useEffect(() => {
    if (!validateProvider) return

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('validate')
        return next
      },
      { replace: true },
    )

    void authClient.getSession().then((result) => {
      if (result.error || !result.data) {
        toast.error(t('settings.account.error.oauthValidateFailed'))
        return
      }

      toast.success(t('settings.account.success.oauthValidate'))
      void queryClient.invalidateQueries({ queryKey: accountQueryKey })
    })
  }, [queryClient, setSearchParams, t, validateProvider])

  return (
    <>
      <Form form={form} gap={24} variant="outlined">
        <SettingsGroup title={copy('signInTitle')}>
          <SettingRow
            desc={copy('passwordDesc')}
            label={copy('passwordLabel')}
            width="auto"
          >
            <Button icon={Lock} onClick={() => void presentChangePassword()}>
              {copy('passwordAction')}
            </Button>
          </SettingRow>
          <SettingRow
            desc={copy('passkeyDesc')}
            divider
            label={t('settings.account.entry.passkeyTitle')}
            width="auto"
          >
            <Button
              icon={Fingerprint}
              onClick={() => setActivePanel('passkeys')}
            >
              {copy('manage')}
            </Button>
          </SettingRow>
          <SettingRow
            desc={copy('tokenDesc')}
            divider
            label={t('settings.account.entry.tokenTitle')}
            width="auto"
          >
            <Button icon={Key} onClick={() => setActivePanel('tokens')}>
              {copy('manage')}
            </Button>
          </SettingRow>
        </SettingsGroup>
        <SessionSection />
        <OauthSection />
      </Form>

      <Drawer
        bodyClassName={styles.drawerBody}
        footer={
          <Flexbox horizontal justify="flex-end">
            <TokenPanelHeaderAction />
          </Flexbox>
        }
        icon={Key}
        onClose={() => setActivePanel(null)}
        open={activePanel === 'tokens'}
        title={t('settings.account.entry.tokenTitle')}
        widthClassName={styles.drawer}
      >
        <TokenPanel />
      </Drawer>

      <Drawer
        bodyClassName={styles.drawerBody}
        footer={
          <Flexbox horizontal justify="flex-end">
            <PasskeyPanelHeaderAction />
          </Flexbox>
        }
        icon={Fingerprint}
        onClose={() => setActivePanel(null)}
        open={activePanel === 'passkeys'}
        title={t('settings.passkey.title')}
        widthClassName={styles.drawer}
      >
        <PasskeyPanel />
      </Drawer>
    </>
  )
}
