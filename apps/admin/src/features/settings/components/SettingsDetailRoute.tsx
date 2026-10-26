import { ActionIcon, createStaticStyles } from '@lobehub/ui'
import { PageHeader } from '@lobehub/ui/dashboard'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'

import { useDocumentTitle } from '~/hooks/use-document-title'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
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
  back: css`
    align-self: flex-start;
  `,
  content: css`
    display: flex;
    flex-direction: column;
    gap: 20px;

    width: 100%;
    max-width: 800px;
    margin-inline: auto;
    padding-block: 28px 48px;
    padding-inline: 32px;

    ${responsive.md} {
      gap: 16px;
      padding-block: 16px 32px;
      padding-inline: 16px;
    }
  `,
}))

export function SettingsDetailRoute() {
  const { locale, t } = useI18n()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
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
        footer={
          dirtyAction ? <SettingsSaveBar action={dirtyAction} /> : undefined
        }
        hideHeader
        padded={false}
      >
        <div className={styles.content}>
          {isDesktop ? null : (
            <ActionIcon
              aria-label={settingsCopy(locale, 'backToList')}
              className={styles.back}
              icon={ArrowLeft}
              onClick={ctx.onBack}
              title={settingsCopy(locale, 'backToList')}
            />
          )}
          <PageHeader
            description={getGroupDescription(
              locale,
              activeGroup ?? { key: section },
            )}
            title={title}
          />
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
