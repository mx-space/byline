import { createStaticStyles } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getDraftRevisions } from '~/api/drafts'
import { useI18n } from '~/i18n'
import type { DraftModel, VersionTreeNode } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import { ListSkeleton } from '~/ui/placeholders'
import { cn } from '~/utils/cn'

import { ChangeSummary, TitleChangeLine } from './ChangeSummary'
import type { DraftActionHandlers } from './DraftActions'
import { DraftActions } from './DraftActions'
import { ShareMark } from './RevisionLine'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u80cb9444: css`
    border-radius: ${cssVar.borderRadius};
    background: ${cssVar.colorFillTertiary};
  `,
  u81f6cdce: css`
    pointer-events: none;
    opacity: 0.5;
  `,
  u4029e24d: css`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 0.25rem;
    padding-inline: 0.75rem;
    padding-bottom: 0.5rem;
    padding-top: 0.625rem;
    text-align: left;
    &:focus-visible {
      outline: none;
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
  `,
  u11d1931f: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.375rem;
  `,
  u1b6f84de: css`
    flex-shrink: 0;
    color: ${cssVar.colorText};
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
  `,
  uedb88331: css`
    margin-inline-start: auto;
    flex-shrink: 0;
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  u8a2c4128: css`
    display: flex;
    align-items: center;
    gap: 0.125rem;
    border-top-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, ${cssVar.colorPrimary} 20%, transparent);
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
  `,
  u4090925a: css`
    border-top-width: 1px;
    border-style: solid;
    border-style: dashed;
    border-color: color-mix(in srgb, ${cssVar.colorPrimary} 20%, transparent);
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
  `,
  u607c8aed: css`
    display: flex;
    height: 1.75rem;
    align-items: center;
    gap: 0.375rem;
    border-radius: 8px;
    padding-inline: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
    &:focus-visible {
      outline: none;
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
  `,
  ubbdb260c: css`
    width: 0.75rem;
    height: 0.75rem;
    transition: transform 0.15s ease;
  `,
  uc8c630a3: css`
    margin-left: 0.75rem;
    border-left-width: 1px;
    border-style: solid;
    border-style: dashed;
    border-color: ${cssVar.colorBorderSecondary};
    padding-block: 0.25rem;
    padding-left: 0.75rem;
  `,
  u6d654e40: css`
    padding-block: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u2ba0f90d: css`
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u3032cae0: css`
    font-variant-numeric: tabular-nums;
  `,
}))

export function DraftNode(props: {
  deleting: boolean
  draft: DraftModel
  handlers: DraftActionHandlers
  node: VersionTreeNode
  shared: boolean
}) {
  const { format, t } = useI18n()

  return (
    <article
      className={cn(
        lobeStyles.u80cb9444,
        props.deleting && lobeStyles.u81f6cdce,
      )}
    >
      <button
        aria-current="true"
        className={lobeStyles.u4029e24d}
        onClick={props.handlers.onCompare}
        type="button"
      >
        <span className={lobeStyles.u11d1931f}>
          {props.shared ? <ShareMark /> : null}
          <span className={lobeStyles.u1b6f84de}>
            {t('write.versionTree.currentEditing')}
          </span>
          <span className={lobeStyles.uedb88331}>
            {format.relativeTime(
              props.draft.updatedAt ?? props.draft.createdAt,
            )}
          </span>
        </span>
        <ChangeSummary
          base={props.draft.baseRevision}
          head={props.draft.headRevision}
        />
        <TitleChangeLine
          base={props.draft.baseRevision}
          head={props.draft.headRevision}
        />
      </button>

      <div className={lobeStyles.u8a2c4128}>
        <DraftActions
          deleting={props.deleting}
          draft={props.draft}
          handlers={props.handlers}
          labelled
        />
      </div>

      {props.node.collapsedRevisionCount > 0 ? (
        <DraftAutosaves
          count={props.node.collapsedRevisionCount}
          draftId={props.draft.id}
          parentNodeId={props.node.parentNodeId}
        />
      ) : null}
    </article>
  )
}

function DraftAutosaves(props: {
  count: number
  draftId: string
  parentNodeId: string | null
}) {
  const { format, t } = useI18n()
  const [open, setOpen] = useState(false)
  const revisionsQuery = useQuery({
    enabled: open,
    queryFn: () => getDraftRevisions(props.draftId),
    queryKey: adminQueryKeys.drafts.history(props.draftId),
  })
  const hiddenRevisions = useMemo(() => {
    const revisions = revisionsQuery.data ?? []
    const parentIndex = props.parentNodeId
      ? revisions.findIndex((revision) => revision.id === props.parentNodeId)
      : revisions.length
    return revisions
      .slice(1, parentIndex < 0 ? 1 + props.count : parentIndex)
      .reverse()
  }, [props.count, props.parentNodeId, revisionsQuery.data])

  return (
    <div className={lobeStyles.u4090925a}>
      <button
        aria-expanded={open}
        className={lobeStyles.u607c8aed}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(lobeStyles.ubbdb260c, open && 'rotate-90')}
        />
        {t('write.versionTree.collapsed', { count: props.count })}
      </button>
      {open ? (
        <div className={lobeStyles.uc8c630a3}>
          {revisionsQuery.isLoading ? (
            <ListSkeleton label={t('common.loading')} rows={2} />
          ) : (
            hiddenRevisions.map((revision) => (
              <div className={lobeStyles.u6d654e40} key={revision.id}>
                <span className={lobeStyles.u2ba0f90d}>
                  {revision.title || t('write.editor.untitled')}
                </span>
                <span className={lobeStyles.u3032cae0}>
                  {format.relativeTime(revision.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
