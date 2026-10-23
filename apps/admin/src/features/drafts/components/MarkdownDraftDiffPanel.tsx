import { createStaticStyles, Empty, ScrollArea, Spin, Text } from '@lobehub/ui'
import { FileWarning } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useDraftCopy } from '../copy'
import type { DiffRendererInstance } from '../types/drafts'
import { ensureDiffHighlighter } from '../utils/diff-highlighter'

const styles = createStaticStyles(({ css, cssVar }) => ({
  frame: css`
    position: relative;
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
  overlay: css`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: ${cssVar.colorBgContainer};
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

export function MarkdownDraftDiffPanel(props: {
  comparisonLabel?: string
  hideTitle?: boolean
  currentLabel?: string
  currentText: string
  selectedLabel?: string
  selectedText: string
}) {
  const { copy } = useDraftCopy()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const comparisonLabel = props.comparisonLabel ?? copy('diffHistoryDirection')
  const currentLabel = props.currentLabel ?? copy('diffDraftFile')
  const selectedLabel = props.selectedLabel ?? copy('diffHistoryFile')

  useEffect(() => {
    if (!containerRef.current) return

    let disposed = false
    let diffInstance: DiffRendererInstance | null = null

    setIsLoading(true)
    setHasError(false)
    containerRef.current.innerHTML = ''

    void import('@pierre/diffs')
      .then(async ({ FileDiff, preloadHighlighter }) => {
        await ensureDiffHighlighter(preloadHighlighter)

        if (disposed || !containerRef.current) return

        setIsLoading(false)
        const nextDiffInstance = new FileDiff({
          diffIndicators: 'bars',
          diffStyle: 'unified',
          disableFileHeader: true,
          themeType: 'system',
        }) as unknown as DiffRendererInstance
        nextDiffInstance.render({
          containerWrapper: containerRef.current,
          newFile: {
            contents: props.currentText,
            name: `${currentLabel}.md`,
          },
          oldFile: {
            contents: props.selectedText,
            name: `${selectedLabel}.md`,
          },
        })
        diffInstance = nextDiffInstance
      })
      .catch((error: unknown) => {
        console.error('[DraftsPage] Failed to render markdown diff:', error)
        if (!disposed) {
          setHasError(true)
          setIsLoading(false)
        }
      })

    return () => {
      disposed = true
      diffInstance?.cleanUp()
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [props.currentText, props.selectedText, currentLabel, selectedLabel])

  const empty =
    !isLoading && !hasError && !props.selectedText && !props.currentText

  return (
    <section className={styles.root}>
      <div className={styles.head}>
        {props.hideTitle ? null : (
          <Text as="h3" className={styles.title}>
            {copy('diffMarkdownTitle')}
          </Text>
        )}
        <Text as="span" className={styles.label}>
          {comparisonLabel}
        </Text>
      </div>
      <ScrollArea
        className={styles.frame}
        corner
        scrollFade="both"
        viewportProps={{ className: styles.viewport }}
      >
        <div className={styles.viewport} ref={containerRef} />
        {isLoading ? (
          <div className={styles.overlay}>
            <Spin size="small" />
            <Text as="span" type="secondary">
              {copy('diffLoading')}
            </Text>
          </div>
        ) : null}
        {hasError ? (
          <div className={styles.overlay}>
            <Empty
              description={copy('diffFailed')}
              icon={FileWarning}
              title={copy('diffMarkdownTitle')}
            />
          </div>
        ) : null}
        {empty ? (
          <div className={styles.overlay}>
            <Text as="p" type="secondary">
              {copy('diffEmpty')}
            </Text>
          </div>
        ) : null}
      </ScrollArea>
    </section>
  )
}
