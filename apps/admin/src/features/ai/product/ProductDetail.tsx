import { createStaticStyles, Empty, Skeleton } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import type { AIInsights, AISummary, AITranslation, AITtsRow } from '~/api/ai'
import { getArticleOverview } from '~/api/ai-overview'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { adminQueryKeys } from '~/query/keys'
import { ARTICLE_MAX_WIDTH, Page } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useArticleGroupedRouteContext } from '../components/article-grouped/article-grouped-route-context'
import { useAiCopy } from '../copy'
import { InsightsGallery } from './InsightsGallery'
import { ProductCapabilityMatrix } from './ProductCapabilityMatrix'
import { SummaryGallery } from './SummaryGallery'
import { TranslationGallery } from './TranslationGallery'
import { TtsGallery } from './TtsGallery'

const styles = createStaticStyles(({ css }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: ${ARTICLE_MAX_WIDTH};
  `,
}))

function isLive(status: string) {
  return status === 'pending' || status === 'running'
}

function overviewLive(tasks: { status: string }[] | undefined) {
  return Boolean(tasks?.some((task) => isLive(task.status)))
}

function staleIds(assets: { id: string; stale?: boolean }[] | undefined) {
  return new Set(
    (assets ?? []).filter((asset) => asset.stale).map((asset) => asset.id),
  )
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const copy = useAiCopy()
  const { config } = useArticleGroupedRouteContext<unknown>()
  const product = config.product

  const overviewQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getArticleOverview(id!),
    queryKey: adminQueryKeys.ai.overviewArticle(id ?? ''),
    refetchInterval: (query) =>
      overviewLive(query.state.data?.activeTasks) ? 2000 : false,
    refetchIntervalInBackground: true,
  })

  const detailQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => config.getItemsByRef(id!),
    queryKey: adminQueryKeys.ai.groupedByRef({
      group: config.groupedQueryKey,
      id: id ?? '',
    }),
    refetchInterval: () =>
      overviewLive(overviewQuery.data?.activeTasks) ? 2000 : false,
  })

  const items = detailQuery.data?.items ?? []
  const title =
    detailQuery.data?.article?.document.title ??
    overviewQuery.data?.article.title ??
    ''
  useDocumentTitle(
    title || (detailQuery.isSuccess ? copy('untitled') : undefined),
  )

  const tasks = (overviewQuery.data?.activeTasks ?? []).filter(
    (task) => task.capability === product,
  )
  const pageTitle = title || copy('untitled')
  const lockedLangs =
    product === 'translation'
      ? (items as AITranslation[])
          .filter((item) => item.isLocked)
          .map((item) => item.lang)
      : []
  const matrix = overviewQuery.data ? (
    <ProductCapabilityMatrix
      capability={product}
      lockedLangs={lockedLangs}
      overview={overviewQuery.data}
      postId={id ?? ''}
    />
  ) : null

  if (!id) return null

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <Page title={copy('loadingPost')} width="wide">
        <div aria-busy="true" className={styles.body}>
          <Skeleton height={20} width="48%" />
          <Skeleton height={12} width="32%" />
          <Skeleton.Text
            rows={6}
            width={['100%', '96%', '88%', '92%', '70%', '40%']}
          />
        </div>
      </Page>
    )
  }

  if (detailQuery.isError) {
    return (
      <Page title={copy('post')} width="wide">
        <Empty
          action={
            <Button onClick={() => void detailQuery.refetch()}>
              {copy('retryLoad')}
            </Button>
          }
          description={copy('itemFailedBody')}
          title={copy('itemFailedTitle')}
        />
      </Page>
    )
  }

  if (product === 'translation') {
    return (
      <TranslationGallery
        items={items as AITranslation[]}
        matrix={matrix}
        postId={id}
        staleIds={staleIds(overviewQuery.data?.assets.translation)}
        tasks={tasks}
        title={pageTitle}
      />
    )
  }

  if (product === 'summary') {
    return (
      <SummaryGallery
        items={items as AISummary[]}
        matrix={matrix}
        postId={id}
        staleIds={staleIds(overviewQuery.data?.assets.summary)}
        tasks={tasks}
        title={pageTitle}
      />
    )
  }

  if (product === 'insights') {
    return (
      <InsightsGallery
        items={items as AIInsights[]}
        matrix={matrix}
        postId={id}
        staleIds={staleIds(overviewQuery.data?.assets.insights)}
        tasks={tasks}
        title={pageTitle}
      />
    )
  }

  return (
    <TtsGallery
      items={items as AITtsRow[]}
      matrix={matrix}
      postId={id}
      staleIds={staleIds(overviewQuery.data?.assets.tts)}
      tasks={tasks}
      title={pageTitle}
    />
  )
}
