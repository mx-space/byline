import {
  createStaticStyles,
  DraggablePanel,
  Drawer,
  ScrollArea,
  Select,
  Skeleton,
  Tag,
  TextArea,
  toast,
} from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useSearchParams,
} from 'react-router'

import type { AITranslation } from '~/api/ai'
import { getTranslationsByRef, updateTranslation } from '~/api/ai'
import { getTags } from '~/api/categories'
import { writeChromeStyles } from '~/features/write/components/chrome/styles'
import {
  SeoFields,
  type SeoFieldsValue,
} from '~/features/write/components/PostBylineFields'
import { RichWriteSurface } from '~/features/write/components/WriteRouteViewsContent'
import { writeCopy } from '~/features/write/copy'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { useWriteTopbarSlots } from '~/layouts/write-topbar-slots'
import { adminQueryKeys } from '~/query/keys'
import { confirmDialog } from '~/ui/feedback/confirm'
import { Button } from '~/ui/site-button'
import { EditorToolbarSlotContext } from '~/vendor/rich-editor/components/toolbar-slot'

import { aiCopy, useAiCopy } from '../copy'
import { getErrorMessage } from '../utils/ai'
import { seoFromFields, seoToFields } from '../utils/translation-seo'

const PANEL_STORAGE_KEY = 'byline.write.settingsPanel'

const styles = createStaticStyles(({ css, cssVar }) => ({
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
}))

function readPanelOpen() {
  try {
    return window.localStorage.getItem(PANEL_STORAGE_KEY) !== 'closed'
  } catch {
    return true
  }
}

function rememberPanelOpen(open: boolean) {
  try {
    window.localStorage.setItem(PANEL_STORAGE_KEY, open ? 'open' : 'closed')
  } catch {
    /* storage can be blocked */
  }
}

interface TranslationDraft {
  content: string
  id: string
  seo: SeoFieldsValue
  summary: string
  tags: string[]
  title: string
}

export function TranslationWritePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('id') ?? ''
  const translationId = searchParams.get('translationId') ?? ''
  const copy = useAiCopy()
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const topbar = useWriteTopbarSlots()
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null)
  const [draft, setDraft] = useState<TranslationDraft | null>(null)
  const [seed, setSeed] = useState<TranslationDraft | null>(null)
  const [panelOpen, setPanelOpen] = useState(readPanelOpen)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsView, setSettingsView] = useState<'main' | 'seo'>('main')
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const seededId = useRef<string | null>(null)

  const query = useQuery({
    enabled: Boolean(postId),
    queryFn: async () => {
      const response = await getTranslationsByRef(postId)
      return {
        article: response.article,
        items: response.translations ?? [],
      }
    },
    queryKey: adminQueryKeys.ai.groupedByRef({
      group: 'translations',
      id: postId,
    }),
  })
  const item = useMemo(
    () => query.data?.items.find((row) => row.id === translationId) ?? null,
    [query.data, translationId],
  )
  const articleTitle = query.data?.article?.document.title ?? ''

  useEffect(() => {
    if (!item || seededId.current === item.id) return
    seededId.current = item.id
    const next = toDraft(item)
    setDraft(next)
    setSeed(next)
    setSettingsView('main')
  }, [item])

  const ready = draft?.id === item?.id && seed?.id === item?.id
  const dirty =
    ready && draft !== null && seed !== null && !sameDraft(draft, seed)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const draftRef = useRef(draft)
  draftRef.current = draft
  const seedRef = useRef(seed)
  seedRef.current = seed
  const itemRef = useRef(item)
  itemRef.current = item

  const pageHeading =
    ready && draft ? draft.title.trim() || articleTitle : articleTitle
  useDocumentTitle(pageHeading || undefined)
  useEffect(() => {
    topbar.setPageTitle(pageHeading || null)
    return () => topbar.setPageTitle(null)
  }, [pageHeading, topbar.setPageTitle])

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.groupedRoot('translations'),
      }),
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.overviewArticle(postId),
      }),
    ])
  }

  const save = useMutation({
    mutationFn: async () => {
      const current = draftRef.current
      const origin = seedRef.current
      const currentItem = itemRef.current
      if (!current || !origin || !currentItem) return null
      const snapshot = current
      return {
        snapshot,
        saved: await updateTranslation(currentItem.id, {
          seo: seoFromFields(current.seo),
          summary: current.summary,
          tags: current.tags,
          title: current.title,
          ...(sameContent(current.content, origin.content)
            ? {}
            : { content: current.content }),
        }),
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('saveFailed'))),
    onSuccess: async (result) => {
      if (!result) return
      setSeed(result.snapshot)
      toast.success(copy('saved'))
      await refresh()
    },
  })

  const lock = useMutation({
    mutationFn: async () => {
      const current = itemRef.current
      if (!current) return null
      return updateTranslation(current.id, { isLocked: !current.isLocked })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('saveFailed'))),
    onSuccess: () => refresh(),
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

  const update = (patch: Partial<Omit<TranslationDraft, 'id'>>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  if (!postId || (query.isSuccess && !item)) {
    return (
      <WriteFrame>
        <div className={styles.message}>
          <p>{copy('translationMissingTitle')}</p>
        </div>
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

  if (!ready || !draft || !item) {
    return (
      <WriteFrame>
        <div className={styles.message}>
          <Skeleton.Text
            rows={6}
            width={['48%', '32%', '100%', '96%', '88%', '70%']}
          />
        </div>
      </WriteFrame>
    )
  }

  const locked = Boolean(item.isLocked)
  const panelVisible = isDesktop && panelOpen
  const settingsLabel = writeCopy(locale, 'settings')
  const settingsHeader =
    settingsView === 'seo' ? (
      <button
        aria-label={`${writeCopy(locale, 'backToSettings')} ${writeCopy(locale, 'sectionSeo')}`}
        className={writeChromeStyles.panelHeaderBack}
        onClick={() => setSettingsView('main')}
        type="button"
      >
        <ChevronLeft aria-hidden size={18} />
        {writeCopy(locale, 'sectionSeo')}
      </button>
    ) : (
      <span>{settingsLabel}</span>
    )
  const settings = (
    <TranslationSettings
      draft={draft}
      onChange={update}
      onOpenSeo={() => setSettingsView('seo')}
      view={settingsView}
    />
  )
  const togglePanel = () => {
    if (!isDesktop) {
      setDrawerOpen(true)
      return
    }
    setPanelOpen((open) => {
      const next = !open
      rememberPanelOpen(next)
      return next
    })
  }
  const identity = (
    <>
      <Tag>
        {copy('translationPair', { from: item.sourceLang, to: item.lang })}
      </Tag>
      {locked ? <Tag color="gold">{copy('locked')}</Tag> : null}
      {dirty ? <span className={styles.status}>{copy('unsaved')}</span> : null}
    </>
  )
  const bar = (
    <div className={writeChromeStyles.barActions}>
      <Button
        aria-label={copy(locked ? 'unlockTranslation' : 'lockTranslation')}
        disabled={lock.isPending}
        htmlType="button"
        icon={locked ? LockOpen : Lock}
        onClick={() => lock.mutate()}
        title={copy(locked ? 'unlockTranslation' : 'lockTranslation')}
        type="text"
      />
      <Button
        aria-label={
          panelVisible
            ? writeCopy(locale, 'hideSettings')
            : writeCopy(locale, 'showSettings')
        }
        htmlType="button"
        icon={panelVisible ? PanelRightClose : PanelRightOpen}
        onClick={togglePanel}
        title={
          panelVisible
            ? writeCopy(locale, 'hideSettings')
            : writeCopy(locale, 'showSettings')
        }
        type="text"
      />
      <span aria-hidden className={writeChromeStyles.barDivider} />
      <Button
        htmlType="button"
        onClick={() =>
          navigate(
            `/posts/edit?${new URLSearchParams({ id: postId }).toString()}`,
          )
        }
        type="fill"
      >
        {copy('viewOriginal')}
      </Button>
      <Button
        disabled={!dirty}
        htmlType="button"
        loading={save.isPending}
        onClick={() => save.mutate()}
        type="primary"
      >
        {copy('saveTranslation')}
      </Button>
    </div>
  )

  return (
    <div className={writeChromeStyles.root}>
      {topbar.identity ? createPortal(identity, topbar.identity) : null}
      {topbar.actions ? createPortal(bar, topbar.actions) : null}
      <div className={writeChromeStyles.body}>
        <div className={writeChromeStyles.editor}>
          <div className={writeChromeStyles.toolbarSlot} ref={setToolbarSlot} />
          <EditorToolbarSlotContext.Provider value={toolbarSlot}>
            <div className={writeChromeStyles.canvas}>
              <div className={writeChromeStyles.column}>
                <TextArea
                  aria-label={copy('fieldTitle')}
                  autoSize
                  className={writeChromeStyles.title}
                  onChange={(event) => update({ title: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault()
                  }}
                  placeholder={copy('fieldTitle')}
                  value={draft.title}
                  variant="borderless"
                />
              </div>
              <RichWriteSurface
                autoFocus={false}
                content={draft.content}
                key={item.id}
                kind="post"
                onContentChange={(content) => update({ content })}
                onTextChange={() => undefined}
                refId={postId}
              />
            </div>
          </EditorToolbarSlotContext.Provider>
        </div>
        {isDesktop ? (
          <DraggablePanel
            aria-label={settingsLabel}
            className={writeChromeStyles.panel}
            classNames={{ content: writeChromeStyles.panelBody }}
            defaultSize={{ width: 340 }}
            expand={panelOpen}
            maxWidth={520}
            minWidth={280}
            mode="fixed"
            onExpandChange={(expand) => {
              setPanelOpen(expand)
              rememberPanelOpen(expand)
            }}
            placement="right"
            showHandleWhenCollapsed
          >
            <div className={writeChromeStyles.panelHeader}>
              {settingsHeader}
            </div>
            <ScrollArea
              className={writeChromeStyles.panelScroll}
              contentProps={{ style: { minHeight: '100%' } }}
              disableContentFit
              scrollFade
            >
              {settings}
            </ScrollArea>
          </DraggablePanel>
        ) : null}
      </div>
      {isDesktop ? null : (
        <Drawer
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          placement="right"
          title={settingsHeader}
          width="100%"
        >
          <div className={writeChromeStyles.drawerBody}>{settings}</div>
        </Drawer>
      )}
    </div>
  )
}

function TranslationSettings(props: {
  draft: TranslationDraft
  onChange: (patch: Partial<Omit<TranslationDraft, 'id'>>) => void
  onOpenSeo: () => void
  view: 'main' | 'seo'
}) {
  const copy = useAiCopy()
  const { locale } = useI18n()
  if (props.view === 'seo') {
    return (
      <div className={writeChromeStyles.settings}>
        <div className={writeChromeStyles.section}>
          <SeoFields
            fallbackDescription={props.draft.summary}
            onChange={(key, value) =>
              props.onChange({ seo: { ...props.draft.seo, [key]: value } })
            }
            titlePlaceholder={props.draft.title}
            value={props.draft.seo}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={writeChromeStyles.settings}>
      <div className={writeChromeStyles.section}>
        <label
          className={writeChromeStyles.field}
          htmlFor="translation-summary"
        >
          <span className={writeChromeStyles.fieldLabel}>
            {copy('fieldSummary')}
          </span>
          <TextArea
            autoSize={{ maxRows: 4, minRows: 2 }}
            id="translation-summary"
            onChange={(event) =>
              props.onChange({ summary: event.target.value })
            }
            value={props.draft.summary}
          />
        </label>
        <div className={writeChromeStyles.field}>
          <span className={writeChromeStyles.fieldLabel}>
            {writeCopy(locale, 'tags')}
          </span>
          <TagSelect
            onChange={(tags) => props.onChange({ tags })}
            value={props.draft.tags}
          />
        </div>
      </div>
      <button
        className={writeChromeStyles.drill}
        onClick={props.onOpenSeo}
        type="button"
      >
        <Search aria-hidden size={16} />
        <span className={writeChromeStyles.drillLabel}>
          {writeCopy(locale, 'sectionSeo')}
        </span>
        <span className={writeChromeStyles.drillValue}>
          {hasSeo(props.draft.seo)
            ? writeCopy(locale, 'configured')
            : writeCopy(locale, 'notConfigured')}
        </span>
        <ChevronRight aria-hidden size={16} />
      </button>
    </div>
  )
}

function TagSelect(props: {
  onChange: (tags: string[]) => void
  value: string[]
}) {
  const { locale } = useI18n()
  const tagsQuery = useQuery({
    queryFn: getTags,
    queryKey: adminQueryKeys.categories.tags(),
  })
  const known = new Set((tagsQuery.data ?? []).map((tag) => tag.name))
  const options = [
    ...(tagsQuery.data ?? []).map((tag) => ({
      label: tag.name,
      title: String(tag.count),
      value: tag.name,
    })),
    ...props.value
      .filter((tag) => !known.has(tag))
      .map((tag) => ({ label: tag, title: '0', value: tag })),
  ]

  return (
    <Select
      aria-label={writeCopy(locale, 'tags')}
      classNames={{ trigger: writeChromeStyles.tagTrigger }}
      mode="tags"
      onChange={(value) => props.onChange(value as string[])}
      optionRender={(option) => (
        <span>
          {option.label}{' '}
          <span className={writeChromeStyles.tagOption}>{option.title}</span>
        </span>
      )}
      options={options}
      placeholder={writeCopy(locale, 'tagsPlaceholder')}
      tokenSeparators={[',', '，']}
      value={props.value}
    />
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

function toDraft(item: AITranslation): TranslationDraft {
  return {
    content: editorContent(item),
    id: item.id,
    seo: seoToFields(item.seo),
    summary: item.summary ?? '',
    tags: item.tags ?? [],
    title: item.title ?? '',
  }
}

function hasSeo(seo: SeoFieldsValue) {
  return Boolean(
    seo.seoTitle.trim() || seo.seoDescription.trim() || seo.seoImage.trim(),
  )
}

function sameTags(a: string[], b: string[]) {
  return a.length === b.length && a.every((tag, index) => tag === b[index])
}

function sameDraft(a: TranslationDraft, b: TranslationDraft) {
  return (
    a.title === b.title &&
    a.summary === b.summary &&
    sameTags(a.tags, b.tags) &&
    sameContent(a.content, b.content) &&
    a.seo.seoTitle === b.seo.seoTitle &&
    a.seo.seoDescription === b.seo.seoDescription &&
    a.seo.seoImage === b.seo.seoImage
  )
}

function sameContent(a: string, b: string) {
  if (a === b) return true
  try {
    return (
      JSON.stringify(canonicalize(JSON.parse(a))) ===
      JSON.stringify(canonicalize(JSON.parse(b)))
    )
  } catch {
    return false
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    )
  }
  return value
}

function editorContent(item: AITranslation) {
  const raw = item.content?.trim() ?? ''
  if (raw && isLexical(raw)) return raw
  return textToLexical(item.text ?? '')
}

function isLexical(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { root?: unknown }
    return Boolean(parsed && typeof parsed === 'object' && parsed.root)
  } catch {
    return false
  }
}

// Markdown-only translations have no Lexical document; the editor needs one.
function textToLexical(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
  const paragraphs = blocks.length ? blocks : ['']
  return JSON.stringify({
    root: {
      children: paragraphs.map((paragraph) => ({
        children: paragraph
          ? [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: paragraph,
                type: 'text',
                version: 1,
              },
            ]
          : [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  })
}
