import {
  Alert,
  createStaticStyles,
  Empty,
  Flexbox,
  Input,
  Tag,
  Text,
  toast,
} from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { getTranslationsByRef } from '~/api/ai'
import type {
  ActiveGeneration,
  AiOverviewCapability,
  AiOverviewDetail,
} from '~/api/ai-overview'
import { getArticleOverview } from '~/api/ai-overview'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { Page } from '~/ui/page'
import { ListSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useAiCopy } from '../../copy'
import { MATRIX_CAPABILITIES } from '../../overview/coverage'
import { confirmTranslationRewrite } from '../../product/confirm-rewrite'
import { getRefTypeMeta } from '../article-grouped/refTypeMeta'
import { type AssetRow, buildAssetRows } from './asset-rows'
import {
  coverageColumns,
  findGenerationFailure,
  isTaskLive,
  normaliseLangInput,
  resolveCell,
} from './coverage-cells'
import { LocaleMetaSection } from './LocaleMetaSection'
import { buildGenerateTask } from './overview-generate-task'
import { OverviewMatrix } from './OverviewMatrix'
import { useOverviewActions } from './useOverviewActions'

const ACTIVE_POLL_MS = 2000
const DISPATCH_GRACE_MS = 20_000

const KIND = {
  insights: 'kindInsights',
  summary: 'kindSummary',
  translation: 'kindTranslation',
  tts: 'kindTts',
} as const

const styles = createStaticStyles(({ css }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 28px;
  `,
}))

function shouldPoll(tasks: ActiveGeneration[] | undefined, pollUntil: number) {
  return Boolean(tasks?.some(isTaskLive)) || Date.now() < pollUntil
}

interface SectionModel {
  assets: AssetRow[]
  failed: Array<{ error: string | null; lang: string }>
  fillable: string[]
  missing: string[]
  pending: string[]
}

function buildSection(
  detail: AiOverviewDetail,
  capability: AiOverviewCapability,
  assets: AssetRow[],
  extraLangs: string[],
): SectionModel {
  const model: SectionModel = {
    assets: assets.filter((row) => row.capability === capability),
    failed: [],
    fillable: [],
    missing: [],
    pending: [],
  }
  for (const lang of coverageColumns(detail.coverage, extraLangs)) {
    const state = resolveCell(
      detail.coverage,
      capability,
      lang,
      detail.activeTasks,
    )
    if (state === 'pending') model.pending.push(lang)
    else if (state === 'failed') {
      model.failed.push({
        error:
          findGenerationFailure(detail.activeTasks, capability, lang)?.error ??
          null,
        lang,
      })
    } else if (
      state === 'gap' ||
      (state === 'addable' && extraLangs.includes(lang))
    ) {
      model.missing.push(lang)
    }
  }
  model.fillable = [...model.missing, ...model.failed.map((item) => item.lang)]
  return model
}

export function OverviewDetailPane(props: { refId: string }) {
  const { locale } = useI18n()
  const copy = useAiCopy()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const actions = useOverviewActions(props.refId)
  const [extraLangs, setExtraLangs] = useState<string[]>([])
  const [langDraft, setLangDraft] = useState('')
  const [pollUntil, setPollUntil] = useState(0)

  const query = useQuery({
    queryFn: () => getArticleOverview(props.refId),
    queryKey: adminQueryKeys.ai.overviewArticle(props.refId),
    refetchInterval: (current) =>
      shouldPoll(current.state.data?.activeTasks, pollUntil)
        ? ACTIVE_POLL_MS
        : false,
    refetchIntervalInBackground: true,
  })
  const lockedQuery = useQuery({
    queryFn: () => getTranslationsByRef(props.refId),
    queryKey: adminQueryKeys.ai.lockedTranslations(props.refId),
  })

  useEffect(() => {
    setExtraLangs([])
    setLangDraft('')
    setPollUntil(0)
  }, [props.refId])

  const detail = query.data
  useDocumentTitle(
    detail ? detail.article.title || copy('untitled') : undefined,
  )
  const lockedLangs = (lockedQuery.data?.translations ?? [])
    .filter((item) => item.isLocked)
    .map((item) => item.lang)
  const assets = useMemo(() => (detail ? buildAssetRows(detail) : []), [detail])
  const sections = useMemo(
    () =>
      detail
        ? MATRIX_CAPABILITIES.map((capability) => ({
            capability,
            model: buildSection(detail, capability, assets, extraLangs),
          }))
        : [],
    [assets, detail, extraLangs],
  )
  const fillableCount = sections.reduce(
    (total, item) => total + item.model.fillable.length,
    0,
  )
  const live = detail?.activeTasks.filter(isTaskLive) ?? []

  const fillAllMutation = useMutation({
    mutationFn: async (current: AiOverviewDetail) => {
      const results = await Promise.allSettled(
        sections
          .filter((item) => item.model.fillable.length)
          .map((item) =>
            buildGenerateTask(
              item.capability,
              item.model.fillable,
              props.refId,
              current,
              false,
            ),
          ),
      )
      return results.filter((result) => result.status === 'rejected').length
    },
    onSuccess: async (failed) => {
      if (failed) toast.warning(copy('fillSomeFailed', { count: failed }))
      else toast.success(copy('taskCreated'))
      setPollUntil(Date.now() + DISPATCH_GRACE_MS)
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.ai.overviewRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.tasks.tasksRoot,
        }),
      ])
    },
  })

  const dispatch = async (
    capability: AiOverviewCapability,
    langs: string[] | undefined,
    force: boolean,
  ) => {
    if (!detail) return
    let nextLangs = langs
    let regenerateLocked = false
    if (capability === 'translation' && force) {
      const confirmed = await confirmTranslationRewrite({
        locale,
        lockedLangs,
        targetLangs: langs,
      })
      if (confirmed.cancelled) {
        if (confirmed.skippedLocked) toast.info(copy('skippedLocked'))
        return
      }
      nextLangs = confirmed.langs
      regenerateLocked = confirmed.regenerateLocked
    }
    setPollUntil(Date.now() + DISPATCH_GRACE_MS)
    actions.generate(capability, nextLangs, detail, force, regenerateLocked)
  }

  const addLang = () => {
    const lang = normaliseLangInput(langDraft)
    if (!lang) {
      toast.error(copy('addLangInvalid'))
      return
    }
    setExtraLangs((current) =>
      current.includes(lang) ? current : [...current, lang],
    )
    setLangDraft('')
  }

  if (query.isLoading) {
    return (
      <Page title={copy('loadingPost')} width="wide">
        <ListSkeleton rows={5} />
      </Page>
    )
  }

  if (query.isError || !detail) {
    return (
      <Page title={copy('post')} width="wide">
        <Empty
          action={
            <Button onClick={() => void query.refetch()}>
              {copy('retryLoad')}
            </Button>
          }
          description={copy('detailFailedBody')}
          title={copy('detailFailedTitle')}
        />
      </Page>
    )
  }

  const editPath = getRefTypeMeta(detail.article.type).editPath
  const cost = detail.cost.total
  const pageActions =
    fillableCount || editPath ? (
      <Flexbox gap={8} horizontal>
        {fillableCount ? (
          <Button
            icon={WandSparkles}
            loading={fillAllMutation.isPending}
            onClick={() => fillAllMutation.mutate(detail)}
            type="primary"
          >
            {copy('fillAll')}
          </Button>
        ) : null}
        {editPath ? (
          <Button icon={Pencil} onClick={() => navigate(editPath(props.refId))}>
            {copy('editPost')}
          </Button>
        ) : null}
      </Flexbox>
    ) : undefined

  return (
    <Page
      actions={pageActions}
      title={
        <Flexbox align="center" gap={8} horizontal style={{ minWidth: 0 }}>
          <Text ellipsis>{detail.article.title || copy('untitled')}</Text>
          {fillableCount ? (
            <Tag color="warning">
              {copy('gapCount', { count: fillableCount })}
            </Tag>
          ) : (
            <Tag color="success">{copy('complete')}</Tag>
          )}
        </Flexbox>
      }
      width="wide"
    >
      <div className={styles.body}>
        <Text type="secondary">
          {detail.coverage.sourceLang
            ? copy('sourceLang', { lang: detail.coverage.sourceLang })
            : copy('sourceUnknown')}
          {cost.generationCount
            ? ` · ${copy('costLine', {
                count: cost.generationCount,
                usd: cost.costTotalUsd.toFixed(4),
              })}`
            : null}
        </Text>
        {live.length ? (
          <Flexbox gap={8}>
            {live.map((task) => (
              <Alert
                description={task.progressMessage || undefined}
                key={task.taskId}
                title={copy('generatingLine', {
                  kind: copy(KIND[task.capability]),
                  langs: task.langs.length ? ` · ${task.langs.join('、')}` : '',
                })}
                type="info"
              />
            ))}
          </Flexbox>
        ) : null}
        <OverviewMatrix
          activeTasks={detail.activeTasks}
          assets={assets}
          busy={actions.isMutating}
          coverage={detail.coverage}
          langs={coverageColumns(detail.coverage, extraLangs)}
          lockedLangs={lockedLangs}
          onGenerate={(capability, lang, force) =>
            void dispatch(capability, [lang], force)
          }
          onOpen={(path) => navigate(path)}
          refId={props.refId}
        />
        <Flexbox align="center" gap={8} horizontal>
          <Input
            aria-label={copy('addLang')}
            onChange={(event) =>
              setLangDraft(
                typeof event === 'string' ? event : event.target.value,
              )
            }
            onPressEnter={addLang}
            placeholder={copy('addLangPlaceholder')}
            style={{ maxWidth: 200 }}
            value={langDraft}
          />
          <Button onClick={addLang}>{copy('addLangAction')}</Button>
        </Flexbox>
        {detail.localeMeta?.length ? (
          <LocaleMetaSection
            onOpen={(path) => navigate(path)}
            postEditPath={editPath ?? undefined}
            refId={props.refId}
            rows={detail.localeMeta}
            translations={detail.assets.translation}
          />
        ) : null}
      </div>
    </Page>
  )
}
