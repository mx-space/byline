import {
  Avatar,
  DraggablePanel,
  Drawer,
  ScrollArea,
  Skeleton,
  Tag,
  TextArea,
  Tooltip,
} from '@lobehub/ui'
import {
  Bot,
  ChevronLeft,
  History,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { usePostScheduled } from '~/hooks/use-post-scheduled'
import { useI18n } from '~/i18n'
import { useWriteTopbarSlots } from '~/layouts/write-topbar-slots'
import type { DraftModel } from '~/models/draft'
import { FormSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'
import { EditorToolbarSlotContext } from '~/vendor/rich-editor/components/toolbar-slot'

import { writeCopy } from '../../copy'
import { writeChromeStyles as styles } from './styles'
import {
  type SettingsView,
  WriteMetaFields,
  type WriteMetaFieldsProps,
} from './WriteMetaFields'

export type WriteDockTone =
  | 'fresh'
  | 'matchesLive'
  | 'needContent'
  | 'offline'
  | 'publishing'
  | 'saved'
  | 'saving'
  | 'submitted'
  | 'unsaved'

const PANEL_STORAGE_KEY = 'byline.write.settingsPanel'

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

export function WriteChrome(
  props: {
    draft?: DraftModel
    editor: ReactNode
    notices: ReactNode
    onCloseAi: () => void
    onCloseMeta: () => void
    onCloseRevisions: () => void
    onOpenAi: () => void
    onOpenMeta: () => void
    onOpenRevisions: () => void
    onPublish: () => void
    onRetryLoad: () => void
    onSave: () => void
    onViewTask: () => void
    peers?: ReactNode
    phase: 'error' | 'loading' | 'ready'
    publishDisabled: boolean
    publishLabel: string
    publishing: boolean
    revisions: ReactNode
    revisionsOpen: boolean
    aiOpen: boolean
    metaOpen: boolean
    saveDisabled: boolean
    saving: boolean
    savingDraft: boolean
    showViewTask: boolean
    title: string
    tone: WriteDockTone
    published: boolean
  } & Omit<WriteMetaFieldsProps, 'onViewChange' | 'view'>,
) {
  const { format, locale, t } = useI18n()
  const scheduled = usePostScheduled({
    isPublished: props.published,
    publicAt: props.publishedPublicAt,
  })
  const topbarSlots = useWriteTopbarSlots()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const [panelOpen, setPanelOpen] = useState(readPanelOpen)
  const [settingsView, setSettingsView] = useState<SettingsView>('main')
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    setSettingsView('main')
  }, [props.draftId])
  const pageTitle = props.values.title.trim()
  useEffect(() => {
    topbarSlots.setPageTitle(pageTitle || null)
    return () => topbarSlots.setPageTitle(null)
  }, [pageTitle, topbarSlots.setPageTitle])
  const copy = (
    key: Parameters<typeof writeCopy>[1],
    values?: Record<string, number | string>,
  ) => writeCopy(locale, key, values)

  const togglePanel = () => {
    if (!isDesktop) {
      props.onOpenMeta()
      return
    }
    setPanelOpen((open) => {
      const next = !open
      rememberPanelOpen(next)
      return next
    })
  }

  const revisionLabel = t('write.timeline.title')
  const savedAt = props.draft?.updatedAt ?? props.draft?.createdAt
  const saveState: { detail?: string; label: string } | null =
    props.tone === 'publishing'
      ? { detail: copy('publishing'), label: copy('publishingShort') }
      : props.tone === 'saving'
        ? { label: copy('saving') }
        : props.tone === 'unsaved'
          ? { label: copy('unsavedChanges') }
          : props.tone === 'submitted'
            ? { detail: copy('submitted'), label: copy('submittedShort') }
            : props.tone === 'matchesLive'
              ? {
                  detail: copy('matchesLive'),
                  label: copy('matchesLiveShort'),
                }
              : props.tone === 'saved' && savedAt
                ? {
                    detail: format.dateTime(savedAt),
                    label: copy('savedAt', {
                      time: format.relativeTime(savedAt),
                    }),
                  }
                : props.tone === 'needContent'
                  ? { label: copy('needContent') }
                  : null

  const authorsById = new Map(
    props.authorCandidates.map((author) => [author.id, author]),
  )
  const authors = props.values.authors
    .map((id) => authorsById.get(id))
    .filter((author) => author !== undefined)
  const categoryName = props.categories.find(
    (category) => category.id === props.values.categoryId,
  )?.name

  const settingsSectionTitle =
    settingsView === 'cover'
      ? copy('sectionCover')
      : settingsView === 'seo'
        ? copy('sectionSeo')
        : settingsView === 'advanced'
          ? copy('sectionAdvanced')
          : null
  const settingsHeader = settingsSectionTitle ? (
    <button
      aria-label={`${copy('backToSettings')} ${settingsSectionTitle}`}
      className={styles.panelHeaderBack}
      onClick={() => setSettingsView('main')}
      type="button"
    >
      <ChevronLeft aria-hidden size={18} />
      {settingsSectionTitle}
    </button>
  ) : (
    <span>{copy('settings')}</span>
  )

  const settings =
    props.phase === 'ready' ? (
      <WriteMetaFields
        {...props}
        onViewChange={setSettingsView}
        view={settingsView}
      />
    ) : props.phase === 'loading' ? (
      <div className={styles.settings}>
        <FormSkeleton rows={6} />
      </div>
    ) : null

  const panelVisible = isDesktop && panelOpen

  const identity = (
    <>
      <Tag
        color={scheduled ? 'warning' : props.published ? 'success' : undefined}
      >
        {scheduled
          ? copy('scheduled')
          : props.published
            ? copy('published')
            : copy('draft')}
      </Tag>
      {saveState ? (
        <Tooltip title={saveState.detail}>
          <span
            aria-live="polite"
            className={styles.saveState}
            data-tone={props.tone}
          >
            {saveState.label}
          </span>
        </Tooltip>
      ) : null}
      {props.showViewTask ? (
        <Button
          htmlType="button"
          onClick={props.onViewTask}
          size="small"
          type="text"
        >
          {copy('viewTask')}
        </Button>
      ) : null}
    </>
  )
  const actions = (
    <div className={styles.barActions}>
      {props.peers}
      <Button
        aria-label={revisionLabel}
        icon={History}
        onClick={props.onOpenRevisions}
        title={revisionLabel}
        type="text"
      />
      <Button
        aria-label={props.aiOpen ? copy('closeAi') : copy('openAi')}
        icon={Bot}
        onClick={props.aiOpen ? props.onCloseAi : props.onOpenAi}
        title={props.aiOpen ? copy('closeAi') : copy('openAi')}
        type="text"
      />
      <Button
        aria-label={panelVisible ? copy('hideSettings') : copy('showSettings')}
        icon={panelVisible ? PanelRightClose : PanelRightOpen}
        onClick={togglePanel}
        title={panelVisible ? copy('hideSettings') : copy('showSettings')}
        type="text"
      />
      <span aria-hidden className={styles.barDivider} />
      {isDesktop ? (
        <Button
          disabled={props.saveDisabled}
          htmlType="button"
          loading={props.saving}
          onClick={props.onSave}
          shape="round"
          type="fill"
        >
          {copy('save')}
        </Button>
      ) : null}
      <Button
        disabled={props.publishDisabled}
        htmlType="button"
        loading={props.publishing}
        onClick={props.onPublish}
        shape="round"
        type="primary"
      >
        {props.publishLabel}
      </Button>
    </div>
  )

  return (
    <div className={styles.root}>
      {topbarSlots.identity
        ? createPortal(identity, topbarSlots.identity)
        : null}
      {topbarSlots.actions ? createPortal(actions, topbarSlots.actions) : null}

      <div className={styles.body}>
        <div className={styles.editor}>
          <div className={styles.toolbarSlot} ref={setToolbarSlot} />
          <div className={styles.canvas}>
            {props.phase === 'loading' ? (
              <div className={styles.editorFallback}>
                <Skeleton height={44} width="60%" />
                <Skeleton.Text
                  rows={8}
                  width={[
                    '100%',
                    '96%',
                    '88%',
                    '94%',
                    '72%',
                    '90%',
                    '64%',
                    '40%',
                  ]}
                />
              </div>
            ) : props.phase === 'error' ? (
              <div className={styles.column}>
                <div className={styles.notices}>
                  <span>{copy('loadFailed')}</span>
                  <Button htmlType="button" onClick={props.onRetryLoad}>
                    {copy('retry')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.column}>
                  {props.notices ? (
                    <div className={styles.notices}>{props.notices}</div>
                  ) : null}
                  <TextArea
                    aria-label={copy('title')}
                    autoSize
                    className={styles.title}
                    onChange={(event) =>
                      props.updateField('title', event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.preventDefault()
                    }}
                    placeholder={copy('titlePlaceholder')}
                    value={props.values.title}
                    variant="borderless"
                  />
                  <button
                    className={styles.meta}
                    onClick={togglePanel}
                    type="button"
                  >
                    {authors.length > 0 ? (
                      <>
                        {authors.slice(0, 3).map((author) => (
                          <Avatar
                            alt={author.displayName}
                            avatar={
                              author.avatar ||
                              author.displayName.slice(0, 1).toUpperCase()
                            }
                            key={author.id}
                            size={22}
                          />
                        ))}
                        <span>
                          {authors
                            .map((author) => author.displayName)
                            .join('、')}
                        </span>
                      </>
                    ) : (
                      <span>{copy('noByline')}</span>
                    )}
                    <span aria-hidden>·</span>
                    <span>{categoryName ?? copy('categoryPlaceholder')}</span>
                    <span aria-hidden>·</span>
                    <span className={styles.metaPath}>{props.slugPath}</span>
                  </button>
                </div>
                <EditorToolbarSlotContext.Provider value={toolbarSlot}>
                  {props.editor}
                </EditorToolbarSlotContext.Provider>
              </>
            )}
          </div>
        </div>
        {isDesktop ? (
          <DraggablePanel
            aria-label={copy('settings')}
            className={styles.panel}
            classNames={{ content: styles.panelBody }}
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
            <div className={styles.panelHeader}>{settingsHeader}</div>
            <ScrollArea
              className={styles.panelScroll}
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
          onClose={props.onCloseMeta}
          open={props.metaOpen}
          placement="right"
          title={settingsHeader}
          width="100%"
        >
          <div className={styles.drawerBody}>{settings}</div>
        </Drawer>
      )}

      <Drawer
        classNames={{ bodyContent: styles.drawerBody }}
        onClose={props.onCloseRevisions}
        open={props.revisionsOpen}
        placement="right"
        title={t('write.timeline.title')}
        width={isDesktop ? 420 : '100%'}
      >
        {props.revisionsOpen ? props.revisions : null}
      </Drawer>
    </div>
  )
}
