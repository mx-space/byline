import { Alert, Center, Text, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { PropsEditor } from '~/ui/patterns/PropsEditor'
import { CodeEditor } from '~/ui/primitives/code-editor'
import { Button } from '~/ui/site-button'

import { useApplyDynamicCatalog } from '../hooks/use-dynamic-catalog'
import { useLiveModule } from '../hooks/use-live-module'
import type { DynamicComponentItem } from '../types/dynamic-components'
import {
  fetchComponentSource,
  saveComponentSource,
} from '../utils/component-source'
import { DynamicComponentPreview } from './DynamicComponentPreview'
import { styles } from './styles'

const allowAnyUrl = () => true

export function DynamicComponentSourcePanel(props: {
  draft: string | null
  item: DynamicComponentItem
  onDraftChange: Dispatch<SetStateAction<string | null>>
  onPreviewPropsChange: (value: Record<string, unknown>) => void
  previewProps: Record<string, unknown>
}) {
  const { t } = useI18n()
  const { item } = props
  const queryClient = useQueryClient()
  const applyCatalog = useApplyDynamicCatalog()

  const sourceQuery = useQuery({
    queryFn: () => fetchComponentSource(item.url),
    queryKey: adminQueryKeys.dynamicComponents.source(item.url),
    staleTime: Infinity,
  })
  const source = props.draft ?? sourceQuery.data ?? null
  const dirty = props.draft !== null && props.draft !== sourceQuery.data
  const live = useLiveModule(source, props.previewProps)

  const saveMutation = useMutation({
    mutationFn: (code: string) => saveComponentSource(item, code),
    onError: (error) => {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t('dynamicComponents.source.saveFailed'),
      )
    },
    onSuccess: (catalog, code) => {
      const saved = catalog.components.find((entry) => entry.id === item.id)
      if (saved) {
        queryClient.setQueryData(
          adminQueryKeys.dynamicComponents.source(saved.url),
          code,
        )
      }
      applyCatalog(catalog)
      props.onDraftChange((current) => (current === code ? null : current))
      toast.success(t('dynamicComponents.source.saved'))
    },
  })

  const save = () => {
    if (dirty && source !== null && !saveMutation.isPending)
      saveMutation.mutate(source)
  }

  if (sourceQuery.isError) {
    return (
      <Alert
        showIcon
        title={t('dynamicComponents.source.unavailable')}
        type="warning"
      />
    )
  }

  return (
    <div className={styles.sourceRoot}>
      <div className={styles.sourceGrid}>
        <div className={styles.sourceCode}>
          <div className={styles.sourceEditor}>
            {source === null ? (
              <Center className={styles.sourceLoading}>
                <Text type="secondary">{t('common.loading')}</Text>
              </Center>
            ) : (
              <CodeEditor
                dirty={dirty}
                language="javascript"
                onChange={(next) =>
                  props.onDraftChange(next === sourceQuery.data ? null : next)
                }
                onSave={save}
                saving={saveMutation.isPending}
                title={t('dynamicComponents.source.title')}
                value={source}
              />
            )}
          </div>
          {live.error ? (
            <div className={styles.liveError} role="alert">
              {live.error} · {t('dynamicComponents.source.keptLastWorking')}
            </div>
          ) : null}
          <div className={styles.sourceFooter}>
            <Button
              disabled={!dirty || saveMutation.isPending}
              icon={RotateCcw}
              onClick={() => props.onDraftChange(null)}
              type="text"
            >
              {t('dynamicComponents.source.revert')}
            </Button>
            <Button
              disabled={!dirty || saveMutation.isPending}
              onClick={save}
              type="primary"
            >
              {t(
                saveMutation.isPending
                  ? 'dynamicComponents.editor.saving'
                  : 'dynamicComponents.source.saveVersion',
              )}
            </Button>
          </div>
        </div>

        <div className={styles.sourcePreview}>
          <div className={styles.previewFrame}>
            {live.url ? (
              <DynamicComponentPreview
                componentProps={props.previewProps}
                initialHeight={item.initialHeight}
                url={live.url}
                validateUrl={allowAnyUrl}
              />
            ) : (
              <Center paddingBlock={24}>
                <Text type="secondary">{t('common.loading')}</Text>
              </Center>
            )}
          </div>
          <PropsEditor
            onChange={props.onPreviewPropsChange}
            schema={item.propsSchema}
            value={props.previewProps}
          />
          <p className={styles.hint}>
            {t('dynamicComponents.detail.samplePropsHint')}
          </p>
        </div>
      </div>
    </div>
  )
}
