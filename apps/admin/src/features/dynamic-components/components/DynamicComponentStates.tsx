import { Empty } from '@lobehub/ui'
import { Blocks, Plus } from 'lucide-react'

import { useI18n } from '~/i18n'
import { DetailPlaceholder, Page } from '~/ui/page'
import { Button } from '~/ui/site-button'

export function DynamicComponentsEmptyPage(props: { onCreate: () => void }) {
  const { t } = useI18n()
  return (
    <Page
      description={t('routes.dynamicComponents.description')}
      title={t('routes.dynamicComponents.title')}
      width="wide"
    >
      <Empty
        action={
          <Button icon={Plus} onClick={props.onCreate} type="primary">
            {t('dynamicComponents.add')}
          </Button>
        }
        description={t('dynamicComponents.empty.description')}
        icon={Blocks}
        title={t('dynamicComponents.empty.title')}
      />
    </Page>
  )
}

export function DynamicComponentDetailEmptyState() {
  const { t } = useI18n()
  return (
    <DetailPlaceholder
      description={t('dynamicComponents.detailEmpty.description')}
      icon={Blocks}
      title={t('dynamicComponents.detailEmpty.title')}
    />
  )
}
