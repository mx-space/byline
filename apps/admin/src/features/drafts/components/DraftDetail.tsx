import { Alert, createStaticStyles, Segmented, Tag, Tooltip } from '@lobehub/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import type { DraftModel } from '~/models/draft'
import { DetailPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useDraftCopy } from '../copy'
import {
  draftAuthorIds,
  draftChangeKind,
  draftHasConflict,
  draftSavedAt,
  draftSlug,
  draftTitle,
  relativeDraftTime,
} from '../utils/draft-decision'
import { computeDiffStats } from '../utils/draft-diff'
import { getEditPathForDraft } from '../utils/draft-edit-path'
import { DraftChanges, DraftOverview } from './DraftChanges'
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
  section: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  sectionHead: css`
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    min-height: 28px;
  `,
  sectionTitle: css`
    margin: 0;
    font-size: ${cssVar.fontSize};
    font-weight: 600;
    color: ${cssVar.colorText};
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

function Section(props: {
  children: ReactNode
  extra?: ReactNode
  title: ReactNode
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{props.title}</h3>
        {props.extra}
      </div>
      {props.children}
    </section>
  )
}

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
  const kind = draftChangeKind(draft)
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

  const notice = draftHasConflict(draft) ? (
    <Alert
      description={copy('conflictDetail')}
      showIcon
      title={copy('conflict')}
      type="warning"
    />
  ) : kind === 'behind' ? (
    <Alert description={copy('behindDetail')} showIcon type="info" />
  ) : null

  return (
    <DetailPane
      actions={
        <>
          <Button
            danger
            icon={Trash2}
            loading={props.deleting}
            onClick={() => props.onDelete(draft)}
            type="text"
          >
            {copy('deleteDraft')}
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
      status={
        <>
          <DraftKindTag draft={draft} />
          {draftHasConflict(draft) ? (
            <Tag color="error">{copy('conflict')}</Tag>
          ) : null}
        </>
      }
      title={draftTitle(draft, copy('untitled'))}
    >
      <div className={styles.body}>
        {notice}
        {published ? (
          <Section title={copy('changesTitle')}>
            <DraftChanges head={head} published={published} />
          </Section>
        ) : (
          <Section title={copy('overviewTitle')}>
            <DraftOverview draft={draft} />
          </Section>
        )}
        <Section
          extra={
            published && bodyDiffers ? (
              <Segmented
                onChange={(value) => setBodyView(value as BodyView)}
                options={[
                  { label: copy('tabDiff'), value: 'diff' },
                  { label: copy('tabPreview'), value: 'preview' },
                ]}
                size="small"
                value={bodyView}
              />
            ) : undefined
          }
          title={copy('bodyTitle')}
        >
          {published && bodyDiffers && bodyView === 'diff' ? (
            <DraftDiffPreview
              comparisonLabel={copy('diffDirectionPublished')}
              currentDraft={head}

              diffStats={null}
              hideTitle
              selectedDraft={published}
            />
          ) : (
            <DraftPreview revision={head} />
          )}
        </Section>
        <Section title={copy('historyTitle')}>
          <DraftHistory draft={draft} />
        </Section>
      </div>
    </DetailPane>
  )
}
