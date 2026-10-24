import type { DynamicNode } from '@haklex/rich-ext-dynamic'
import { $isDynamicNode, DynamicHostRenderer } from '@haklex/rich-ext-dynamic'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ActionIcon, Popover, Tag } from '@lobehub/ui'
import * as stylex from '@stylexjs/stylex'
import { $getNodeByKey, HISTORY_MERGE_TAG } from 'lexical'
import { ArrowLeft, Boxes, Settings2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { useI18n } from '~/i18n'
import { sx } from '~/styles/sx'
import { PropsEditor } from '~/ui/patterns/PropsEditor'
import { Button } from '~/ui/site-button'

import {
  currentCatalogEntries,
  resolveCatalogEntry,
  useDynamicCatalog,
} from '../utils/dynamic-catalog'
import { $applyCatalogEntry } from './BylineDynamicEditNode'
import { CatalogPicker } from './CatalogPicker'
import { ManualDynamicForm } from './ManualDynamicForm'
import { styles } from './styles'

type PanelView = 'manual' | 'picker' | 'props'

export function DynamicNodeEditor(props: {
  componentProps: Record<string, unknown>
  initialHeight: number
  nodeKey: string
  url: string
}) {
  const { t } = useI18n()
  const [editor] = useLexicalComposerContext()
  const catalog = useDynamicCatalog()
  const resolved =
    props.url && catalog
      ? resolveCatalogEntry(catalog.components, props.url)
      : null
  const [open, setOpen] = useState(!props.url)
  const [view, setView] = useState<PanelView>('picker')
  const mergeHistoryRef = useRef(false)

  const updateNode = (change: (node: DynamicNode) => void) => {
    editor.update(
      () => {
        const node = $getNodeByKey(props.nodeKey)
        if ($isDynamicNode(node)) change(node)
      },
      mergeHistoryRef.current ? { tag: HISTORY_MERGE_TAG } : undefined,
    )
    mergeHistoryRef.current = true
  }

  const removeNode = () => {
    editor.update(() => {
      $getNodeByKey(props.nodeKey)?.remove()
    })
  }

  const openPanel = (next: boolean) => {
    if (next) setView(props.url ? (resolved ? 'props' : 'manual') : 'picker')
    else mergeHistoryRef.current = false
    setOpen(next)
  }

  const entry = resolved?.entry

  return (
    <div {...stylex.props(stylex.defaultMarker(), styles.root)}>
      {props.url ? (
        <DynamicHostRenderer
          componentProps={props.componentProps}
          initialHeight={props.initialHeight}
          url={props.url}
        />
      ) : (
        <div
          {...sx(styles.placeholder, undefined, {
            minHeight: Math.min(props.initialHeight, 160),
          })}
        >
          <Boxes aria-hidden="true" size={16} />
          {t('dynamicNode.placeholder')}
        </div>
      )}
      <Popover
        classNames={{ content: stylex.props(styles.popover).className }}
        content={
          <div
            {...stylex.props(styles.panel)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !props.url) {
                event.preventDefault()
                removeNode()
              }
            }}
          >
            {view === 'picker' ? (
              <CatalogPicker
                entries={
                  catalog ? currentCatalogEntries(catalog.components) : null
                }
                onManual={() => setView('manual')}
                onPick={(picked) => {
                  updateNode((node) => $applyCatalogEntry(node, picked))
                  setView('props')
                }}
              />
            ) : view === 'manual' || !entry ? (
              <ManualDynamicForm
                initialHeight={props.initialHeight}
                onApply={(value) => {
                  updateNode((node) => {
                    node.setUrl(value.url)
                    node.setInitialHeight(value.initialHeight)
                    node.setProps(value.props)
                  })
                  openPanel(false)
                }}
                onBack={() => setView('picker')}
                onRemove={removeNode}
                props={props.componentProps}
                url={props.url}
              />
            ) : (
              <>
                <div {...stylex.props(styles.header)}>
                  <ActionIcon
                    aria-label={t('dynamicNode.backToPicker')}
                    icon={ArrowLeft}
                    onClick={() => setView('picker')}
                    size="small"
                    title={t('dynamicNode.backToPicker')}
                  />
                  <span {...stylex.props(styles.title)}>{entry.name}</span>
                  {resolved.outdated ? (
                    <Tag size="small" title={t('dynamicNode.outdatedHint')}>
                      {t('dynamicNode.outdated')}
                    </Tag>
                  ) : null}
                </div>
                <div {...stylex.props(styles.body)}>
                  <PropsEditor
                    key={entry.url}
                    onChange={(next) =>
                      updateNode((node) => node.setProps(next))
                    }
                    schema={entry.propsSchema}
                    value={props.componentProps}
                  />
                </div>
                <div {...stylex.props(styles.footer)}>
                  <span {...stylex.props(styles.hint)}>
                    {t('dynamicNode.liveHint')}
                  </span>
                  <div {...stylex.props(styles.footerActions)}>
                    <Button danger onClick={removeNode}>
                      {t('dynamicNode.remove')}
                    </Button>
                    <Button onClick={() => openPanel(false)} type="primary">
                      {t('dynamicNode.done')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        }
        onOpenChange={openPanel}
        open={open}
        placement="bottomRight"
        trigger="click"
      >
        <ActionIcon
          aria-label={t('dynamicNode.settings')}
          className={
            stylex.props(
              styles.trigger,
              !!props.url && !open && styles.triggerIdle,
            ).className
          }
          icon={Settings2}
          size="small"
          variant="outlined"
        />
      </Popover>
    </div>
  )
}
