import { createStaticStyles, Empty, ScrollArea, Text } from '@lobehub/ui'
import { FileWarning } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import { useDraftCopy } from '../copy'
import {
  getCurrentColorScheme,
  parseSerializedDraftContent,
} from '../utils/rich-diff'

const styles = createStaticStyles(({ css, cssVar }) => ({
  bareFrame: css`
    min-height: 240px;
    border: 0;
    border-radius: 0;
    background: transparent;
  `,
  frame: css`
    min-height: 240px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadius};
    background: ${cssVar.colorBgContainer};
  `,
  head: css`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-block-end: 8px;
  `,
  label: css`
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
  `,
  root: css`
    min-width: 0;
  `,
  title: css`
    margin: 0;
    font-size: ${cssVar.fontSize};
    font-weight: 600;
  `,
  viewport: css`
    min-height: 240px;
  `,
}))

export function RichDraftDiffPanel(props: {
  bare?: boolean
  comparisonLabel?: string
  hideTitle?: boolean
  currentContent: string
  selectedContent: string
}) {
  const { copy } = useDraftCopy()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selectedValue = useMemo(
    () => parseSerializedDraftContent(props.selectedContent),
    [props.selectedContent],
  )
  const currentValue = useMemo(
    () => parseSerializedDraftContent(props.currentContent),
    [props.currentContent],
  )

  useEffect(() => {
    if (!containerRef.current || !selectedValue || !currentValue) return

    let disposed = false
    let handle: { unmount: () => void } | null = null

    void import('~/vendor/rich-editor/mount/mount-rich-diff').then(
      ({ mountRichDiff }) => {
        if (disposed || !containerRef.current) return
        handle = mountRichDiff(containerRef.current, {
          className: '!rounded-none !border-0',
          newValue: currentValue,
          oldValue: selectedValue,
          theme: getCurrentColorScheme(),
          variant: 'comment',
        })
      },
    )

    return () => {
      disposed = true
      handle?.unmount()
    }
  }, [currentValue, selectedValue])

  if (!selectedValue || !currentValue) {
    return (
      <Empty
        description={copy('diffRichFailed')}
        icon={FileWarning}
        title={copy('diffRichTitle')}
      />
    )
  }

  return (
    <section className={styles.root}>
      <div className={styles.head}>
        {props.hideTitle ? null : (
          <Text as="h3" className={styles.title}>
            {copy('diffRichTitle')}
          </Text>
        )}
        <Text as="span" className={styles.label}>
          {props.comparisonLabel ?? copy('diffHistoryDirection')}
        </Text>
      </div>
      <ScrollArea
        className={props.bare ? styles.bareFrame : styles.frame}
        corner
        scrollFade="both"
        viewportProps={{ className: styles.viewport }}
      >
        <div className={styles.viewport} ref={containerRef} />
      </ScrollArea>
    </section>
  )
}
