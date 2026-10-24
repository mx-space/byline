import { Flexbox, Highlighter, Tabs } from '@lobehub/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router'

import { useI18n } from '~/i18n'
import { formatJson, samplePropsFromSchema } from '~/lib/dynamic-props'
import { confirmDialog } from '~/ui/feedback/confirm'
import { DetailPane } from '~/ui/page'
import { PropsEditor } from '~/ui/patterns/PropsEditor'
import { Button } from '~/ui/site-button'

import type { DynamicComponentItem } from '../types/dynamic-components'
import { DynamicComponentPreview } from './DynamicComponentPreview'
import { DynamicComponentSourcePanel } from './DynamicComponentSourcePanel'
import { styles } from './styles'

type DetailTab = 'preview' | 'schema' | 'source'

export function DynamicComponentDetail(props: {
  item: DynamicComponentItem
  onBack: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const { t } = useI18n()
  const { item } = props
  const [tab, setTab] = useState<DetailTab>('preview')
  const [previewProps, setPreviewProps] = useState(() =>
    samplePropsFromSchema(item.propsSchema),
  )
  const [sourceDraft, setSourceDraft] = useState<string | null>(null)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      sourceDraft !== null &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    void confirmDialog({
      confirmText: t('common.leave'),
      description: t('dynamicComponents.source.leaveDescription'),
      title: t('dynamicComponents.source.leaveTitle'),
    }).then((ok) => {
      if (ok) blocker.proceed()
      else blocker.reset()
    })
  }, [blocker, t])

  const showParentUrl =
    item.parentUrl && !item.previousUrls?.includes(item.parentUrl)
  const hasHistory = Boolean(showParentUrl || item.previousUrls?.length)

  return (
    <DetailPane
      actions={
        <Flexbox align="center" gap={8} horizontal>
          <Button icon={Pencil} onClick={props.onEdit}>
            {t('dynamicComponents.detail.edit')}
          </Button>
          <Button
            aria-label={t('dynamicComponents.detail.delete')}
            danger
            icon={Trash2}
            onClick={props.onDelete}
            title={t('dynamicComponents.detail.delete')}
            type="text"
          />
        </Flexbox>
      }
      backLabel={t('dynamicComponents.detail.backAria')}
      contentWidth={tab === 'source' ? 'full' : 'default'}
      meta={
        <>
          <span className={styles.mono} title={item.url}>
            {item.url}
          </span>
          <span>
            {`${t('dynamicComponents.detail.initialHeight')} ${item.initialHeight}px`}
          </span>
        </>
      }
      onBack={props.onBack}
      tabs={
        <div className={styles.tabs}>
          <Tabs
            activeKey={tab}
            items={[
              { key: 'preview', label: t('dynamicComponents.detail.preview') },
              {
                key: 'schema',
                label: t('dynamicComponents.detail.propsSchema'),
              },
              { key: 'source', label: t('dynamicComponents.detail.source') },
            ]}
            onChange={(key) => setTab(key as DetailTab)}
            variant="square"
          />
        </div>
      }
      title={item.name}
    >
      <div className={styles.body}>
        <p className={styles.description}>
          {item.description || t('dynamicComponents.detail.noDescription')}
        </p>

        {tab === 'preview' ? (
          <div className={styles.previewPanel}>
            <div className={styles.previewFrame}>
              <DynamicComponentPreview
                componentProps={previewProps}
                initialHeight={item.initialHeight}
                url={item.url}
              />
            </div>
            <PropsEditor
              onChange={setPreviewProps}
              schema={item.propsSchema}
              value={previewProps}
            />
            <p className={styles.hint}>
              {t('dynamicComponents.detail.samplePropsHint')}
            </p>
          </div>
        ) : tab === 'schema' ? (
          <Highlighter
            className={styles.schemaCode}
            language="json"
            variant="filled"
          >
            {formatJson(item.propsSchema)}
          </Highlighter>
        ) : (
          <DynamicComponentSourcePanel
            draft={sourceDraft}
            item={item}
            onDraftChange={setSourceDraft}
            onPreviewPropsChange={setPreviewProps}
            previewProps={previewProps}
          />
        )}

        {hasHistory ? (
          <dl className={styles.facts}>
            {showParentUrl ? (
              <>
                <dt>{t('dynamicComponents.detail.parentUrl')}</dt>
                <dd>{item.parentUrl}</dd>
              </>
            ) : null}
            {item.previousUrls?.length ? (
              <>
                <dt>{t('dynamicComponents.detail.previousUrls')}</dt>
                <dd>
                  {item.previousUrls.toReversed().map((url) => (
                    <div key={url}>{url}</div>
                  ))}
                </dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </div>
    </DetailPane>
  )
}
