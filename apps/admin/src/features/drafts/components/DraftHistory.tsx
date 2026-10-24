import { createStaticStyles, cx, SkeletonText, Tag, Tooltip } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { getDraftRevisions } from '~/api/drafts'
import type { ContentRevision, DraftModel } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import { FocusScope, useScopeArrowNav } from '~/ui/focus-scope'
import { ListRow } from '~/ui/list-actions'
import { Button } from '~/ui/site-button'

import { useDraftCopy } from '../copy'
import {
  relativeDraftTime,
  signedDelta,
  snapshotWordCount,
} from '../utils/draft-decision'
import { computeDiffStats } from '../utils/draft-diff'
import { getEditPathForRevision } from '../utils/draft-edit-path'
import { DraftDiffPreview } from './DraftDiffPreview'

const COLLAPSED_COUNT = 6

const styles = createStaticStyles(({ css, cssVar }) => ({
  delta: css`
    flex: none;
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  list: css`
    overflow: hidden;
  `,
  inset: css`
    padding-block: 12px;
    padding-inline: 16px;
  `,
  muted: css`
    margin: 0;
    color: ${cssVar.colorTextTertiary};
  `,
  row: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    min-height: 44px;
    padding-block: 6px;
    padding-inline: 16px 8px;

    &:not(:first-child) {
      border-block-start: 1px solid ${cssVar.colorFillSecondary};
    }

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }

    &[aria-current='true'] {
      background: ${cssVar.colorFillSecondary};
    }
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  time: css`
    flex: none;
    width: 7rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
  title: css`
    overflow: hidden;
    flex: 1;

    min-width: 0;

    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))

function newestFirst(revisions: ContentRevision[] | undefined) {
  return [...(revisions ?? [])].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  )
}

export function DraftHistory(props: { draft: DraftModel }) {
  const { copy, format } = useDraftCopy()
  const navigate = useNavigate()
  const head = props.draft.headRevision
  const scopeId = `draft-history-${props.draft.id}`
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const revisionsQuery = useQuery({
    queryFn: () => getDraftRevisions(props.draft.id),
    queryKey: adminQueryKeys.drafts.history(props.draft.id),
  })
  const revisions = useMemo(
    () => newestFirst(revisionsQuery.data),
    [revisionsQuery.data],
  )
  const headWords = snapshotWordCount(head)

  useEffect(() => {
    setSelectedId(null)
    setExpanded(false)
  }, [props.draft.id])

  useScopeArrowNav({
    itemSelector: '[data-scope-item="row"]',
    onItemFocus: (element) => {
      const id = element.getAttribute('data-id')
      if (id) setSelectedId(id)
    },
    scopeId,
  })

  if (revisionsQuery.isPending) {
    return <SkeletonText rows={3} />
  }
  if (revisionsQuery.isError) {
    return (
      <div className={cx(styles.stack, styles.inset)}>
        <p className={styles.muted}>{copy('historyError')}</p>
        <div>
          <Button onClick={() => void revisionsQuery.refetch()} size="small">
            {copy('retry')}
          </Button>
        </div>
      </div>
    )
  }
  if (revisions.length <= 1) {
    return (
      <p className={cx(styles.muted, styles.inset)}>{copy('historyEmpty')}</p>
    )
  }

  const visible = expanded ? revisions : revisions.slice(0, COLLAPSED_COUNT)
  const selected =
    revisions.find((revision) => revision.id === selectedId) ?? null
  const selectedStats = selected ? computeDiffStats(selected, head) : null

  return (
    <div className={styles.stack}>
      <FocusScope className={styles.list} id={scopeId}>
        {visible.map((revision) => {
          const isCurrent = revision.id === props.draft.headRevisionId
          const isSelected = revision.id === selectedId
          const words = snapshotWordCount(revision)
          return (
            <ListRow
              ariaCurrent={isSelected}
              className={styles.row}
              dataId={revision.id}
              key={revision.id}
              onSelect={() =>
                setSelectedId(isSelected || isCurrent ? null : revision.id)
              }
              role="listitem"
            >
              <Tooltip title={format.dateTime(revision.createdAt)}>
                <time className={styles.time} dateTime={revision.createdAt}>
                  {relativeDraftTime(
                    revision.createdAt,
                    format.relativeTime,
                    copy('emptyValue'),
                  )}
                </time>
              </Tooltip>
              <span className={styles.title}>
                {revision.title.trim() || copy('untitled')}
              </span>
              {isCurrent ? (
                <Tag size="small">{copy('currentVersion')}</Tag>
              ) : (
                <span className={styles.delta}>
                  {words === headWords
                    ? copy('versionSame')
                    : copy('wordDelta', {
                        delta: signedDelta(words - headWords),
                      })}
                </span>
              )}
              {isSelected ? (
                <Button
                  onClick={(event) => {
                    event.stopPropagation()
                    navigate(getEditPathForRevision(props.draft, revision.id))
                  }}
                  size="small"
                >
                  {copy('restore')}
                </Button>
              ) : null}
            </ListRow>
          )
        })}
      </FocusScope>
      {!expanded && revisions.length > COLLAPSED_COUNT ? (
        <div className={styles.inset}>
          <Button onClick={() => setExpanded(true)} size="small" type="text">
            {copy('historyShowAll', { count: revisions.length })}
          </Button>
        </div>
      ) : null}
      {selected && selectedStats && !selectedStats.isSame ? (
        <div className={styles.inset}>
          <DraftDiffPreview
            comparisonLabel={copy('diffHistoryDirection')}
            currentDraft={head}
            diffStats={selectedStats}
            selectedDraft={selected}
          />
        </div>
      ) : null}
    </div>
  )
}
