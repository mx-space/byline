import { createStaticStyles, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GitBranch } from 'lucide-react'
import { useMemo } from 'react'

import type { SetDraftShareData } from '~/api/drafts'
import { deleteDraftShare, getDraftShare, setDraftShare } from '~/api/drafts'
import { useI18n } from '~/i18n'
import type { DraftModel, DraftShare, VersionTreeNode } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import { EmptyState } from '~/ui/patterns/EmptyState'
import { Scroll } from '~/ui/primitives/scroll'

import { buildGraphRows } from './version-tree/layout'
import { ShareBar } from './version-tree/ShareBar'
import { VersionTreeGraph } from './version-tree/VersionTreeGraph'

const lobeStyles = createStaticStyles(({ css }) => ({
  uRoot: css`
    display: flex;
    min-height: 0px;
    height: 100%;
    flex-direction: column;
  `,
  u79840771: css`
    display: flex;
    min-height: 0px;
    flex: 1 1 0%;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  `,
  u2b5fa9a9: css`
    min-height: 0px;
    flex: 1 1 0%;
  `,
  u44bd673a: css`
    padding-inline: 0.75rem;
    padding-block: 1rem;
  `,
}))

export interface VersionTreePanelProps {
  currentDraftId: string
  currentPublishedRevisionId: string | null
  deletingDraftId: string | null
  documentId: string | null
  drafts: DraftModel[]
  nodes: VersionTreeNode[]
  onCompare: (draft: DraftModel) => void
  onContinue: (draft: DraftModel) => void
  onDelete: (draft: DraftModel) => void
  onHistory: (draft: DraftModel) => void
  onPublish: (draft: DraftModel) => void
  onViewOnline: () => void
}

export function VersionTreePanel(props: VersionTreePanelProps) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const rows = useMemo(
    () =>
      buildGraphRows(
        props.nodes,
        props.drafts,
        props.currentPublishedRevisionId,
      ),
    [props.currentPublishedRevisionId, props.drafts, props.nodes],
  )

  const { documentId } = props
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

  const followCurrentDraft = () => {
    if (!props.currentDraftId) return
    setShareMutation.mutate({ draftId: props.currentDraftId, mode: 'follow' })
  }
  const share = shareQuery.data ?? null
  const sharePending =
    setShareMutation.isPending || revokeShareMutation.isPending

  return (
    <div className={lobeStyles.uRoot}>
      {documentId ? (
        <ShareBar
          canFollowCurrentDraft={Boolean(props.currentDraftId)}
          onCreate={() => {
            if (props.currentDraftId) {
              followCurrentDraft()
            } else if (props.currentPublishedRevisionId) {
              setShareMutation.mutate({
                mode: 'pinned',
                revisionId: props.currentPublishedRevisionId,
              })
            }
          }}
          onFollowCurrentDraft={followCurrentDraft}
          onRevoke={() => revokeShareMutation.mutate()}
          pending={sharePending}
          share={share}
        />
      ) : null}
      {rows.length === 0 ? (
        <div className={lobeStyles.u79840771}>
          <EmptyState
            description={t('write.versionTree.emptyDescription')}
            icon={GitBranch}
            title={t('write.versionTree.emptyTitle')}
          />
        </div>
      ) : (
        <Scroll
          className={lobeStyles.u2b5fa9a9}
          innerClassName={lobeStyles.u44bd673a}
        >
          <VersionTreeGraph
            currentDraftId={props.currentDraftId}
            deletingDraftId={props.deletingDraftId}
            onCompare={props.onCompare}
            onContinue={props.onContinue}
            onDelete={props.onDelete}
            onHistory={props.onHistory}
            onPublish={props.onPublish}
            onShareDraft={(draft) =>
              setShareMutation.mutate({ draftId: draft.id, mode: 'follow' })
            }
            onShareRevision={(node) =>
              setShareMutation.mutate({
                mode: 'pinned',
                revisionId: node.revision.id,
              })
            }
            onViewOnline={props.onViewOnline}
            rows={rows}
            sharedDraftId={share?.draftId ?? null}
            sharedRevisionId={share?.revisionId ?? null}
          />
        </Scroll>
      )}
    </div>
  )
}
