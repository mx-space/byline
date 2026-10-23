import {
  ActionIcon,
  Alert,
  Button,
  confirmModal,
  createStaticStyles,
  Empty,
  Flexbox,
  Icon,
  Input,
  SkeletonText,
  Tag,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Pencil,
  RefreshCw,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { getTranslationsByRef } from '~/api/ai'
import type {
  ActiveGeneration,
  AiOverviewCapability,
  AiOverviewDetail,
} from '~/api/ai-overview'
import { getArticleOverview } from '~/api/ai-overview'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { DetailPane } from '~/ui/page'

import { useAiCopy } from '../../copy'
import { DetailDrawer } from '../../hub/DetailDrawer'
import {
  CAPABILITY_LABEL,
  CAPABILITY_PATH,
} from '../../overview/capability-label'
import { MATRIX_CAPABILITIES } from '../../overview/coverage'
import { confirmTranslationRewrite } from '../../product/confirm-rewrite'
import { getRefTypeMeta } from '../article-grouped/refTypeMeta'
import { type AssetRow, buildAssetRows } from './asset-rows'
import { CAPABILITY_META } from './capability-meta'
import {
  coverageColumns,
  findGenerationFailure,
  isTaskLive,
  normaliseLangInput,
  resolveCell,
} from './coverage-cells'
import { buildGenerateTask } from './overview-generate-task'
import { useOverviewActions } from './useOverviewActions'

const ACTIVE_POLL_MS = 2000
const DISPATCH_GRACE_MS = 20_000

const KIND = {
  insights: 'kindInsights',
  summary: 'kindSummary',
  translation: 'kindTranslation',
  tts: 'kindTts',
} as const

const styles = createStaticStyles(({ css, cssVar }) => ({
  assetMain: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `,
  assetRow: css`
    display: flex;
    align-items: flex-start;
    gap: 12px;

    padding-block: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  body: css`
    display: flex;
    flex-direction: column;
    gap: 28px;
  `,
  langLine: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  `,
  preview: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    margin: 0;

    font-size: ${cssVar.fontSizeSM};
    line-height: 1.6;
    color: ${cssVar.colorTextSecondary};
  `,
  section: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  sectionHead: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
  `,
  sectionTitle: css`
    flex: 1;

    margin: 0;

    font-size: ${cssVar.fontSize};
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  stateLine: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    padding-block: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  time: css`
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
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

export function OverviewDetailPane(props: {
  onClose: () => void
  refId: string
}) {
  const { format, locale } = useI18n()
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

  const removeAsset = (row: AssetRow) => {
    const kind = copy(KIND[row.capability])
    confirmModal({
      cancelText: copy('cancel'),
      content: copy('deleteAssetBody', { kind }),
      okButtonProps: { danger: true },
      okText: copy('deleteAsset', { kind }),
      onOk: () => actions.remove(row.capability, row.id),
      title: copy('deleteAssetTitle', { kind }),
    })
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
      <DetailDrawer onClose={props.onClose} title={copy('loadingPost')}>
        <DetailPane hideHeader>
          <Flexbox aria-busy gap={24}>
            <SkeletonText rows={3} />
            <SkeletonText rows={3} />
          </Flexbox>
        </DetailPane>
      </DetailDrawer>
    )
  }

  if (query.isError || !detail) {
    return (
      <DetailDrawer onClose={props.onClose} title={copy('post')}>
        <DetailPane hideHeader>
          <Empty
            action={
              <Button onClick={() => void query.refetch()}>
                {copy('retryLoad')}
              </Button>
            }
            description={copy('detailFailedBody')}
            title={copy('detailFailedTitle')}
          />
        </DetailPane>
      </DetailDrawer>
    )
  }

  const editPath = getRefTypeMeta(detail.article.type).editPath
  const cost = detail.cost.total

  return (
    <DetailDrawer
      footer={
        <Flexbox align="center" gap={8} horizontal style={{ width: '100%' }}>
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
          <Flexbox flex={1} />
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
            <Button
              icon={Pencil}
              onClick={() => navigate(editPath(props.refId))}
            >
              {copy('editPost')}
            </Button>
          ) : null}
        </Flexbox>
      }
      onClose={props.onClose}
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
    >
      <DetailPane hideHeader>
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
                    langs: task.langs.length
                      ? ` · ${task.langs.join('、')}`
                      : '',
                  })}
                  type="info"
                />
              ))}
            </Flexbox>
          ) : null}
          {sections.map(({ capability, model }) => (
            <section className={styles.section} key={capability}>
              <div className={styles.sectionHead}>
                <Icon icon={CAPABILITY_META[capability].icon} size="small" />
                <h3 className={styles.sectionTitle}>
                  {copy(CAPABILITY_LABEL[capability])}
                </h3>
                {model.fillable.length ? (
                  <Button
                    loading={actions.isMutating}
                    onClick={() =>
                      void dispatch(capability, model.fillable, false)
                    }
                    size="small"
                  >
                    {copy('fillOne', { kind: copy(KIND[capability]) })}
                  </Button>
                ) : null}
                {model.assets.length ? (
                  <Button
                    icon={ArrowUpRight}
                    onClick={() =>
                      navigate(`${CAPABILITY_PATH[capability]}/${props.refId}`)
                    }
                    size="small"
                    type="text"
                  >
                    {copy('openKind', { kind: copy(KIND[capability]) })}
                  </Button>
                ) : null}
              </div>
              {model.pending.length ? (
                <div className={styles.stateLine}>
                  <Tag color="processing">{copy('generating')}</Tag>
                  <LangTags langs={model.pending} />
                </div>
              ) : null}
              {model.missing.length ? (
                <div className={styles.stateLine}>
                  <Tag color="warning">{copy('missing')}</Tag>
                  <LangTags langs={model.missing} />
                </div>
              ) : null}
              {model.failed.map((item) => (
                <div className={styles.assetRow} key={`failed:${item.lang}`}>
                  <Tag>{item.lang}</Tag>
                  <div className={styles.assetMain}>
                    <Tag color="error" style={{ alignSelf: 'flex-start' }}>
                      {copy('failed')}
                    </Tag>
                    {item.error ? (
                      <p className={styles.preview}>{item.error}</p>
                    ) : null}
                  </div>
                  <Button
                    loading={actions.isMutating}
                    onClick={() => void dispatch(capability, [item.lang], true)}
                    size="small"
                  >
                    {copy('retry')}
                  </Button>
                </div>
              ))}
              {model.assets.map((row) => {
                const locked =
                  capability === 'translation' && lockedLangs.includes(row.lang)
                return (
                  <div className={styles.assetRow} key={row.id}>
                    <Tag>{row.lang}</Tag>
                    <div className={styles.assetMain}>
                      <div className={styles.langLine}>
                        {row.stale ? (
                          <Tag color="warning">{copy('stale')}</Tag>
                        ) : null}
                        {locked ? (
                          <Tag color="gold">{copy('locked')}</Tag>
                        ) : null}
                        <Tooltip title={format.dateTime(row.createdAt)}>
                          <span className={styles.time}>
                            {format.relativeTime(row.createdAt)}
                          </span>
                        </Tooltip>
                      </div>
                      <p className={styles.preview}>
                        {row.preview || copy('emptyValue')}
                      </p>
                    </div>
                    <Flexbox gap={2} horizontal>
                      <ActionIcon
                        aria-label={copy('view')}
                        icon={ArrowUpRight}
                        onClick={() =>
                          navigate(
                            `${CAPABILITY_PATH[capability]}/${props.refId}?item=${row.id}`,
                          )
                        }
                        size="small"
                        title={copy('view')}
                      />
                      <ActionIcon
                        aria-label={copy('regenerate')}
                        icon={RefreshCw}
                        onClick={() =>
                          void dispatch(capability, [row.lang], true)
                        }
                        size="small"
                        title={copy('regenerate')}
                      />
                      <ActionIcon
                        aria-label={copy('delete')}
                        icon={Trash2}
                        onClick={() => removeAsset(row)}
                        size="small"
                        title={copy('delete')}
                      />
                    </Flexbox>
                  </div>
                )
              })}
              {!model.assets.length &&
              !model.fillable.length &&
              !model.pending.length ? (
                <div className={styles.stateLine}>
                  <Text type="secondary">{copy('sectionEmpty')}</Text>
                  <Button
                    loading={actions.isMutating}
                    onClick={() => void dispatch(capability, undefined, false)}
                    size="small"
                  >
                    {copy('generateKind', { kind: copy(KIND[capability]) })}
                  </Button>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </DetailPane>
    </DetailDrawer>
  )
}

function LangTags(props: { langs: string[] }) {
  return (
    <>
      {props.langs.map((lang) => (
        <Tag key={lang} size="small">
          {lang}
        </Tag>
      ))}
    </>
  )
}
