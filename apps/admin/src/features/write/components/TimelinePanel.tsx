import { toast } from '@lobehub/ui'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, History, Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import type { SetDraftShareData } from '~/api/drafts'
import {
  deleteDraftShare,
  getArchivedDrafts,
  getDraftHistory,
  getDraftShare,
  restoreDraftRevision,
  setDraftShare,
  undoDraftChange,
} from '~/api/drafts'
import { useI18n } from '~/i18n'
import type { TranslationKey } from '~/i18n/types'
import type { CheckpointKind, DraftModel, DraftShare } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import { subscribeDraftUpdate } from '~/socket/draft-update-signal'
import { confirmDialog } from '~/ui/feedback/confirm'
import { EmptyState } from '~/ui/patterns/EmptyState'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'

import {
  buildTimeline,
  type StepKind,
  type TimelineCheckpoint,
  type TimelineRow,
  type TimelineStep,
} from './timeline/build-timeline'
import { ShareBar } from './timeline/ShareBar'

const ROW_LIMIT = 200

const styles = stylex.create({
  root: {
    display: 'flex',
    minHeight: 0,
    height: '100%',
    flexDirection: 'column',
  },
  center: {
    display: 'flex',
    minHeight: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  scroll: {
    minHeight: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  scrollInner: {
    padding: '0.75rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    paddingBlock: '0.5rem',
    paddingInline: '0.5rem',
    borderRadius: cssVar.borderRadius,
    backgroundColor: {
      default: null,
      ':hover': cssVar.colorFillTertiary,
    },
  },
  step: {
    paddingBlock: '0.375rem',
    paddingInlineStart: '1.5rem',
  },
  dot: {
    width: '0.5rem',
    height: '0.5rem',
    flexShrink: 0,
    marginTop: '0.375rem',
    borderRadius: 9999,
    backgroundColor: cssVar.colorTextQuaternary,
  },
  dotLive: {
    backgroundColor: cssVar.colorPrimary,
  },
  body: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: cssVar.colorText,
    fontSize: cssVar.fontSize,
  },
  meta: {
    overflow: 'hidden',
    color: cssVar.colorTextSecondary,
    fontSize: cssVar.fontSizeSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  live: {
    flexShrink: 0,
    paddingInline: '0.375rem',
    borderRadius: 9999,
    backgroundColor: `color-mix(in srgb, ${cssVar.colorPrimary} 12%, transparent)`,
    color: cssVar.colorPrimary,
    fontSize: cssVar.fontSizeSM,
  },
  action: {
    flexShrink: 0,
    opacity: {
      default: 0,
      ':focus-visible': 1,
      [stylex.when.ancestor(':hover')]: 1,
    },
  },
  section: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: cssVar.colorBorderSecondary,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    paddingInline: '0.5rem',
    color: cssVar.colorTextSecondary,
    fontSize: cssVar.fontSizeSM,
    fontWeight: 500,
  },
  sectionHint: {
    paddingTop: '0.25rem',
    paddingInline: '0.5rem',
    paddingBottom: '0.5rem',
    color: cssVar.colorTextTertiary,
    fontSize: cssVar.fontSizeSM,
  },
})

const checkpointLabels: Record<CheckpointKind | 'legacy', TranslationKey> = {
  import: 'write.timeline.checkpoint.import',
  legacy: 'write.timeline.checkpoint.legacy',
  'legacy-save': 'write.timeline.checkpoint.legacySave',
  publish: 'write.timeline.checkpoint.publish',
  restore: 'write.timeline.checkpoint.restore',
  save: 'write.timeline.checkpoint.save',
  undo: 'write.timeline.checkpoint.undo',
}

const stepLabels: Record<StepKind, TranslationKey> = {
  agent: 'write.timeline.step.agent',
  human: 'write.timeline.step.human',
  other: 'write.timeline.step.other',
  restore: 'write.timeline.step.restore',
  undo: 'write.timeline.step.undo',
}

export interface TimelinePanelProps {
  authorName: (userId: string) => string | null
  documentId: string | null
  draftId: string
  onBeforeChange: () => Promise<void>
  onChanged: (change: { restored: boolean }) => Promise<void> | void
  publishedRevisionId: string | null
  selfId: string | null
}

export function TimelinePanel(props: TimelinePanelProps) {
  const { format, t } = useI18n()
  const queryClient = useQueryClient()
  const { draftId, documentId } = props
  const historyKey = adminQueryKeys.drafts.timeline(draftId)
  const historyQuery = useQuery({
    enabled: Boolean(draftId),
    queryFn: () => getDraftHistory(draftId),
    queryKey: historyKey,
  })
  const archivedQuery = useQuery({
    enabled: Boolean(draftId),
    queryFn: () => getArchivedDrafts(draftId),
    queryKey: adminQueryKeys.drafts.archived(draftId),
  })

  useEffect(
    () =>
      subscribeDraftUpdate((payload) => {
        if (payload.branchId !== draftId) return
        void queryClient.invalidateQueries({
          queryKey: adminQueryKeys.drafts.timeline(draftId),
        })
      }),
    [draftId, queryClient],
  )

  const rows = useMemo(
    () =>
      historyQuery.data
        ? buildTimeline(historyQuery.data, props.publishedRevisionId).slice(
            0,
            ROW_LIMIT,
          )
        : [],
    [historyQuery.data, props.publishedRevisionId],
  )

  const afterChange = async (restored: boolean) => {
    await props.onChanged({ restored })
    await queryClient.invalidateQueries({ queryKey: historyKey })
  }
  const restoreMutation = useMutation({
    mutationFn: async (revisionId: string) => {
      await props.onBeforeChange()
      return restoreDraftRevision(draftId, revisionId)
    },
    onError: () => toast.error(t('write.timeline.failed')),
    onSuccess: async () => {
      await afterChange(true)
      toast.success(t('write.timeline.restored'))
    },
  })
  const undoMutation = useMutation({
    mutationFn: async (step: TimelineStep) => {
      await props.onBeforeChange()
      return undoDraftChange(draftId, step.change, step.before)
    },
    onError: () => toast.error(t('write.timeline.failed')),
    onSuccess: async () => {
      await afterChange(false)
      toast.success(t('write.timeline.undone'))
    },
  })
  const busy = restoreMutation.isPending || undoMutation.isPending

  const restore = async (revisionId: string) => {
    const confirmed = await confirmDialog({
      confirmText: t('write.timeline.restore'),
      description: t('write.timeline.restoreDescription'),
      title: t('write.timeline.restoreTitle'),
    })
    if (confirmed) restoreMutation.mutate(revisionId)
  }

  const shareKey = adminQueryKeys.drafts.share(documentId ?? '')
  const shareQuery = useQuery({
    enabled: Boolean(documentId),
    queryFn: () => getDraftShare(documentId!),
    queryKey: shareKey,
  })
  const writeShare = (share: DraftShare | null) => {
    queryClient.setQueryData(shareKey, share)
  }
  const setShareMutation = useMutation({
    mutationFn: (data: SetDraftShareData) => setDraftShare(documentId!, data),
    onSuccess: writeShare,
  })
  const revokeShareMutation = useMutation({
    mutationFn: () => deleteDraftShare(documentId!),
    onSuccess: () => {
      writeShare(null)
      toast.success(t('write.share.revoked'))
    },
  })
  const followDraft = () => setShareMutation.mutate({ draftId, mode: 'follow' })

  const stepAuthor = (row: TimelineRow) => {
    if (row.type !== 'step' || !row.author || row.author === props.selfId) {
      return null
    }
    return props.authorName(row.author) ?? row.author
  }

  const archived = archivedQuery.data ?? []

  return (
    <div {...stylex.props(styles.root)}>
      {documentId ? (
        <ShareBar
          canFollowCurrentDraft
          onCreate={followDraft}
          onFollowCurrentDraft={followDraft}
          onRevoke={() => revokeShareMutation.mutate()}
          pending={setShareMutation.isPending || revokeShareMutation.isPending}
          share={shareQuery.data ?? null}
        />
      ) : null}
      {historyQuery.isLoading ? (
        <div {...stylex.props(styles.center)}>
          <Loader2 aria-hidden="true" size={16} />
        </div>
      ) : rows.length === 0 && archived.length === 0 ? (
        <div {...stylex.props(styles.center)}>
          <EmptyState
            description={t('write.timeline.emptyDescription')}
            icon={History}
            title={t('write.timeline.emptyTitle')}
          />
        </div>
      ) : (
        <Scroll
          className={stylex.props(styles.scroll).className}
          innerClassName={stylex.props(styles.scrollInner).className}
        >
          <ol {...stylex.props(styles.list)}>
            {rows.map((row) => (
              <TimelineItem
                authorName={stepAuthor(row)}
                busy={busy}
                key={rowKey(row)}
                onRestore={() => void restore((row as TimelineCheckpoint).id)}
                onUndo={() => undoMutation.mutate(row as TimelineStep)}
                row={row}
                time={format.relativeTime(row.time)}
              />
            ))}
          </ol>
          {archived.length ? (
            <ArchivedDrafts
              busy={busy}
              drafts={archived}
              onRestore={(draft) => void restore(draft.headRevisionId)}
            />
          ) : null}
        </Scroll>
      )}
    </div>
  )
}

const rowKey = (row: TimelineRow) =>
  row.type === 'checkpoint'
    ? `checkpoint:${row.id}`
    : `step:${row.change.peer}:${row.change.counter}`

function RestoreButton(props: { busy: boolean; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <Button
      aria-label={t('write.timeline.restore')}
      className={stylex.props(styles.action).className}
      disabled={props.busy}
      iconOnly
      onClick={props.onClick}
      title={t('write.timeline.restore')}
      variant="ghost"
    >
      <RotateCcw aria-hidden="true" size={14} />
    </Button>
  )
}

function ArchivedDrafts(props: {
  busy: boolean
  drafts: DraftModel[]
  onRestore: (draft: DraftModel) => void
}) {
  const { format, t } = useI18n()
  return (
    <section {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.sectionTitle)}>
        <Archive aria-hidden="true" size={14} />
        {t('write.timeline.archived.title', { count: props.drafts.length })}
      </div>
      <div {...stylex.props(styles.sectionHint)}>
        {t('write.timeline.archived.hint')}
      </div>
      <ol {...stylex.props(styles.list)}>
        {props.drafts.map((draft) => (
          <li
            key={draft.id}
            {...stylex.props(stylex.defaultMarker(), styles.item)}
          >
            <span {...stylex.props(styles.dot)} />
            <div {...stylex.props(styles.body)}>
              <div {...stylex.props(styles.heading)}>
                {draft.headRevision.title || t('write.editor.untitled')}
              </div>
              <div {...stylex.props(styles.meta)}>
                {format.relativeTime(draft.updatedAt)}
              </div>
            </div>
            <RestoreButton
              busy={props.busy}
              onClick={() => props.onRestore(draft)}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}

function TimelineItem(props: {
  authorName: string | null
  busy: boolean
  onRestore: () => void
  onUndo: () => void
  row: TimelineRow
  time: string
}) {
  const { t } = useI18n()
  const { row } = props

  if (row.type === 'checkpoint') {
    return (
      <li {...stylex.props(stylex.defaultMarker(), styles.item)}>
        <span {...stylex.props(styles.dot, row.published && styles.dotLive)} />
        <div {...stylex.props(styles.body)}>
          <div {...stylex.props(styles.heading)}>
            <span>{t(checkpointLabels[row.kind ?? 'legacy'])}</span>
            {row.published ? (
              <span {...stylex.props(styles.live)}>
                {t('write.timeline.published')}
              </span>
            ) : null}
          </div>
          <div {...stylex.props(styles.meta)}>
            {row.title || t('write.editor.untitled')} · {props.time}
          </div>
        </div>
        <RestoreButton busy={props.busy} onClick={props.onRestore} />
      </li>
    )
  }

  const summary =
    row.kind === 'agent' ? row.message.replace(/^agent:?\s*/, '') : ''
  return (
    <li {...stylex.props(stylex.defaultMarker(), styles.item, styles.step)}>
      <div {...stylex.props(styles.body)}>
        <div {...stylex.props(styles.meta)}>
          {props.authorName
            ? t('write.timeline.step.member', {
                count: row.count,
                name: props.authorName,
              })
            : t(stepLabels[row.kind], { count: row.count, summary })}
        </div>
        <div {...stylex.props(styles.meta)}>{props.time}</div>
      </div>
      {row.undoable ? (
        <Button
          aria-label={t('write.timeline.undo')}
          className={stylex.props(styles.action).className}
          disabled={props.busy}
          iconOnly
          onClick={props.onUndo}
          title={t('write.timeline.undo')}
          variant="ghost"
        >
          <Undo2 aria-hidden="true" size={14} />
        </Button>
      ) : null}
    </li>
  )
}
