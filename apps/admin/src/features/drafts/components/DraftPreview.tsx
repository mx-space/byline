import { createStaticStyles } from '@lobehub/ui'
import { lazy, Suspense, useMemo } from 'react'

import type { RevisionSnapshot } from '~/models/draft'

import { useDraftCopy } from '../copy'
import { parseSerializedDraftContent } from '../utils/rich-diff'

const RichRenderer = lazy(async () => {
  await import('~/vendor/rich-editor/core/style')
  return import('~/vendor/rich-editor/core/RichRenderer').then(
    ({ RichRenderer }) => ({ default: RichRenderer }),
  )
})

const styles = createStaticStyles(({ css, cssVar }) => ({
  empty: css`
    margin: 0;
    padding-block: 24px;
    color: ${cssVar.colorTextTertiary};
    text-align: center;
  `,
  frame: css`
    min-width: 0;
  `,
}))

export function DraftPreview(props: { revision: RevisionSnapshot }) {
  const { copy } = useDraftCopy()
  const content = useMemo(
    () => parseSerializedDraftContent(props.revision.content ?? ''),
    [props.revision.content],
  )

  return (
    <div className={styles.frame}>
      {content ? (
        <Suspense
          fallback={<p className={styles.empty}>{copy('diffLoading')}</p>}
        >
          <RichRenderer value={content} variant="article" />
        </Suspense>
      ) : (
        <p className={styles.empty}>{copy('noBody')}</p>
      )}
    </div>
  )
}
