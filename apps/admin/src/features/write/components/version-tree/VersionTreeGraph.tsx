import { createStaticStyles } from '@lobehub/ui'

import { useI18n } from '~/i18n'
import type { DraftModel, VersionTreeNode } from '~/models/draft'
import { Button } from '~/ui/primitives/button'

import { DraftNode } from './DraftNode'
import type { GraphRow } from './layout'
import { laneCount, MAX_LANE } from './layout'
import { DraftLine, RevisionLine } from './RevisionLine'
import type { RailTone } from './VersionRail'
import { railWidth, VersionRail } from './VersionRail'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ub301630e: css`
    display: flex;
    flex-direction: column;
  `,
  u90dd1311: css`
    display: grid;
    align-items: stretch;
    column-gap: 0.5rem;
  `,
  ue32056b8: css`
    min-width: 0px;
    padding-bottom: 0.25rem;
  `,
  u28c4a725: css`
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, ${cssVar.colorSuccess} 30%, transparent);
    background-color: color-mix(
      in srgb,
      ${cssVar.colorSuccess} NaN%,
      transparent
    );
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
  `,
  u6cfc7e6a: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  u5e33fcc4: css`
    border-radius: 999px;
    background-color: color-mix(
      in srgb,
      ${cssVar.colorSuccess} 10%,
      transparent
    );
    padding-inline: 0.5rem;
    padding-block: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
    }
  `,
  u36b7e556: css`
    margin-left: auto;
    height: 1.75rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u789b22f9: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  ud756d144: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
}))

const CARD_DOT_Y = 21
const LINE_DOT_Y = 18

const toneOf = (row: GraphRow, currentDraftId: string): RailTone => {
  if (row.kind !== 'draft') return row.kind
  if (row.draft?.id === currentDraftId) return 'current'
  return row.draft?.relationToPublished === 'diverged' ? 'conflict' : 'draft'
}

export function VersionTreeGraph(props: {
  currentDraftId: string
  deletingDraftId: string | null
  onCompare: (draft: DraftModel) => void
  onContinue: (draft: DraftModel) => void
  onDelete: (draft: DraftModel) => void
  onHistory: (draft: DraftModel) => void
  onPublish: (draft: DraftModel) => void
  onShareDraft: (draft: DraftModel) => void
  onShareRevision: (node: VersionTreeNode) => void
  onViewOnline: () => void
  rows: GraphRow[]
  sharedDraftId: string | null
  sharedRevisionId: string | null
}) {
  const { t } = useI18n()
  const gutter = railWidth(Math.min(laneCount(props.rows), MAX_LANE + 1))

  return (
    <ol
      aria-label={t('write.versionTree.graphLabel')}
      className={lobeStyles.ub301630e}
    >
      {props.rows.map((row) => {
        const { draft } = row
        const current = draft?.id === props.currentDraftId
        const shared = draft
          ? draft.id === props.sharedDraftId
          : row.node.revision.id === props.sharedRevisionId
        return (
          <li
            className={lobeStyles.u90dd1311}
            key={row.node.revision.id}
            style={{ gridTemplateColumns: `${gutter}px minmax(0, 1fr)` }}
          >
            <VersionRail
              dotY={draft && current ? CARD_DOT_Y : LINE_DOT_Y}
              row={row}
              tone={toneOf(row, props.currentDraftId)}
            />
            <div className={lobeStyles.ue32056b8}>
              {draft ? (
                current ? (
                  <DraftNode
                    deleting={draft.id === props.deletingDraftId}
                    draft={draft}
                    handlers={{
                      onCompare: () => props.onCompare(draft),
                      onContinue: () => props.onContinue(draft),
                      onDelete: () => props.onDelete(draft),
                      onHistory: () => props.onHistory(draft),
                      onPublish: () => props.onPublish(draft),
                      onShare: () => props.onShareDraft(draft),
                    }}
                    node={row.node}
                    shared={shared}
                  />
                ) : (
                  <DraftLine
                    deleting={draft.id === props.deletingDraftId}
                    draft={draft}
                    handlers={{
                      onCompare: () => props.onCompare(draft),
                      onContinue: () => props.onContinue(draft),
                      onDelete: () => props.onDelete(draft),
                      onHistory: () => props.onHistory(draft),
                      onPublish: () => props.onPublish(draft),
                      onShare: () => props.onShareDraft(draft),
                    }}
                    shared={shared}
                  />
                )
              ) : row.kind === 'online' ? (
                <OnlineCard node={row.node} onViewOnline={props.onViewOnline} />
              ) : (
                <RevisionLine
                  node={row.node}
                  onShare={() => props.onShareRevision(row.node)}
                  shared={shared}
                />
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function OnlineCard(props: {
  node: VersionTreeNode
  onViewOnline: () => void
}) {
  const { format, t } = useI18n()

  return (
    <div className={lobeStyles.u28c4a725}>
      <div className={lobeStyles.u6cfc7e6a}>
        <span className={lobeStyles.u5e33fcc4}>
          {t('write.versionTree.currentOnline')}
        </span>
        <Button
          className={lobeStyles.u36b7e556}
          onClick={props.onViewOnline}
          type="button"
          variant="ghost"
        >
          {t('write.branch.viewOnline')}
        </Button>
      </div>
      <p className={lobeStyles.u789b22f9}>
        {props.node.revision.title || t('write.editor.untitled')}
      </p>
      <p className={lobeStyles.ud756d144}>
        {t('write.versionTree.publishedAt', {
          time: format.relativeTime(
            props.node.publishedAt ?? props.node.revision.createdAt,
          ),
        })}
      </p>
    </div>
  )
}
