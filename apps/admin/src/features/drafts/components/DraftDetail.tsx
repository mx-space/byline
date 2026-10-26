import { Alert, createStaticStyles, Segmented, Tooltip } from '@lobehub/ui'
import { Surface } from '@lobehub/ui/dashboard'
import { Pencil, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import type { DraftModel } from '~/models/draft'
import { DetailPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useDraftCopy } from '../copy'
import {
  draftAuthorIds,
  draftRevertsChanges,
  draftSavedAt,
  draftSlug,
  draftTitle,
  relativeDraftTime,
} from '../utils/draft-decision'
import { computeDiffStats } from '../utils/draft-diff'
import { getEditPathForDraft } from '../utils/draft-edit-path'
import { DraftChanges, DraftOverview } from './DraftChanges'
import { DraftChecks } from './DraftChecks'
import { DraftDiffPreview } from './DraftDiffPreview'
import { DraftHistory } from './DraftHistory'
import { DraftKindTag } from './DraftKindTag'
import { DraftPreview } from './DraftPreview'
import { useDraftAuthors } from './use-draft-authors'

const styles = createStaticStyles(({ css, cssVar }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 32px;
  `,
  bodyBlock: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  bodySwitch: css`
    display: flex;
    justify-content: flex-end;
  `,
  slug: css`
    font-family: ${cssVar.fontFamilyCode};
    color: ${cssVar.colorTextTertiary};
  `,
  time: css`
    font-variant-numeric: tabular-nums;
  `,
}))

type BodyView = 'diff' | 'preview'

export function DraftDetail(props: {
  deleting: boolean
  draft: DraftModel
  onBack: () => void
  onDelete: (draft: DraftModel) => void
}) {
  const { copy, format } = useDraftCopy()
  const authorNames = useDraftAuthors()
  const navigate = useNavigate()
  const { draft } = props
  const head = draft.headRevision
  const published = draft.publishedRevision
  const savedAt = draftSavedAt(draft)
  const slug = draftSlug(draft)
  const authorIds = draftAuthorIds(draft)
  const bodyDiffers = published
    ? !computeDiffStats(published, head).isSame
    : false
  const [bodyView, setBodyView] = useState<BodyView>(
    bodyDiffers ? 'diff' : 'preview',
  )

  useEffect(() => {
    setBodyView(bodyDiffers ? 'diff' : 'preview')
  }, [bodyDiffers, draft.id])

  const reverts = draftRevertsChanges(draft)
  const notice = reverts ? (
    <Alert description={copy('aheadDetail')} showIcon type="info" />
  ) : null

  return (
    <DetailPane
      actions={
        <>
          <Button
            danger={!reverts}
            icon={reverts ? Undo2 : Trash2}
            loading={props.deleting}
            onClick={() => props.onDelete(draft)}
            type="text"
          >
            {copy(reverts ? 'revertChanges' : 'deleteDraft')}
          </Button>
          <Button
            icon={Pencil}
            onClick={() => navigate(getEditPathForDraft(draft))}
            type="primary"
          >
            {copy('continueWriting')}
          </Button>
        </>
      }
      backLabel={copy('title')}
      meta={
        <>
          <Tooltip title={format.dateTime(savedAt)}>
            <time className={styles.time} dateTime={savedAt}>
              {copy('savedAt', {
                time: relativeDraftTime(
                  savedAt,
                  format.relativeTime,
                  copy('emptyValue'),
                ),
              })}
            </time>
          </Tooltip>
          {authorIds.length > 0 ? <span>{authorNames(authorIds)}</span> : null}
          {slug ? <span className={styles.slug}>/{slug}</span> : null}
        </>
      }
      contentWidth="article"
      onBack={props.onBack}
      status={<DraftKindTag draft={draft} />}
      title={draftTitle(draft, copy('untitled'))}
    >
      <div className={styles.body}>
        {notice}
        <Surface bleed title={copy('checkSectionTitle')}>
          <DraftChecks draft={draft} />
        </Surface>
        {published ? (
          <Surface bleed title={copy('changesTitle')}>
            <DraftChanges head={head} published={published} />
          </Surface>
        ) : (
          <Surface bleed title={copy('overviewTitle')}>
            <DraftOverview draft={draft} />
          </Surface>
        )}
        <div className={styles.bodyBlock}>
          {published && bodyDiffers ? (
            <div className={styles.bodySwitch}>
              <Segmented
                onChange={(value) => setBodyView(value as BodyView)}
                options={[
                  { label: copy('tabDiff'), value: 'diff' },
                  { label: copy('tabPreview'), value: 'preview' },
                ]}
                size="small"
                value={bodyView}
              />
            </div>
          ) : null}
          {published && bodyDiffers && bodyView === 'diff' ? (
            <DraftDiffPreview
              bare
              comparisonLabel={copy('diffDirectionPublished')}
              currentDraft={head}

              diffStats={null}
              hideTitle
              selectedDraft={published}
            />
          ) : (
            <DraftPreview revision={head} />
          )}
        </div>
        <Surface bleed title={copy('historyTitle')}>
          <DraftHistory draft={draft} />
        </Surface>
      </div>
    </DetailPane>
  )
}
