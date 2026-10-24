import { createStaticStyles, Skeleton, Tag, TextArea, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBeforeUnload, useBlocker, useSearchParams } from 'react-router'

import type { AIInsights, AISummary } from '~/api/ai'
import {
  getInsightsByRef,
  getSummaryByRef,
  updateInsights,
  updateSummary,
} from '~/api/ai'
import { writeChromeStyles } from '~/features/write/components/chrome/styles'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { useWriteTopbarSlots } from '~/layouts/write-topbar-slots'
import { adminQueryKeys } from '~/query/keys'
import { confirmDialog } from '~/ui/feedback/confirm'
import { Button } from '~/ui/site-button'

import { aiCopy, useAiCopy } from '../copy'
import { getErrorMessage } from '../utils/ai'

const styles = createStaticStyles(({ css, cssVar }) => ({
  insights: css`
    resize: vertical;

    width: 100%;
    min-height: 60vh;
    margin-block-start: 32px;
    padding: 0;
    border: 0;

    font-size: ${cssVar.fontSize};
    line-height: 1.8;
    color: ${cssVar.colorText};

    background: transparent;

    &::placeholder {
      color: ${cssVar.colorTextQuaternary};
    }
  `,
  message: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding-block-start: 48px;
  `,
  status: css`
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
    white-space: nowrap;
  `,
  summary: css`
    resize: vertical;

    width: 100%;
    min-height: 40vh;
    margin-block-start: 48px;
    padding: 0;
    border: 0;

    font-size: ${cssVar.fontSizeLG};
    line-height: 1.7;
    color: ${cssVar.colorText};

    background: transparent;

    &::placeholder {
      color: ${cssVar.colorTextQuaternary};
    }
  `,
}))

type Kind = 'insights' | 'summary'

interface TextItem {
  id: string
  isTranslation?: boolean
  lang: string
  sourceLang?: string
  text: string
}

export function ArtefactTextWritePage() {
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('id') ?? ''
  const summaryId = searchParams.get('summaryId')
  const insightsId = searchParams.get('insightsId')
  const kind: Kind = summaryId ? 'summary' : 'insights'
  const itemId = summaryId || insightsId || ''
  const copy = useAiCopy()
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const topbar = useWriteTopbarSlots()
  const [draft, setDraft] = useState<string | null>(null)
  const [seed, setSeed] = useState<string | null>(null)
  const seededId = useRef<string | null>(null)

  const query = useQuery({
    enabled: Boolean(postId && itemId),
    queryFn: () => loadItems(kind, postId),
    queryKey: adminQueryKeys.ai.groupedByRef({
      group: kind === 'summary' ? 'summaries' : 'insights',
      id: postId,
    }),
  })
  const item = useMemo(() => {
    const row = query.data?.items.find((entry) => entry.id === itemId)
    return row ? toTextItem(row) : null
  }, [itemId, query.data])
  const articleTitle = query.data?.article?.document.title ?? ''

  useEffect(() => {
    if (!item || seededId.current === item.id) return
    seededId.current = item.id
    setDraft(item.text)
    setSeed(item.text)
  }, [item])

  const ready = draft !== null && seed !== null && item?.id === itemId
  const dirty = ready && draft !== seed
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const draftRef = useRef(draft)
  draftRef.current = draft
  const itemRef = useRef(item)
  itemRef.current = item

  const pageHeading = articleTitle
  useDocumentTitle(pageHeading || undefined)
  useEffect(() => {
    topbar.setPageTitle(pageHeading || null)
    return () => topbar.setPageTitle(null)
  }, [pageHeading, topbar.setPageTitle])

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.groupedRoot(
          kind === 'summary' ? 'summaries' : 'insights',
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.overviewArticle(postId),
      }),
    ])
  }

  const save = useMutation({
    mutationFn: async () => {
      const current = draftRef.current
      const currentItem = itemRef.current
      if (current === null || !currentItem || !current.trim()) return null
      const snapshot = current
      if (kind === 'summary') {
        await updateSummary(currentItem.id, { summary: current })
      } else {
        await updateInsights(currentItem.id, { content: current })
      }
      return snapshot
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('saveFailed'))),
    onSuccess: async (snapshot) => {
      if (snapshot === null) return
      setSeed(snapshot)
      toast.success(copy('saved'))
      await refresh()
    },
  })

  useBeforeUnload(
    (event) => {
      if (!dirtyRef.current) return
      event.preventDefault()
    },
    { capture: true },
  )
  const blocker = useBlocker(() => dirtyRef.current)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    void confirmDialog({
      confirmText: t('common.leave'),
      description: aiCopy(locale, 'leaveUnsavedBody'),
      title: aiCopy(locale, 'leaveUnsavedTitle'),
    }).then((ok) => {
      if (ok) blocker.proceed()
      else blocker.reset()
    })
  }, [blocker, locale, t])

  if (!postId || !itemId || (query.isSuccess && !item)) {
    return (
      <WriteFrame>
        <p className={styles.message}>
          {copy(
            kind === 'summary' ? 'summaryMissingTitle' : 'insightsMissingTitle',
          )}
        </p>
      </WriteFrame>
    )
  }

  if (query.isError) {
    return (
      <WriteFrame>
        <div className={styles.message}>
          <p>{copy('itemFailedTitle')}</p>
          <Button onClick={() => void query.refetch()}>
            {copy('retryLoad')}
          </Button>
        </div>
      </WriteFrame>
    )
  }

  if (!ready || draft === null || !item) {
    return (
      <WriteFrame>
        <div className={styles.message}>
          <Skeleton.Text
            rows={6}
            width={['100%', '96%', '88%', '92%', '70%', '40%']}
          />
        </div>
      </WriteFrame>
    )
  }

  const identity = (
    <>
      <Tag>{item.lang}</Tag>
      {item.isTranslation && item.sourceLang ? (
        <span className={styles.status}>
          {copy('translatedFrom', { lang: item.sourceLang })}
        </span>
      ) : null}
      {dirty ? <span className={styles.status}>{copy('unsaved')}</span> : null}
    </>
  )

  return (
    <div className={writeChromeStyles.root}>
      {topbar.identity ? createPortal(identity, topbar.identity) : null}
      {topbar.actions
        ? createPortal(
            <div className={writeChromeStyles.barActions}>
              <Button
                disabled={!dirty || !draft.trim()}
                htmlType="button"
                loading={save.isPending}
                onClick={() => save.mutate()}
                type="primary"
              >
                {copy(kind === 'summary' ? 'saveSummary' : 'saveInsights')}
              </Button>
            </div>,
            topbar.actions,
          )
        : null}
      <div className={writeChromeStyles.body}>
        <div className={writeChromeStyles.editor}>
          <div className={writeChromeStyles.canvas}>
            <div className={writeChromeStyles.column}>
              <TextArea
                aria-label={copy(
                  kind === 'summary' ? 'kindSummary' : 'kindInsights',
                )}
                autoSize
                className={
                  kind === 'summary' ? styles.summary : styles.insights
                }
                onChange={(event) => setDraft(event.target.value)}
                placeholder={copy(
                  kind === 'summary' ? 'kindSummary' : 'kindInsights',
                )}
                value={draft}
                variant="borderless"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WriteFrame(props: { children: ReactNode }) {
  return (
    <div className={writeChromeStyles.root}>
      <div className={writeChromeStyles.body}>
        <div className={writeChromeStyles.editor}>
          <div className={writeChromeStyles.canvas}>
            <div className={writeChromeStyles.column}>{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

async function loadItems(kind: Kind, postId: string) {
  if (kind === 'summary') {
    const response = await getSummaryByRef(postId)
    return { article: response.article, items: response.summaries }
  }
  const response = await getInsightsByRef(postId)
  return { article: response.article, items: response.insights }
}

function toTextItem(item: AIInsights | AISummary): TextItem {
  if ('summary' in item) return toSummaryItem(item)
  return toInsightsItem(item)
}

function toSummaryItem(item: AISummary): TextItem {
  return { id: item.id, lang: item.lang, text: item.summary }
}

function toInsightsItem(item: AIInsights): TextItem {
  return {
    id: item.id,
    isTranslation: item.isTranslation,
    lang: item.lang,
    sourceLang: item.sourceLang,
    text: item.content,
  }
}
