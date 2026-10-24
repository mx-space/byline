import { createStaticStyles } from '@lobehub/ui'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'

import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { DetailPane, DetailPlaceholder } from '~/ui/page'
import { FormSkeleton } from '~/ui/placeholders'

import { settingsCopy } from '../copy'
import { getGroupDescription, getGroupTitle } from '../utils/settings'
import { AccountSettings } from './account/AccountSettings'
import { ProfileSettings } from './ProfileSettings'
import { useSettingsRouteContext } from './settings-route-context'
import type { SettingsDirtyAction } from './SettingsActionBar'
import { SettingsActionBarContext, SettingsSaveBar } from './SettingsActionBar'
import { SystemSettings } from './SystemSettings'

const styles = createStaticStyles(({ css, responsive }) => ({
  content: css`
    width: 100%;
    max-width: 800px;
    margin-inline: auto;
    padding-block: 24px 48px;
    padding-inline: 24px;

    ${responsive.md} {
      padding-block: 16px 32px;
      padding-inline: 16px;
    }
  `,
}))

export function SettingsDetailRoute() {
  const { locale, t } = useI18n()
  const { section } = useParams<{ section?: string }>()
  const ctx = useSettingsRouteContext()
  const [dirtyAction, setDirtyAction] = useState<SettingsDirtyAction | null>(
    null,
  )

  const activeGroup = ctx.groups.find((group) => group.key === section)
  const title = section
    ? getGroupTitle(locale, activeGroup ?? { key: section })
    : null
  useDocumentTitle(title)

  if (!section) return null

  if (!activeGroup && ctx.schema) {
    return (
      <DetailPlaceholder
        description={settingsCopy(locale, 'emptyDetail')}
        icon={SlidersHorizontal}
        title={t('settings.shell.title')}
      />
    )
  }

  return (
    <SettingsActionBarContext.Provider value={setDirtyAction}>
      <DetailPane
        backLabel={settingsCopy(locale, 'backToList')}
        footer={
          dirtyAction ? <SettingsSaveBar action={dirtyAction} /> : undefined
        }
        meta={getGroupDescription(locale, activeGroup ?? { key: section })}
        onBack={ctx.onBack}
        padded={false}
        title={title}
      >
        <div className={styles.content}>
          {!activeGroup ? (
            <FormSkeleton label={t('settings.common.loading')} rows={6} />
          ) : null}
          {activeGroup?.type === 'user' ? <ProfileSettings /> : null}
          {activeGroup?.type === 'account' ? <AccountSettings /> : null}
          {activeGroup?.type === 'system' && activeGroup.systemGroup ? (
            <SystemSettings
              activeGroup={activeGroup.systemGroup}
              key={activeGroup.key}
              schema={ctx.schema}
            />
          ) : null}
        </div>
      </DetailPane>
    </SettingsActionBarContext.Provider>
  )
}

export default SettingsDetailRoute
