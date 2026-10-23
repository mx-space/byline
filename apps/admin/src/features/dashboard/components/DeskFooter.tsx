import { Button, Flexbox, Text } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'

import { useI18n } from '~/i18n'

import { useDashboardCopy } from '../copy'
import { appInfoQuery } from '../queries'
import { versionLabel } from '../utils/desk'

export function DeskFooter() {
  const { t } = useI18n()
  const copy = useDashboardCopy()
  const query = useQuery(appInfoQuery)
  const adminVersion = versionLabel(__DEV__ ? 'dev mode' : window.version)

  if (query.isError && !query.data) {
    return (
      <Flexbox align="center" gap={8} horizontal>
        <Text type="secondary">{copy('versionError')}</Text>
        <Button
          loading={query.isFetching}
          onClick={() => void query.refetch()}
          size="small"
          type="text"
        >
          {t('common.retry')}
        </Button>
      </Flexbox>
    )
  }

  return (
    <Text type="secondary">
      {t('dashboard.footer.versions', {
        admin: adminVersion,
        system: query.data ? versionLabel(query.data.version) : '--',
      })}
    </Text>
  )
}
