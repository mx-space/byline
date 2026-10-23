import { createStaticStyles, Markdown } from '@lobehub/ui'

import type { RevisionSnapshot } from '~/models/draft'

import { useDraftCopy } from '../copy'

const styles = createStaticStyles(({ css, cssVar }) => ({
  empty: css`
    margin: 0;
    padding-block: 24px;
    color: ${cssVar.colorTextTertiary};
    text-align: center;
  `,
  frame: css`
    padding-block: 16px;
    padding-inline: 20px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadiusLG};
  `,
}))

export function DraftPreview(props: { revision: RevisionSnapshot }) {
  const { copy } = useDraftCopy()
  const text = props.revision.text?.trim() ?? ''

  return (
    <div className={styles.frame}>
      {text ? (
        <Markdown enableImageGallery={false} variant="default">
          {text}
        </Markdown>
      ) : (
        <p className={styles.empty}>{copy('noBody')}</p>
      )}
    </div>
  )
}
