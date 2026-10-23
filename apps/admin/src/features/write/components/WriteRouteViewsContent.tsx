import { projectAgentDiffNodesToFactualState } from '@haklex/rich-ext-ai-agent/static'
import { createMxLitexmlRegistry, mxLexicalToMarkdown } from '@mx-space/editor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SerializedEditorState } from 'lexical'
import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Braces,
  Clock,
  FileText,
  GitBranch,
  History,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Search,
  Send,
  SlidersHorizontal,
  Users,
  WandSparkles,
} from 'lucide-react'
import type {
  ComponentProps,
  CSSProperties,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
} from 'react'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useSearchParams,
} from 'react-router'
import { toast } from 'sonner'

import { AiQueryType, getTranslationsByRef, writerGenerate } from '~/api/ai'
import { getCategories, getTags } from '~/api/categories'
import type { DraftWriteData } from '~/api/drafts'
import {
  compareRevisions,
  createDraft,
  deleteDraft,
  getDraftById,
  getDraftContext,
  getNewDrafts,
  getRevision,
  updateDraft,
} from '~/api/drafts'
import { uploadFile, uploadFileWithProgress } from '~/api/files'
import { ApiRequestError } from '~/api/http'
import { getOption } from '~/api/options'
import { getPostById } from '~/api/posts'
import type { PublishAiResourceRequest, PublishTask } from '~/api/publish-jobs'
import { createPublishJob } from '~/api/publish-jobs'
import { AITaskStatus, getTask } from '~/api/tasks'
import { getMe, getUsers } from '~/api/users'
import { API_URL, WEB_URL } from '~/constants/env'
import {
  APP_SHELL_HEADER_HEIGHT_CLASS,
  APP_SHELL_HEADER_HEIGHT_VALUE,
} from '~/constants/layout'
import {
  useCollectionDetailQuery,
  useCollectionListQuery,
  useEntity,
  useEntityList,
} from '~/data/resource/hooks'
import { serializeListKey } from '~/data/resource/key'
import type { CategoryEntity } from '~/data/resources/category'
import { categories as categoriesCollection } from '~/data/resources/category'
import { posts as postsCollection } from '~/data/resources/post'
import { publishPost } from '~/data/resources/post.mutations'
import { DraftStatusTag } from '~/features/drafts/components/draft-status-tag'
import type { AIConfig } from '~/features/settings/types/settings'
import { useTaskDetailSubscription } from '~/features/tasks/hooks/useTaskSubscription'
import { hasPermission, Permission } from '~/features/users/utils/permissions'
import { AgentPanel, useWriteAgent } from '~/features/write/components/agent'
import { CoverGenerationEntry } from '~/features/write/components/cover-generation/CoverGenerationEntry'
import { DraftConflictBanner } from '~/features/write/components/DraftConflictBanner'
import { DraftConflictDialog } from '~/features/write/components/DraftConflictDialog'
import { DraftHintBanner } from '~/features/write/components/DraftHintBanner'
import {
  DraftRecoveryReview,
  type DraftRecoveryReviewData,
} from '~/features/write/components/DraftRecoveryReview'
import {
  AuthorsPicker,
  SeoFields,
  SourceLangField,
} from '~/features/write/components/PostBylineFields'
import {
  normalizeTaskAiResources,
  publishAiResourceLabels,
} from '~/features/write/components/publish-ai-choices'
import { PublishConfirmationDialog } from '~/features/write/components/PublishConfirmationDialog'
import { openPublishProcessDock } from '~/features/write/components/PublishProcessDock'
import { TtsGenerationEntry } from '~/features/write/components/tts/TtsGenerationEntry'
import { VersionTreePanel } from '~/features/write/components/VersionTreePanel'
import { MetaPresetSection } from '~/features/write/meta-presets'
import { draftFingerprint } from '~/features/write/utils/draft-fingerprint'
import type { DraftMergeConflict } from '~/features/write/utils/merge-draft-conflict'
import { mergeDraftConflict } from '~/features/write/utils/merge-draft-conflict'
import type { PostBylineState } from '~/features/write/utils/post-byline-state'
import {
  emptyPostBylineState,
  postBylineFromModel,
  postBylineFromSpecific,
  postBylineToSpecific,
} from '~/features/write/utils/post-byline-state'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { translate } from '~/i18n/translate'
import type { TranslationKey } from '~/i18n/types'
import type { Image as ImageModel } from '~/models/base'
import type {
  DraftModel,
  RevisionSnapshot,
  VersionTreeNode,
} from '~/models/draft'
import { DraftRefType } from '~/models/draft'
import type { PostModel } from '~/models/post'
import { adminQueryKeys } from '~/query/keys'
import { subscribeDraftUpdate } from '~/socket/draft-update-signal'
import type { DraftUpdatePayload } from '~/socket/types'
import { confirmDialog } from '~/ui/feedback/confirm'
import {
  AsidePanel,
  ContentLayout,
  ContentLayoutSlot,
} from '~/ui/layout/content-layout'
import { HeaderBackButton } from '~/ui/layout/header-back-button'
import { Popover } from '~/ui/overlay/popover'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { FormSwitch } from '~/ui/primitives/switch'
import { TextArea, TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'
import type {
  RichEditorWithAgentProps,
  RichEditorWithAgentRef,
} from '~/vendor/rich-editor/components/RichEditorWithAgent'
import { buildDocumentBashSystemMessages } from '~/vendor/rich-editor/utils/document-bash'
import { useDynamicCatalogSystemMessages } from '~/vendor/rich-editor/utils/dynamic-catalog'
import { buildImageTools } from '~/vendor/rich-editor/utils/image-tools'
import type { MetaFieldsSchema } from '~/vendor/rich-editor/utils/meta-tools'
import {
  buildMetaSystemMessages,
  buildMetaTools,
} from '~/vendor/rich-editor/utils/meta-tools'

type WriteKind = 'post'

interface WriteFormState extends PostBylineState {
  categoryId: string
  content: string
  images: NonNullable<RevisionSnapshot['images']>
  meta: Record<string, unknown>
  pin: boolean
  pinOrder: string
  slug: string
  summary: string
  tags: string
  text: string
  title: string
}

interface DraftSaveVariables {
  baseDraft: DraftModel | null
  data: DraftWriteData
  draftId: string
  explicit?: boolean
  fingerprint: string
}

interface ActiveDraftConflict {
  conflicts: DraftMergeConflict[]
  remote: DraftModel
}

const emptyState: WriteFormState = {
  ...emptyPostBylineState,
  categoryId: '',
  content: '',
  images: [],
  meta: {},
  pin: false,
  pinOrder: '1',
  slug: '',
  summary: '',
  tags: '',
  text: '',
  title: '',
}

const RichEditorWithAgent = lazy(() =>
  import('~/vendor/rich-editor/components/RichEditorWithAgent').then(
    (module) => ({
      default: module.RichEditorWithAgent,
    }),
  ),
)

const POST_META_SCHEMA: MetaFieldsSchema = {
  title: { description: 'Post title', type: 'string' },
  slug: {
    description:
      'URL path segment; prefer lowercase English words joined with hyphens.',
    example: 'my-first-post',
    type: 'string',
  },
  tags: { description: 'Post tag list', type: 'string[]' },
  summary: {
    description: 'Post summary; leave empty to auto-generate.',
    type: 'string',
  },
  seoTitle: {
    description:
      'SEO title for search engines; leave empty to use the post title.',
    type: 'string',
  },
  seoDescription: {
    description: 'SEO meta description, about 150 characters.',
    type: 'string',
  },
  pin: { description: 'Whether the post is pinned', type: 'boolean' },
  pinOrder: {
    description:
      'Pin order; higher numbers float to the top; set to 0 when pin is off.',
    type: 'number',
  },
}

const POST_LIST_PATH = '/posts'

export function PostWritePageContent() {
  return <WritePageRoute kind="post" />
}

function WritePageRoute(props: { kind: WriteKind }) {
  const [searchParams] = useSearchParams()
  const documentId = searchParams.get('id') || 'new'

  return <WritePage key={`${props.kind}:${documentId}`} kind={props.kind} />
}

function useDraftSession(options: {
  baseRevisionId: string | null
  data: DraftWriteData
  fingerprint: string
  hasContent: boolean
  id: string
  isEditing: boolean
  isPublished: boolean
  kind: WriteKind
  routeDraftId: string
  state: WriteFormState
  setState: Dispatch<SetStateAction<WriteFormState>>
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [draftId, setDraftId] = useState('')
  const dirtyRef = useRef(false)
  const acceptedFingerprintRef = useRef('')
  const acceptedDraftRef = useRef<DraftModel | null>(null)
  const latestDataRef = useRef(options.data)
  const latestFingerprintRef = useRef(options.fingerprint)
  const autosaveTimerRef = useRef<number | null>(null)
  const [acceptedFingerprint, setAcceptedFingerprint] = useState('')
  const [remoteUpdateStale, setRemoteUpdateStale] = useState(false)
  const [conflict, setConflict] = useState<ActiveDraftConflict | null>(null)
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [resolvingConflict, setResolvingConflict] = useState(false)

  useEffect(() => {
    latestDataRef.current = options.data
    latestFingerprintRef.current = options.fingerprint
  }, [options.data, options.fingerprint])

  const hasUnsavedChanges = useCallback(
    () =>
      dirtyRef.current &&
      options.hasContent &&
      latestFingerprintRef.current !== acceptedFingerprintRef.current,
    [options.hasContent],
  )

  const accept = useCallback(
    (
      draft: DraftModel | null,
      fingerprint: string,
      settings?: {
        dirty?: boolean
        draftId?: string
        preserveLatest?: boolean
      },
    ) => {
      acceptedDraftRef.current = draft
      acceptedFingerprintRef.current = fingerprint
      if (!settings?.preserveLatest) {
        latestFingerprintRef.current = fingerprint
      }
      dirtyRef.current = Boolean(settings?.dirty)
      setAcceptedFingerprint(fingerprint)
      if (settings?.draftId !== undefined) setDraftId(settings.draftId)
    },
    [],
  )

  const markDirty = useCallback((dirty = true) => {
    dirtyRef.current = dirty
  }, [])

  /**
   * Reconcile a head that moved while we were looking at it: fetch the current
   * remote head and merge it into the local content. Both the save-conflict
   * handler (DRAFT_HEAD_CONFLICT) and the realtime `draft.update` banner go
   * through here, so a merge behaves identically however it was triggered.
   */
  const reconcileWithRemote = useCallback(
    async (input: { base: DraftModel | null; remoteId: string }) => {
      const remote = await getDraftById(input.remoteId)
      const local = latestDataRef.current
      acceptedDraftRef.current = remote
      setDraftId(remote.id)

      if (!input.base) {
        setConflict({
          conflicts: [
            {
              base: null,
              kind: 'field',
              local,
              path: 'draft',
              remote,
            },
          ],
          remote,
        })
        dirtyRef.current = true
        return
      }

      const merged = mergeDraftConflict({
        base: input.base,
        local,
        remote,
      })
      options.setState((previous) =>
        fromRevision(options.kind, merged.data, previous),
      )
      dirtyRef.current = true

      if (merged.conflicts.length > 0) {
        setConflict({ conflicts: merged.conflicts, remote })
        toast.error(
          t('write.toast.draftConflictNeedsReview', {
            count: merged.conflicts.length,
          }),
        )
      } else {
        setConflict(null)
        toast.success(
          t('write.toast.draftAutoMerged', {
            count: merged.autoMergedChanges,
          }),
        )
      }
    },
    [options, t],
  )

  /**
   * Adopt a freshly read remote head as the editor's content, through the same
   * accept path a normal load uses. Anything unsaved is gone — callers must
   * have established that this is what the user wants.
   */
  const adoptRemoteDraft = useCallback(
    (remote: DraftModel) => {
      const nextState = fromRevision(
        options.kind,
        remote.headRevision,
        options.state,
      )
      const refId = options.isEditing ? options.id : undefined
      const fingerprint = getDraftFingerprint(options.kind, nextState, refId)
      options.setState(nextState)
      latestDataRef.current = toDraftData(options.kind, nextState, refId)
      accept(remote, fingerprint, { draftId: remote.id })
      setConflict(null)
      setRemoteUpdateStale(false)
      queryClient.setQueryData(adminQueryKeys.drafts.detail(remote.id), remote)
      toast.success(t('write.toast.draftRemoteUpdateLoaded'))
    },
    [accept, options, queryClient, t],
  )

  /**
   * Read the draft we currently have open. `force` is set only by the banner's
   * explicit "Use new version": it adopts whatever the server has, while the
   * automatic (realtime) path backs off whenever the editor moved on — a save
   * of ours in flight, a head we already hold, or edits typed while this read
   * was in flight. A save that is already in flight reconciles itself through
   * its own onSuccess/onError.
   */
  const adoptLatestRemoteDraft = useCallback(
    async (force: boolean) => {
      const remoteId = acceptedDraftRef.current?.id ?? draftId
      if (!remoteId) return

      try {
        const remote = await getDraftById(remoteId)
        if (!force) {
          // The server broadcasts the new head before the save response reaches
          // us, so our own save can land here first; the response-first order
          // is caught by the head comparison.
          if (mutationRef.current.isPending) return
          if (
            remote.headRevisionId === acceptedDraftRef.current?.headRevisionId
          )
            return
          if (hasUnsavedChanges()) {
            setRemoteUpdateStale(true)
            return
          }
        }
        adoptRemoteDraft(remote)
      } catch (error) {
        toast.error(
          getErrorMessage(error, t('write.toast.draftConflictLoadFailed')),
        )
      }
    },
    [adoptRemoteDraft, draftId, hasUnsavedChanges, t],
  )

  /**
   * "Use new version" — one click replaces the open draft with the server head.
   * Only unsaved local edits are worth a prompt; with a clean editor the click
   * is the same silent adoption the realtime path performs.
   */
  const useRemoteUpdate = useCallback(async () => {
    if (
      hasUnsavedChanges() &&
      !(await confirmDialog({
        confirmText: t('write.remoteUpdate.useNew'),
        description: t('write.remoteUpdate.confirm.description'),
        destructive: true,
        title: t('write.remoteUpdate.confirm.title'),
      }))
    ) {
      return
    }

    await adoptLatestRemoteDraft(true)
  }, [adoptLatestRemoteDraft, hasUnsavedChanges, t])

  const mergeRemoteUpdate = useCallback(async () => {
    const remoteId = acceptedDraftRef.current?.id ?? draftId
    if (!remoteId) return

    try {
      await reconcileWithRemote({ base: acceptedDraftRef.current, remoteId })
      setRemoteUpdateStale(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, t('write.toast.draftConflictLoadFailed')),
      )
    }
  }, [draftId, reconcileWithRemote, t])

  const dismissRemoteUpdate = useCallback(() => {
    setRemoteUpdateStale(false)
  }, [])

  // Realtime "this draft moved elsewhere" signal, published by SocketBridge.
  // Only the draft this page has open matters, and a payload carrying the head
  // we already adopted is our own save echoed back.
  const onRemoteUpdate = (payload: DraftUpdatePayload) => {
    const openDraft = acceptedDraftRef.current
    const currentDraftId = openDraft?.id ?? draftId
    if (!currentDraftId || payload.branchId !== currentDraftId) return
    if (payload.headRevisionId === openDraft?.headRevisionId) return

    void adoptLatestRemoteDraft(false)
  }
  // The subscription is installed once and reads the handler through a ref.
  // Depending on the handler's identity would re-subscribe on every render —
  // i.e. on every keystroke — which both costs work and briefly opens a window
  // where an update lands with no subscriber attached.
  const onRemoteUpdateRef = useRef(onRemoteUpdate)
  onRemoteUpdateRef.current = onRemoteUpdate
  useEffect(
    () => subscribeDraftUpdate((payload) => onRemoteUpdateRef.current(payload)),
    [],
  )

  const buildSaveVariables = useCallback(
    (explicit = false): DraftSaveVariables => ({
      baseDraft:
        acceptedDraftRef.current?.id === draftId
          ? acceptedDraftRef.current
          : null,
      data: options.data,
      draftId,
      explicit,
      fingerprint: latestFingerprintRef.current,
    }),
    [draftId, options.data],
  )

  const mutation = useMutation<DraftModel, unknown, DraftSaveVariables>({
    mutationFn: (variables) => {
      if (!variables.draftId) {
        return createDraft({
          baseRevisionId: options.baseRevisionId,
          data: variables.data,
          refId: options.isEditing ? options.id : undefined,
          refType: draftRefTypeByKind[options.kind],
        })
      }
      if (!variables.baseDraft) {
        throw new Error(t('write.toast.draftBaselineMissing'))
      }
      return updateDraft(variables.draftId, {
        data: variables.data,
        expectedHeadRevisionId: variables.baseDraft.headRevisionId,
      })
    },
    onError: (error, variables) => {
      if (
        !(error instanceof ApiRequestError) ||
        error.code !== 'DRAFT_HEAD_CONFLICT'
      ) {
        toast.error(getErrorMessage(error, t('write.toast.draftSaveFailed')))
        return
      }

      setResolvingConflict(true)
      void (async () => {
        try {
          const errorDraftId =
            typeof error.details?.id === 'string' ? error.details.id : ''
          const remoteId = variables.draftId || errorDraftId
          if (!remoteId) {
            toast.error(t('write.toast.draftConflictLoadFailed'))
            return
          }

          await reconcileWithRemote({
            base: variables.baseDraft,
            remoteId,
          })
          setRemoteUpdateStale(false)
        } catch (loadError) {
          toast.error(
            getErrorMessage(
              loadError,
              t('write.toast.draftConflictLoadFailed'),
            ),
          )
        } finally {
          setResolvingConflict(false)
        }
      })()
    },
    onSuccess: async (draft, variables) => {
      const isFirstDraftSave = !variables.draftId
      acceptedDraftRef.current = draft
      setDraftId(draft.id)
      setConflict(null)
      acceptedFingerprintRef.current = variables.fingerprint
      setAcceptedFingerprint(variables.fingerprint)
      dirtyRef.current = latestFingerprintRef.current !== variables.fingerprint
      if (isFirstDraftSave && searchParams.get('draftId') !== draft.id) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('baseRevisionId')
        nextParams.set('draftId', draft.id)
        setSearchParams(nextParams, { replace: true })
      }
      toast.success(
        variables.explicit
          ? options.isPublished
            ? t('write.toast.publishedDraftSaved')
            : t('write.toast.unpublishedSaved')
          : t('write.toast.draftSaved'),
      )
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.drafts.root,
      })
    },
  })
  const mutationRef = useRef(mutation)
  mutationRef.current = mutation

  const saveNow = useCallback(() => {
    if (conflict || resolvingConflict) {
      toast.error(t('write.toast.draftConflictNeedsResolution'))
      return
    }
    if (!options.hasContent) {
      toast.error(t('write.toast.contentEmptyForDraft'))
      return
    }
    if (mutationRef.current.isPending) return

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    mutationRef.current.mutate(buildSaveVariables(true))
  }, [buildSaveVariables, conflict, options.hasContent, resolvingConflict, t])

  useEffect(() => {
    if (conflict || resolvingConflict || !dirtyRef.current) return
    if (!options.hasContent) return
    if (options.fingerprint === acceptedFingerprintRef.current) return

    const timer = window.setTimeout(() => {
      if (autosaveTimerRef.current === timer) autosaveTimerRef.current = null
      if (!dirtyRef.current || mutationRef.current.isPending) return
      mutationRef.current.mutate(buildSaveVariables())
    }, 10_000)
    autosaveTimerRef.current = timer

    return () => {
      window.clearTimeout(timer)
      if (autosaveTimerRef.current === timer) autosaveTimerRef.current = null
    }
  }, [
    acceptedFingerprint,
    buildSaveVariables,
    conflict,
    options.fingerprint,
    options.hasContent,
    resolvingConflict,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        saveNow()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveNow])

  const useRemoteConflictDraft = useCallback(() => {
    if (!conflict) return
    const remote = conflict.remote
    const nextState = fromRevision(
      options.kind,
      remote.headRevision,
      options.state,
    )
    const fingerprint = getDraftFingerprint(
      options.kind,
      nextState,
      options.isEditing ? options.id : undefined,
    )
    options.setState(nextState)
    accept(remote, fingerprint, { draftId: remote.id })
    setConflict(null)
    setConflictDialogOpen(false)
    toast.success(t('write.toast.draftRemoteApplied'))
  }, [accept, conflict, options, t])

  const keepLocalConflictDraft = useCallback(() => {
    if (!conflict) return
    dirtyRef.current = true
    setConflict(null)
    setConflictDialogOpen(false)
    toast.success(t('write.toast.draftLocalKept'))
  }, [conflict, t])

  return {
    accept,
    acceptedDraft: () => acceptedDraftRef.current,
    acceptedFingerprint: () => acceptedFingerprintRef.current,
    clearAcceptedDraft: (id: string) => {
      if (acceptedDraftRef.current?.id === id) acceptedDraftRef.current = null
    },
    conflict,
    conflictDialogOpen,
    dismissRemoteUpdate,
    draftId,
    getPublishInput: (currentDraftId: string) => ({
      baseline:
        acceptedDraftRef.current?.id === currentDraftId
          ? acceptedDraftRef.current
          : null,
      data: structuredClone(latestDataRef.current),
      fingerprint: latestFingerprintRef.current,
    }),
    hasUnsavedChanges,
    keepLocalConflictDraft,
    latestDraft: () => acceptedDraftRef.current ?? mutation.data,
    latestFingerprint: () => latestFingerprintRef.current,
    markDirty,
    mergeRemoteUpdate,
    mutation,
    remoteUpdateStale,
    resolvingConflict,
    saveNow,
    setConflict,
    setConflictDialogOpen,
    setDraftId,
    useRemoteConflictDraft,
    useRemoteUpdate,
  }
}

function WritePage(props: { kind: WriteKind }) {
  const { t } = useI18n()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const routeDraftId = searchParams.get('draftId') ?? ''
  const routeBaseRevisionId = searchParams.get('baseRevisionId') ?? ''
  const isEditing = Boolean(id)
  const [state, setState] = useState<WriteFormState>(emptyState)
  const [publishTaskId, setPublishTaskId] = useState<string | null>(null)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  useDocumentTitle(state.title)
  const [asidePanel, setAsidePanel] = useState<
    'agent' | 'meta' | 'drafts' | null
  >(null)
  const agentVisible = asidePanel === 'agent'
  const metaPanelOpen = asidePanel === 'meta'
  const draftsPanelOpen = asidePanel === 'drafts'
  const toggleAsidePanel = (panel: 'agent' | 'meta' | 'drafts') =>
    setAsidePanel((current) => (current === panel ? null : panel))
  const [draftListHintDismissed, setDraftListHintDismissed] = useState(false)
  const [reviewingDraft, setReviewingDraft] = useState<DraftModel | null>(null)
  const appliedRouteDraftIdRef = useRef<string | null>(null)
  const formSeededKeyRef = useRef<string | null>(null)
  const draftRefType = draftRefTypeByKind[props.kind]

  useCollectionListQuery(categoriesCollection, {
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: adminQueryKeys.categories.list(),
    toPage: (result) => ({ items: result }),
  })
  const categoriesList = useEntityList(
    categoriesCollection,
    adminQueryKeys.categories.list(),
  )
  const tagsQuery = useQuery({
    queryFn: getTags,
    queryKey: adminQueryKeys.categories.tags(),
  })
  const aiPublishOptionsQuery = useQuery({
    queryFn: () => getOption<AIConfig>('ai'),
    queryKey: adminQueryKeys.ai.publishOptions(),
    staleTime: 5 * 60_000,
  })
  const siteOptionsQuery = useQuery({
    queryFn: () => getOption<{ defaultSourceLang?: string }>('site'),
    queryKey: adminQueryKeys.settings.site(),
    staleTime: 5 * 60_000,
  })
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
    staleTime: 5 * 60_000,
  })
  const canPublish = hasPermission(
    meQuery.data?.permissions,
    Permission.PublishPost,
  )
  const authorsQuery = useQuery({
    queryFn: () => getUsers({ page: 1, size: 100, status: 'all' }),
    queryKey: adminQueryKeys.users.authors(),
    staleTime: 60_000,
  })
  const postDetailQuery = useCollectionDetailQuery(postsCollection, {
    enabled: isEditing,
    queryFn: () => getPostById(id),
    queryKey: adminQueryKeys.write.detail({ id, kind: 'post' }),
  })
  const detailModel = useEntity(postsCollection, isEditing ? id : undefined)
  const isPublished = Boolean(detailModel?.isPublished)
  const isDetailLoaded = postDetailQuery.isSuccess
  const detailLoading = postDetailQuery.isLoading
  const currentDraftData = useMemo(
    () => toDraftData(props.kind, state, isEditing ? id : undefined),
    [id, isEditing, props.kind, state],
  )
  const draftFingerprint = useMemo(
    () => getDraftFingerprint(props.kind, state, isEditing ? id : undefined),
    [id, isEditing, props.kind, state],
  )
  const hasDraftAutosaveContent =
    state.title.trim().length > 0 ||
    state.text.trim().length > 0 ||
    state.content.trim().length > 0
  const versionContextQuery = useQuery({
    enabled: isEditing,
    queryFn: () => getDraftContext(draftRefType, id),
    queryKey: adminQueryKeys.drafts.byRef({ id, refType: draftRefType }),
  })
  const branchBaseRevisionId =
    routeBaseRevisionId ||
    versionContextQuery.data?.publishedRevision?.id ||
    null
  const draftSession = useDraftSession({
    baseRevisionId: branchBaseRevisionId,
    data: currentDraftData,
    fingerprint: draftFingerprint,
    hasContent: hasDraftAutosaveContent,
    id,
    isEditing,
    isPublished,
    kind: props.kind,
    routeDraftId,
    setState,
    state,
  })
  const {
    conflict: draftConflict,
    conflictDialogOpen: draftConflictDialogOpen,
    dismissRemoteUpdate,
    draftId,
    mergeRemoteUpdate,
    mutation: draftMutation,
    remoteUpdateStale,
    resolvingConflict: draftConflictResolving,
    saveNow: saveDraftNow,
    setConflict: setDraftConflict,
    setConflictDialogOpen: setDraftConflictDialogOpen,
    useRemoteUpdate,
  } = draftSession
  const handledPublishTaskRef = useRef('')
  const { socketConnected: publishTaskSocketConnected } =
    useTaskDetailSubscription(publishTaskId)
  const publishTaskQuery = useQuery({
    enabled: Boolean(publishTaskId),
    queryFn: () => getTask(publishTaskId!) as unknown as Promise<PublishTask>,
    queryKey: adminQueryKeys.tasks.taskDetail(publishTaskId ?? ''),
    refetchInterval: () => (publishTaskSocketConnected ? 30_000 : 5_000),
  })
  const routeDraftQuery = useQuery({
    enabled: Boolean(routeDraftId),
    queryFn: () => getDraftById(routeDraftId),
    queryKey: adminQueryKeys.drafts.detail(routeDraftId),
  })
  const baseRevisionQuery = useQuery({
    enabled: Boolean(routeBaseRevisionId),
    queryFn: () => getRevision(routeBaseRevisionId),
    queryKey: ['drafts', 'revision', routeBaseRevisionId],
  })
  const baseRelationQuery = useQuery({
    enabled: Boolean(
      routeBaseRevisionId &&
      versionContextQuery.data?.publishedRevision?.id &&
      routeBaseRevisionId !== versionContextQuery.data?.publishedRevision?.id,
    ),
    queryFn: () =>
      compareRevisions(
        versionContextQuery.data!.publishedRevision!.id,
        routeBaseRevisionId,
      ),
    queryKey: [
      'drafts',
      'compare',
      versionContextQuery.data?.publishedRevision?.id,
      routeBaseRevisionId,
    ],
  })
  const translationsQuery = useQuery({
    enabled: isEditing && publishConfirmOpen,
    queryFn: () => getTranslationsByRef(id),
    queryKey: adminQueryKeys.ai.lockedTranslations(id),
  })
  const lockedTranslationLangs = useMemo(
    () =>
      (translationsQuery.data?.translations ?? [])
        .filter((translation) => translation.isLocked)
        .map((translation) => translation.lang),
    [translationsQuery.data],
  )
  const newDraftsQuery = useQuery({
    enabled: !isEditing,
    queryFn: () => getNewDrafts(draftRefType),
    queryKey: adminQueryKeys.drafts.newDraft(draftRefType),
  })
  const publicationMutation = useMutation({
    mutationFn: async (published: boolean) => {
      if (!id) return
      await publishPost(id, published)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('write.toast.saveFailed'))),
    onSuccess: async (_result, published) => {
      toast.success(
        published
          ? t('write.publishProcess.republished')
          : t('write.publishProcess.unpublished'),
      )
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.write.contentRoot(props.kind),
      })
    },
  })

  useEffect(() => {
    const task = publishTaskQuery.data
    if (!task || handledPublishTaskRef.current === `${task.id}:${task.status}`)
      return
    if (
      task.status === AITaskStatus.Pending ||
      task.status === AITaskStatus.Running
    )
      return
    handledPublishTaskRef.current = `${task.id}:${task.status}`

    const syncCommittedResult = () => {
      if (!task.result) return
      const newerChangesRemain =
        task.result.newerDraftChanges || draftSession.hasUnsavedChanges()
      if (!newerChangesRemain) formSeededKeyRef.current = null
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('id', task.result.articleId)
      nextParams.delete('baseRevisionId')
      nextParams.set('draftId', task.payload.branchId)
      setSearchParams(nextParams, { replace: true })
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.write.contentRoot(props.kind),
        }),
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.drafts.root }),
      ])
    }

    if (task.status === AITaskStatus.Completed && task.result) {
      const background = normalizeTaskAiResources(task.payload.aiResources)
        .filter((item) => item.mode === 'async')
        .map((item) => t(publishAiResourceLabels[item.resource]))
      const articleId = task.result.articleId
      toast.success(
        task.payload.operation === 'online-update'
          ? t('write.publishProcess.onlineUpdated')
          : task.payload.operation === 'republish'
            ? t('write.publishProcess.republished')
            : t('write.publishProcess.firstPublished'),
        background.length
          ? {
              action: {
                label: t('write.publishProcess.viewBackground'),
                onClick: () => navigate(`/ai/overview/${articleId}`),
              },
              description: t('write.publishProcess.backgroundGenerating', {
                resources: background.join('、'),
              }),
            }
          : undefined,
      )
      syncCommittedResult()
    } else if (task.result?.articleCommitted) {
      toast.error(t('write.publishProcess.onlineUpdatedWithAiFailure'))
      syncCommittedResult()
    } else if (task.status === AITaskStatus.Cancelled) {
      toast.error(t('write.publishProcess.cancelled'))
    } else {
      toast.error(getErrorMessage(task.error, t('write.publishProcess.failed')))
    }
    setPublishTaskId(null)
  }, [
    navigate,
    props.kind,
    publishTaskQuery.data,
    queryClient,
    searchParams,
    setSearchParams,
    t,
  ])

  const categories = categoriesList.items
  const tags = tagsQuery.data ?? []
  const siteDefaultLang = siteOptionsQuery.data?.defaultSourceLang || ''
  const meId = meQuery.data?.id
  const authorCandidates = useMemo(() => {
    const byId = new Map(
      (detailModel?.authors ?? []).map((author) => [author.id, author]),
    )
    for (const user of authorsQuery.data?.data ?? []) byId.set(user.id, user)
    return [...byId.values()]
  }, [authorsQuery.data, detailModel?.authors])
  const activeNewDrafts = useMemo(
    () =>
      (newDraftsQuery.data ?? []).filter((draft) => draft.status === 'active'),
    [newDraftsQuery.data],
  )
  const activeDocumentBranches = useMemo(
    () => versionContextQuery.data?.branches ?? [],
    [versionContextQuery.data?.branches],
  )
  const standaloneDraftTree = useMemo(
    () => buildStandaloneDraftTree(activeNewDrafts),
    [activeNewDrafts],
  )
  const firstCategoryId = categories[0]?.id ?? ''
  const activeCategory =
    categories.find((category) => category.id === state.categoryId) ??
    categories[0]
  const availableDraft = useMemo(() => {
    const candidates = isEditing ? activeDocumentBranches : activeNewDrafts
    return [...candidates].sort(
      (a, b) =>
        Date.parse(b.updatedAt ?? b.createdAt) -
        Date.parse(a.updatedAt ?? a.createdAt),
    )[0]
  }, [activeDocumentBranches, activeNewDrafts, isEditing])
  const postPublicPath = buildPostPublicPath(state, activeCategory)
  const publishedFingerprint = useMemo(
    () =>
      detailModel
        ? getDraftFingerprint(
            props.kind,
            fromModel(props.kind, detailModel),
            id,
          )
        : '',
    [detailModel, id, props.kind],
  )
  const canSubmitPublication =
    !isEditing || !isPublished || draftFingerprint !== publishedFingerprint
  const publishOperation = !isEditing
    ? 'first-publish'
    : isPublished
      ? 'online-update'
      : 'republish'
  const publishActionKey: TranslationKey =
    publishOperation === 'online-update'
      ? 'write.publishProcess.updateOnline'
      : publishOperation === 'republish'
        ? 'write.publishProcess.republish'
        : 'write.header.publish'
  useBeforeUnload(
    (event) => {
      if (!draftSession.hasUnsavedChanges()) return
      event.preventDefault()
    },
    { capture: true },
  )

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      draftSession.hasUnsavedChanges() &&
      (currentLocation.pathname !== nextLocation.pathname ||
        new URLSearchParams(currentLocation.search).get('id') !==
          new URLSearchParams(nextLocation.search).get('id')),
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    void confirmDialog({
      title: t('write.confirmLeave.title'),
      description: t('write.confirmLeave.description'),
      confirmText: t('common.leave'),
    }).then((ok) => {
      if (ok) blocker.proceed()
      else blocker.reset()
    })
  }, [blocker, t])

  useEffect(() => {
    if (!detailModel || !isDetailLoaded) {
      if (!firstCategoryId) return
      setState((previous) =>
        previous.categoryId
          ? previous
          : {
              ...previous,
              categoryId: firstCategoryId,
            },
      )
      return
    }

    if (routeDraftId || routeBaseRevisionId) return

    const seedKey = `${props.kind}:${id}`
    if (formSeededKeyRef.current === seedKey) return
    formSeededKeyRef.current = seedKey

    const modelState = fromModel(props.kind, detailModel)
    const fingerprint = getDraftFingerprint(props.kind, modelState, id)
    draftSession.accept(null, fingerprint, { draftId: '' })
    setState(modelState)
  }, [
    detailModel,
    firstCategoryId,
    id,
    isDetailLoaded,
    props.kind,
    routeDraftId,
    routeBaseRevisionId,
  ])

  useEffect(() => {
    if (isEditing) return
    setState((previous) => {
      const authors =
        previous.authors.length > 0 || !meId ? previous.authors : [meId]
      const sourceLang = previous.sourceLang || siteDefaultLang
      if (authors === previous.authors && sourceLang === previous.sourceLang) {
        return previous
      }
      return { ...previous, authors, sourceLang }
    })
  }, [isEditing, meId, siteDefaultLang])

  useEffect(() => {
    const revision = baseRevisionQuery.data
    if (!revision || !detailModel || !isDetailLoaded || routeDraftId) return
    if (
      versionContextQuery.data &&
      revision.documentId !== versionContextQuery.data.document.id
    ) {
      toast.error(t('write.toast.draftTypeMismatch'))
      return
    }
    const seedKey = `${props.kind}:${id}:revision:${revision.id}`
    if (formSeededKeyRef.current === seedKey) return
    formSeededKeyRef.current = seedKey
    const nextState = fromRevision(
      props.kind,
      revision,
      fromModel(props.kind, detailModel),
    )
    const fingerprint = getDraftFingerprint(props.kind, nextState, id)
    draftSession.accept(null, fingerprint, { draftId: '' })
    setState(nextState)
  }, [
    baseRevisionQuery.data,
    detailModel,
    id,
    isDetailLoaded,
    props.kind,
    routeDraftId,
    versionContextQuery.data,
  ])

  const reviewAncestorQuery = useQuery({
    enabled: Boolean(reviewingDraft?.commonAncestorRevisionId),
    queryFn: () => getRevision(reviewingDraft!.commonAncestorRevisionId!),
    queryKey: ['drafts', 'revision', reviewingDraft?.commonAncestorRevisionId],
  })
  const recoveryReviewData = useMemo(
    () =>
      reviewingDraft && detailModel
        ? buildDraftRecoveryReviewData(
            props.kind,
            detailModel,
            reviewingDraft,
            reviewAncestorQuery.data,
          )
        : null,
    [detailModel, props.kind, reviewAncestorQuery.data, reviewingDraft],
  )

  useEffect(() => {
    const draft = routeDraftQuery.data
    if (!draft || appliedRouteDraftIdRef.current === draft.id) return

    if (draft.document.refType !== draftRefType) {
      toast.error(t('write.toast.draftTypeMismatch'))
      appliedRouteDraftIdRef.current = draft.id
      return
    }

    appliedRouteDraftIdRef.current = draft.id
    const nextState = fromRevision(props.kind, draft.headRevision, state)
    const fingerprint = getDraftFingerprint(
      props.kind,
      nextState,
      draft.document.refId ?? (isEditing ? id : undefined),
    )
    draftSession.accept(draft, fingerprint, { draftId: draft.id })
    setState(nextState)

    if (draft.document.refId && !id) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('id', draft.document.refId)
      nextParams.set('draftId', draft.id)
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    draftRefType,
    id,
    isEditing,
    props.kind,
    routeDraftQuery.data,
    searchParams,
    setSearchParams,
    state,
  ])

  const saveMutation = useMutation<
    {
      draft: DraftModel
      fingerprint: string
      taskId: string
    },
    unknown,
    {
      aiResources: PublishAiResourceRequest[]
      confirmDiverged: boolean
      regenerateLockedTranslations: boolean
    }
  >({
    mutationFn: async ({
      aiResources,
      confirmDiverged,
      regenerateLockedTranslations,
    }) => {
      const currentDraftId = draftId || routeDraftId
      const { baseline, data, fingerprint } =
        draftSession.getPublishInput(currentDraftId)
      if (currentDraftId && !baseline) {
        throw new Error(t('write.toast.draftBaselineMissing'))
      }
      const draft = currentDraftId
        ? await updateDraft(currentDraftId, {
            data,
            expectedHeadRevisionId: baseline!.headRevisionId,
          })
        : await createDraft({
            baseRevisionId: branchBaseRevisionId,
            data,
            refId: isEditing ? id : undefined,
            refType: draftRefType,
          })
      const task = await createPublishJob({
        aiResources,
        branchId: draft.id,
        confirmDiverged,
        expectedPublishedRevisionId: draft.document.publishedRevisionId,
        regenerateLockedTranslations,
        revisionId: draft.headRevisionId,
      })
      return { draft, fingerprint, taskId: task.taskId }
    },
    onError: (error: unknown) => {
      if (
        error instanceof ApiRequestError &&
        error.code === 'PUBLISHED_REVISION_CHANGED'
      ) {
        void versionContextQuery.refetch()
        toast.error(t('write.publishConfirm.onlineChanged'))
        return
      }
      toast.error(
        getErrorMessage(error, t('write.publishProcess.acceptFailed')),
      )
    },
    onSuccess: async (result) => {
      draftSession.accept(result.draft, result.fingerprint, {
        dirty: draftSession.latestFingerprint() !== result.fingerprint,
        draftId: result.draft.id,
        preserveLatest: true,
      })
      setPublishTaskId(result.taskId)
      if (searchParams.get('draftId') !== result.draft.id) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set('draftId', result.draft.id)
        setSearchParams(nextParams, { replace: true })
      }
      toast.info(t('write.publishProcess.started'))
      openPublishProcessDock()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.drafts.root }),
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.tasks.tasksRoot,
        }),
      ])
    },
  })
  const writerGenerateMutation = useMutation({
    mutationFn: () => {
      const trimmedTitle = state.title.trim()
      const trimmedText = state.text.trim()

      if (trimmedTitle) {
        return writerGenerate({
          title: trimmedTitle,
          type: AiQueryType.Slug,
        })
      }

      return writerGenerate({
        text: trimmedText,
        type: AiQueryType.TitleSlug,
      })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('write.toast.aiGenerateFailed'))),
    onSuccess: (result) => {
      draftSession.markDirty()
      setState((previous) => ({
        ...previous,
        slug: result.slug || previous.slug,
        title: result.title || previous.title,
      }))
      toast.success(t('write.toast.aiApplied'))
    },
  })

  const validationError = useMemo(
    () => validateState(state, categories),
    [categories, state],
  )

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draftConflictResolving) return
    if (draftConflict) {
      setDraftConflictDialogOpen(true)
      return
    }
    setPublishConfirmOpen(true)
  }
  const updateField = <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => {
    draftSession.markDirty()
    setState((previous) => ({ ...previous, [key]: value }))
  }

  const getAgentMetaFields = () => getWriteAgentMetaFields(state)

  const applyAgentMetaUpdates = (updates: Record<string, unknown>) => {
    draftSession.markDirty()
    setState((previous) => applyWriteAgentMetaUpdates(previous, updates))
  }

  const applyDraft = (draft: DraftModel) => {
    const nextState = fromRevision(props.kind, draft.headRevision, state)
    const fingerprint = getDraftFingerprint(
      props.kind,
      nextState,
      isEditing ? id : undefined,
    )
    draftSession.accept(draft, fingerprint, { draftId: draft.id })
    setDraftConflict(null)
    setState(nextState)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('draftId', draft.id)
    nextParams.delete('baseRevisionId')
    if (draft.document.refId) nextParams.set('id', draft.document.refId)
    setSearchParams(nextParams, { replace: true })
    setReviewingDraft(null)
    toast.success(t('write.toast.draftApplied'))
  }

  const confirmSourceSwitch = async (nextDraftId: string) => {
    if (
      !draftSession.hasUnsavedChanges() ||
      (nextDraftId !== '' && nextDraftId === (draftId || routeDraftId))
    ) {
      return true
    }
    return confirmDialog({
      confirmText: t('write.versionTree.switchConfirm'),
      description: t('write.versionTree.switchDescription'),
      destructive: true,
      title: t('write.versionTree.switchTitle'),
    })
  }

  const continueDraft = async (draft: DraftModel) => {
    if (!(await confirmSourceSwitch(draft.id))) return
    applyDraft(draft)
    if (!isDesktop) setAsidePanel(null)
  }

  const publishDraftFromTree = async (draft: DraftModel) => {
    if (!(await confirmSourceSwitch(draft.id))) return
    applyDraft(draft)
    setAsidePanel(null)
    setPublishConfirmOpen(true)
  }

  const viewCurrentArticle = async () => {
    if (!detailModel) return
    if (!(await confirmSourceSwitch(''))) return
    const nextState = fromModel(props.kind, detailModel)
    const fingerprint = getDraftFingerprint(props.kind, nextState, id)
    draftSession.accept(null, fingerprint, { draftId: '' })
    setDraftConflict(null)
    setState(nextState)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('baseRevisionId')
    nextParams.delete('draftId')
    setSearchParams(nextParams, { replace: true })
    if (!isDesktop) setAsidePanel(null)
  }

  const closeDraftsPanel = () => {
    setAsidePanel(null)
  }

  const deleteDraftMutation = useMutation({
    mutationFn: deleteDraft,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('drafts.toast.deleteFailed'))),
    onSuccess: async (_result, deletedId: string) => {
      const deletedCurrent = draftId === deletedId || routeDraftId === deletedId
      draftSession.clearAcceptedDraft(deletedId)
      if (deletedCurrent) {
        const nextState = detailModel
          ? fromModel(props.kind, detailModel)
          : emptyState
        const fingerprint = getDraftFingerprint(
          props.kind,
          nextState,
          isEditing ? id : undefined,
        )
        draftSession.accept(null, fingerprint, { draftId: '' })
        setState(nextState)
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('draftId')
        setSearchParams(nextParams, { replace: true })
      }
      toast.success(t('drafts.toast.deleted'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.drafts.root }),
        isEditing ? versionContextQuery.refetch() : newDraftsQuery.refetch(),
      ])
    },
  })

  const confirmAndDeleteDraft = async (draft: DraftModel) => {
    const confirmed = await confirmDialog({
      destructive: true,
      title: t('drafts.detail.confirmDelete', {
        title: draft.headRevision.title || t('write.editor.untitled'),
      }),
    })
    if (!confirmed) return
    if (reviewingDraft?.id === draft.id) setReviewingDraft(null)
    deleteDraftMutation.mutate(draft.id)
  }

  const generateTitleOrSlug = () => {
    if (!state.title.trim() && !state.text.trim()) {
      toast.error(t('write.slugGenerate.bothMissing'))
      return
    }

    writerGenerateMutation.mutate()
  }

  const useRemoteConflictDraft = draftSession.useRemoteConflictDraft

  const keepLocalConflictDraft = draftSession.keepLocalConflictDraft

  const latestDraftCandidate = draftSession.latestDraft()
  const latestDraft =
    latestDraftCandidate?.status === 'active' ? latestDraftCandidate : undefined
  const draftListHintCount =
    !isEditing && !routeDraftId ? activeNewDrafts.length : 0
  const showDraftListHint = draftListHintCount > 0 && !draftListHintDismissed
  // The banner only exists to protect unsaved work: a clean editor is updated
  // silently instead (see adoptLatestRemoteDraft). While a save conflict is
  // unresolved the conflict banner already owns that decision.
  const showRemoteUpdateHint =
    remoteUpdateStale && !draftConflict && draftSession.hasUnsavedChanges()
  const selectedBranch =
    activeDocumentBranches.find(
      (branch) => branch.id === (draftId || routeDraftId),
    ) ?? routeDraftQuery.data
  const versionBranchCount = isEditing
    ? activeDocumentBranches.length
    : activeNewDrafts.length
  const editorBranchCount = isEditing ? activeDocumentBranches.length : 0
  const versionTreeTriggerTitle =
    versionBranchCount > 0
      ? t('write.versionTree.triggerWithCount', {
          count: versionBranchCount,
        })
      : t('write.versionTree.title')
  const publishIsDiverged = selectedBranch
    ? selectedBranch.relationToPublished === 'descendant' ||
      selectedBranch.relationToPublished === 'diverged'
    : baseRelationQuery.data?.relation === 'descendant' ||
      baseRelationQuery.data?.relation === 'diverged'
  const draftKindText = t('write.kind.post')
  const isDirty = draftSession.hasUnsavedChanges()
  const metaStatus = computeMetaStatus({
    hasConflict: Boolean(draftConflict),
    isDirty,
    isEditing,
    isPublished,
    isPendingDraftSave: draftMutation.isPending || draftConflictResolving,
    latestDraft,
    publishedUpdatedAt: detailModel
      ? getPublishedContent(detailModel).updatedAt
      : undefined,
  })

  const slugPathPrefix = `/posts/${activeCategory?.slug ?? ''}/`
  const slugDisplayPath = state.slug.trim()
    ? `${slugPathPrefix}${state.slug.trim()}`
    : ''
  const aiButtonVisible =
    state.text.trim().length > 0 && (!state.title.trim() || !state.slug.trim())

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={onSubmit}>
      <section
        className="flex h-full min-h-0 flex-col bg-background"
        style={
          {
            '--app-shell-header-height': APP_SHELL_HEADER_HEIGHT_VALUE,
          } as CSSProperties
        }
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
            APP_SHELL_HEADER_HEIGHT_CLASS,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <HeaderBackButton
              label={t('write.header.backToList')}
              to={POST_LIST_PATH}
            />
            <h2 className="inline-flex min-w-0 items-center gap-2 text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              <FileText aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{t('write.header.titlePost')}</span>
            </h2>
            <DraftStatusTag
              className="hidden md:inline-flex"
              draft={latestDraft}
              isSaving={draftMutation.isPending || draftConflictResolving}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <WriteHeaderIconButton
              badge={versionBranchCount}
              onClick={() => toggleAsidePanel('drafts')}
              title={versionTreeTriggerTitle}
              type="button"
              variant={draftsPanelOpen ? 'active' : 'default'}
            >
              <GitBranch aria-hidden="true" className="size-4" />
            </WriteHeaderIconButton>
            <WriteHeaderIconButton
              onClick={() => toggleAsidePanel('agent')}
              title={
                agentVisible ? t('write.pill.hideAi') : t('write.pill.showAi')
              }
              type="button"
              variant={agentVisible ? 'active' : 'default'}
            >
              <Bot aria-hidden="true" className="size-4" />
            </WriteHeaderIconButton>
            <WriteHeaderIconButton
              onClick={() => toggleAsidePanel('meta')}
              title={
                metaPanelOpen
                  ? t('write.pill.hidePostSettings')
                  : t('write.pill.postSettings')
              }
              type="button"
              variant={metaPanelOpen ? 'active' : 'default'}
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
            </WriteHeaderIconButton>
            {canPublish ? (
              <WriteHeaderIconButton
                disabled={
                  saveMutation.isPending ||
                  draftMutation.isPending ||
                  detailLoading ||
                  draftConflictResolving ||
                  !canSubmitPublication
                }
                title={t(publishActionKey)}
                type="submit"
                variant="primary"
              >
                {saveMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Send aria-hidden="true" className="size-4" />
                )}
              </WriteHeaderIconButton>
            ) : null}
          </div>
        </div>

        <ContentLayout
          asideMobileSnap={draftsPanelOpen ? 'full' : 'half'}
          className="min-h-0 flex-1"
          mainClassName="flex flex-col"
          onCloseAside={() => {
            setAsidePanel(null)
          }}
          open={asidePanel !== null && !detailLoading}
        >
          {detailLoading ? (
            <div className="min-h-0 flex-1">
              <WriteSkeleton />
            </div>
          ) : (
            <Scroll
              className="min-h-0 flex-1"
              innerClassName="min-h-full bg-background"
            >
              <main className="flex min-h-full min-w-0 flex-col bg-background">
                <div className="mx-auto w-full max-w-5xl shrink-0 px-3 pt-8">
                  {draftConflict ? (
                    <div className="mb-3 -mt-4">
                      <DraftConflictBanner
                        conflictCount={draftConflict.conflicts.length}
                        onKeepLocal={keepLocalConflictDraft}
                        onUseRemote={useRemoteConflictDraft}
                      />
                    </div>
                  ) : null}
                  {showRemoteUpdateHint ? (
                    <div className={cn('mb-3', !draftConflict && '-mt-4')}>
                      <DraftHintBanner
                        actionLabel={t('write.remoteUpdate.useNew')}
                        message={t('write.remoteUpdate.message')}
                        onAction={useRemoteUpdate}
                        onDismiss={dismissRemoteUpdate}
                        onSecondaryAction={mergeRemoteUpdate}
                        secondaryActionLabel={t('write.remoteUpdate.merge')}
                        variant="remote-update"
                      />
                    </div>
                  ) : null}
                  {showDraftListHint ? (
                    <div
                      className={cn(
                        'mb-3',
                        !draftConflict && !showRemoteUpdateHint && '-mt-4',
                      )}
                    >
                      <DraftHintBanner
                        actionLabel={t('write.draftList.hintAction')}
                        message={t('write.draftList.hintMessage', {
                          count: draftListHintCount,
                          label: draftKindText,
                        })}
                        onAction={() => setAsidePanel('drafts')}
                        onDismiss={() => setDraftListHintDismissed(true)}
                        variant="list"
                      />
                    </div>
                  ) : null}
                  <EditorMetaStrip
                    aiButtonPending={writerGenerateMutation.isPending}
                    aiButtonVisible={aiButtonVisible}
                    branchCount={editorBranchCount}
                    onAiGenerate={generateTitleOrSlug}
                    onOpenVersionTree={() => setAsidePanel('drafts')}
                    status={metaStatus.status}
                    statusText={metaStatus.text}
                  />
                  <EditorTitleArea
                    autoFocus={!isEditing}
                    displayPath={slugDisplayPath}
                    onSlugChange={(value) => updateField('slug', value)}
                    onTitleChange={(value) => updateField('title', value)}
                    placeholder={t('write.editor.titlePlaceholder')}
                    slug={state.slug}
                    slugPlaceholder="slug-of-this-post"
                    slugPrefix={slugPathPrefix}
                    title={state.title}
                  />
                  <hr className="my-4 border-0 border-t border-neutral-100 dark:border-neutral-900" />
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3">
                    <RichWriteSurface
                      agentVisible={agentVisible}
                      autoFocus={isEditing}
                      content={state.content}
                      contentClassName="!min-h-[60dvh] flex-1 px-0 pt-3 pb-[200px]"
                      kind={props.kind}
                      key={`${props.kind}:${id || 'new'}`}
                      getMetaFields={getAgentMetaFields}
                      metaFieldsSchema={POST_META_SCHEMA}
                      onContentChange={(content) =>
                        updateField('content', content)
                      }
                      onMetaFieldsUpdate={applyAgentMetaUpdates}
                      onPinSelection={() => setAsidePanel('agent')}
                      onTextChange={(text) => updateField('text', text)}
                      refId={isEditing ? id : routeDraftId || undefined}
                      surfaceClassName="flex min-h-[70dvh] flex-1 flex-col rounded-none border-0 bg-transparent dark:bg-transparent"
                      surfaceStyle={
                        {
                          '--rc-max-width': 'none',
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>
              </main>
            </Scroll>
          )}
          <ContentLayoutSlot active={draftsPanelOpen} id="drafts">
            <VersionTreePanel
              currentDraftId={draftId || routeDraftId}
              currentPublishedRevisionId={
                versionContextQuery.data?.document.publishedRevisionId ?? null
              }
              deletingDraftId={
                deleteDraftMutation.isPending
                  ? (deleteDraftMutation.variables ?? null)
                  : null
              }
              documentId={
                versionContextQuery.data?.document.id ??
                (isEditing ? activeDocumentBranches : activeNewDrafts).find(
                  (draft) => draft.id === (draftId || routeDraftId),
                )?.documentId ??
                null
              }
              drafts={isEditing ? activeDocumentBranches : activeNewDrafts}
              nodes={
                isEditing
                  ? (versionContextQuery.data?.versionTree ?? [])
                  : standaloneDraftTree
              }
              onClose={closeDraftsPanel}
              onCompare={setReviewingDraft}
              onDelete={confirmAndDeleteDraft}
              onContinue={(draft) => void continueDraft(draft)}
              onHistory={(draft) => navigate(`/drafts/${draft.id}`)}
              onPublish={(draft) => void publishDraftFromTree(draft)}
              onViewOnline={() => void viewCurrentArticle()}
            />
          </ContentLayoutSlot>
          <ContentLayoutSlot active={metaPanelOpen} id="meta">
            <ContentSettingsPanel
              availableDraft={availableDraft}
              draftId={draftId || routeDraftId || undefined}
              draftMutationData={draftMutation.data}
              draftMutationPending={draftMutation.isPending}
              onApplyDraft={applyDraft}
              onGenerateTitleOrSlug={generateTitleOrSlug}
              canPublish={canPublish}
              onPublishedChange={(published) => {
                if (published) {
                  publicationMutation.mutate(true)
                  return
                }
                void confirmDialog({
                  confirmText: t('write.publication.unpublishAction'),
                  description: t('write.publication.unpublishDescription'),
                  destructive: true,
                  title: t('write.publication.unpublishTitle'),
                }).then((confirmed) => {
                  if (confirmed) publicationMutation.mutate(false)
                })
              }}
              onSaveDraft={saveDraftNow}
              postFields={
                <PostFields
                  authorCandidates={authorCandidates}
                  categories={categories}
                  siteDefaultLang={siteDefaultLang}
                  state={state}
                  tags={tags}
                  updateField={updateField}
                />
              }
              publicPath={
                postPublicPath
                  ? `${WEB_URL}${postPublicPath}`
                  : t('write.postPublicPath.fallback')
              }
              publicationPending={publicationMutation.isPending}
              published={isPublished}
              hasArticle={isEditing}
              refId={isEditing ? id : undefined}
              state={state}
              updateField={updateField}
              writerGeneratePending={writerGenerateMutation.isPending}
            />
          </ContentLayoutSlot>
        </ContentLayout>
      </section>

      <DraftRecoveryReview
        data={recoveryReviewData}
        onClose={() => setReviewingDraft(null)}
        onContinue={() => {
          if (reviewingDraft) void continueDraft(reviewingDraft)
        }}
        onDelete={() => {
          if (reviewingDraft) void confirmAndDeleteDraft(reviewingDraft)
        }}
        open={Boolean(reviewingDraft)}
      />
      <PublishConfirmationDialog
        aiConfig={aiPublishOptionsQuery.data}
        diverged={publishIsDiverged}
        otherBranchCount={Math.max(
          0,
          activeDocumentBranches.length - (selectedBranch ? 1 : 0),
        )}
        onClose={() => setPublishConfirmOpen(false)}
        lockedTranslationLangs={lockedTranslationLangs}
        onConfirm={(resources, options) => {
          setPublishConfirmOpen(false)
          saveMutation.mutate({
            aiResources: resources,
            confirmDiverged: publishIsDiverged,
            regenerateLockedTranslations: options.regenerateLockedTranslations,
          })
        }}
        onReviewDiff={
          publishIsDiverged && selectedBranch
            ? () => {
                setPublishConfirmOpen(false)
                setReviewingDraft(selectedBranch)
              }
            : undefined
        }
        open={publishConfirmOpen}
        rememberedResources={
          versionContextQuery.data?.document.publishAiResources
        }
        operation={publishOperation}
        pending={saveMutation.isPending}
        savedAt={
          latestDraftCandidate
            ? formatRelativeTime(latestDraftCandidate.updatedAt)
            : undefined
        }
        validationError={validationError}
      />
      {draftConflict ? (
        <DraftConflictDialog
          conflictCount={draftConflict.conflicts.length}
          onClose={() => setDraftConflictDialogOpen(false)}
          onKeepLocal={keepLocalConflictDraft}
          onUseRemote={useRemoteConflictDraft}
          open={draftConflictDialogOpen}
        />
      ) : null}
    </form>
  )
}

function ContentSettingsPanel(props: {
  availableDraft?: DraftModel
  draftId?: string
  draftMutationData?: DraftModel
  draftMutationPending: boolean
  hasArticle: boolean
  onApplyDraft: (draft: DraftModel) => void
  onGenerateTitleOrSlug: () => void
  canPublish: boolean
  onPublishedChange: (published: boolean) => void
  onSaveDraft: () => void
  postFields: ReactNode
  publicationPending: boolean
  published: boolean
  publicPath: string
  refId?: string
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
  writerGeneratePending: boolean
}) {
  const { t } = useI18n()

  return (
    <AsidePanel>
      <Scroll
        className="min-h-0 flex-1"
        innerClassName="grid grid-cols-[minmax(0,1fr)] gap-4 p-4"
      >
        <PanelBlock title={t('write.section.publish.title')}>
          <FormSwitch
            checked={props.published}
            disabled={
              !props.canPublish || !props.refId || props.publicationPending
            }
            label={t(
              props.published
                ? 'write.publication.published'
                : props.hasArticle
                  ? 'write.publication.offline'
                  : 'write.publication.unpublished',
            )}
            onCheckedChange={props.onPublishedChange}
          />
        </PanelBlock>

        <PanelBlock title={t('write.section.draft.title')}>
          <div className="space-y-3 text-sm">
            {props.availableDraft ? (
              <div className="border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <History aria-hidden="true" className="size-4" />
                  <span>
                    {t('write.section.draft.versionLine', {
                      time: formatDateTime(
                        props.availableDraft.updatedAt ??
                          props.availableDraft.createdAt,
                      ),
                    })}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-neutral-800 dark:text-neutral-200">
                  {props.availableDraft.headRevision.title ||
                    t('write.section.draft.untitled')}
                </p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => props.onApplyDraft(props.availableDraft!)}
                  type="button"
                  variant="subtle"
                >
                  {t('write.section.draft.applyDraft')}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('write.section.draft.empty')}
              </p>
            )}

            <Button
              className="w-full"
              disabled={props.draftMutationPending}
              onClick={props.onSaveDraft}
              type="button"
              variant="subtle"
            >
              {props.draftMutationPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Clock aria-hidden="true" className="size-4" />
              )}
              {t(
                props.published
                  ? 'write.section.draft.save'
                  : 'write.section.draft.saveUnpublished',
              )}
            </Button>
            {props.draftMutationData ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('write.section.draft.lastSaved', {
                  time: formatDateTime(props.draftMutationData.updatedAt),
                })}
              </p>
            ) : null}
          </div>
        </PanelBlock>

        <PanelBlock title={t('write.section.path.title')}>
          <TextInput
            controlClassName="h-9 font-mono focus:border-neutral-400"
            label="Slug"
            onChange={(value) => props.updateField('slug', value)}
            required
            value={props.state.slug}
          />
          <Button
            className="w-full"
            disabled={props.writerGeneratePending}
            onClick={props.onGenerateTitleOrSlug}
            type="button"
            variant="subtle"
          >
            {props.writerGeneratePending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <WandSparkles aria-hidden="true" className="size-4" />
            )}
            {props.state.title.trim()
              ? t('write.slugGenerate.haveTitle')
              : t('write.slugGenerate.noTitle')}
          </Button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {props.publicPath}
          </p>
        </PanelBlock>

        {props.postFields}
        <MediaAndMetaFields
          draftId={props.draftId}
          refId={props.refId}
          state={props.state}
          updateField={props.updateField}
        />
      </Scroll>
    </AsidePanel>
  )
}

interface PublishedWriteContent {
  content?: string
  text: string
  title: string
  updatedAt: string
}

function buildStandaloneDraftTree(drafts: DraftModel[]): VersionTreeNode[] {
  const nodes = new Map<string, VersionTreeNode>()
  for (const draft of drafts) {
    const existingBase = nodes.get(draft.baseRevisionId)
    nodes.set(draft.baseRevisionId, {
      branchBaseIds: [...(existingBase?.branchBaseIds ?? []), draft.id],
      branchHeadIds: [
        ...(existingBase?.branchHeadIds ?? []),
        ...(draft.baseRevisionId === draft.headRevisionId ? [draft.id] : []),
      ],
      collapsedRevisionCount: 0,
      parentNodeId: null,
      publishedAt: null,
      revision: draft.baseRevision,
    })
    if (draft.baseRevisionId !== draft.headRevisionId) {
      nodes.set(draft.headRevisionId, {
        branchBaseIds: [],
        branchHeadIds: [draft.id],
        collapsedRevisionCount: 0,
        parentNodeId: draft.baseRevisionId,
        publishedAt: null,
        revision: draft.headRevision,
      })
    }
  }
  return [...nodes.values()]
}

function WriteHeaderIconButton(props: {
  badge?: number
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  title: string
  type: 'button' | 'submit'
  variant?: 'default' | 'primary' | 'active'
}) {
  const variant = props.variant ?? 'default'
  return (
    <button
      aria-label={props.title}
      aria-pressed={variant === 'active' ? true : undefined}
      className={cn(
        'focus-visible:outline-hidden relative inline-flex size-9 items-center justify-center rounded-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-accent/15 disabled:pointer-events-none disabled:opacity-40',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover',
        variant === 'active' &&
          'bg-accent-soft text-accent ring-1 ring-inset ring-accent/25 hover:bg-accent-soft/80',
        variant === 'default' &&
          'bg-surface-inset text-fg-muted hover:bg-black/[0.06] hover:text-fg dark:hover:bg-white/[0.08]',
      )}
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.title}
      type={props.type}
    >
      {props.children}
      {props.badge && props.badge > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-background"
        >
          {props.badge > 99 ? '99+' : props.badge}
        </span>
      ) : null}
    </button>
  )
}

type MetaStatus = 'new' | 'dirty' | 'conflict' | 'saved' | 'published'

function computeMetaStatus(input: {
  hasConflict: boolean
  isDirty: boolean
  isEditing: boolean
  isPublished: boolean
  isPendingDraftSave: boolean
  latestDraft?: DraftModel
  publishedUpdatedAt?: string
}): { status: MetaStatus; text: string } {
  if (input.hasConflict) {
    return {
      status: 'conflict',
      text: translate('write.metaStatus.conflict'),
    }
  }
  if (input.isPendingDraftSave) {
    return {
      status: 'dirty',
      text: translate(
        input.isPublished
          ? 'write.metaStatus.publishedSavingDraft'
          : input.isEditing
            ? 'write.metaStatus.offlineSavingDraft'
            : 'write.metaStatus.dirtySaving',
      ),
    }
  }
  if (input.isDirty) {
    return {
      status: 'dirty',
      text: translate(
        input.isPublished
          ? 'write.metaStatus.publishedDirty'
          : input.isEditing
            ? 'write.metaStatus.offlineDirty'
            : 'write.metaStatus.dirty',
      ),
    }
  }
  if (input.latestDraft) {
    const savedAt =
      input.latestDraft.updatedAt ?? input.latestDraft.createdAt ?? ''
    const suffix = savedAt
      ? translate('write.metaStatus.savedAt', {
          time: formatRelativeTime(savedAt),
        })
      : ''
    return {
      status: 'saved',
      text: translate(
        input.isPublished
          ? 'write.metaStatus.publishedWithDraft'
          : input.isEditing
            ? 'write.metaStatus.offlineWithDraft'
            : 'write.metaStatus.draft',
        { suffix },
      ),
    }
  }
  if (input.isEditing && input.isPublished && input.publishedUpdatedAt) {
    return {
      status: 'published',
      text: translate('write.metaStatus.published', {
        time: formatRelativeTime(input.publishedUpdatedAt),
      }),
    }
  }
  if (input.isEditing && !input.isPublished) {
    return { status: 'new', text: translate('write.metaStatus.offline') }
  }
  return { status: 'new', text: translate('write.metaStatus.new') }
}

function formatRelativeTime(value: string | null | undefined) {
  if (value == null || value === '') return '-'
  const ts = Date.parse(value)
  if (Number.isNaN(ts)) return '-'
  const diffMs = Date.now() - ts
  if (diffMs < 0) return formatDateTime(value)
  const sec = Math.round(diffMs / 1000)
  if (sec < 45) return translate('write.relativeTime.justNow')
  const min = Math.round(sec / 60)
  if (min < 60)
    return translate('write.relativeTime.minutesAgo', { count: min })
  const hr = Math.round(min / 60)
  if (hr < 24) return translate('write.relativeTime.hoursAgo', { count: hr })
  const day = Math.round(hr / 24)
  if (day < 7) return translate('write.relativeTime.daysAgo', { count: day })
  return formatDateTime(value)
}

function EditorMetaStrip(props: {
  aiButtonPending: boolean
  aiButtonVisible: boolean
  branchCount: number
  onAiGenerate: () => void
  onOpenVersionTree: () => void
  status: MetaStatus
  statusText: string
}) {
  const { t } = useI18n()
  const dotClass =
    props.status === 'conflict'
      ? 'bg-red-500'
      : props.status === 'dirty'
        ? 'bg-amber-500'
        : props.status === 'saved' || props.status === 'published'
          ? 'bg-emerald-500'
          : 'bg-neutral-300 dark:bg-neutral-600'
  return (
    <div className="group mb-3 flex min-h-7 items-center justify-between opacity-60 transition-opacity duration-200 hover:opacity-100">
      <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-neutral-500 dark:text-neutral-400">
        <span
          aria-hidden="true"
          className={cn(
            'inline-block size-1.5 shrink-0 rounded-full',
            dotClass,
          )}
        />
        <span className="min-w-0 truncate">{props.statusText}</span>
        {props.branchCount > 0 ? (
          <button
            aria-label={t('write.versionTree.triggerWithCount', {
              count: props.branchCount,
            })}
            className="focus-visible:outline-hidden inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap border-l border-neutral-200 pl-2 text-neutral-500 transition-colors hover:text-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
            onClick={props.onOpenVersionTree}
            title={t('write.versionTree.triggerWithCount', {
              count: props.branchCount,
            })}
            type="button"
          >
            <GitBranch aria-hidden="true" className="size-3.5" />
            <span>
              {t('write.versionTree.branchCount', {
                count: props.branchCount,
              })}
            </span>
          </button>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {props.aiButtonVisible ? (
          <button
            aria-label={t('write.pill.aiGenerate')}
            className="focus-visible:outline-hidden inline-flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
            disabled={props.aiButtonPending}
            onClick={props.onAiGenerate}
            title={t('write.pill.aiGenerate')}
            type="button"
          >
            {props.aiButtonPending ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <WandSparkles aria-hidden="true" className="size-3.5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function EditorTitleArea(props: {
  autoFocus: boolean
  displayPath: string
  onSlugChange: (value: string) => void
  onTitleChange: (value: string) => void
  placeholder: string
  slug: string
  slugPlaceholder: string
  slugPrefix: string
  title: string
}) {
  return (
    <div className="group">
      <input
        autoFocus={props.autoFocus}
        className="outline-hidden w-full border-0 bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight text-neutral-950 placeholder:font-medium placeholder:text-neutral-300 dark:text-neutral-50 dark:placeholder:text-neutral-700"
        onChange={(event) => props.onTitleChange(event.target.value)}
        placeholder={props.placeholder}
        required
        value={props.title}
      />
      <SlugPill
        displayPath={props.displayPath}
        onSlugChange={props.onSlugChange}
        slug={props.slug}
        slugPlaceholder={props.slugPlaceholder}
        slugPrefix={props.slugPrefix}
      />
    </div>
  )
}

function SlugPill(props: {
  displayPath: string
  onSlugChange: (value: string) => void
  slug: string
  slugPlaceholder: string
  slugPrefix: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const hasSlug = Boolean(props.slug.trim())
  const triggerLabel = hasSlug
    ? props.displayPath
    : t('write.editor.titleArea.addSlug')

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Popover.Trigger
        aria-label={
          hasSlug
            ? t('write.editor.titleArea.editSlugAria')
            : t('write.editor.titleArea.addSlugAria')
        }
        className={cn(
          '-ml-1 mt-1 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-xs text-fg-muted transition-opacity duration-150 hover:bg-surface-inset focus-visible:ring-[3px] focus-visible:ring-accent/15',
        )}
        type="button"
      >
        <span className="truncate">{triggerLabel}</span>
        <Pencil aria-hidden="true" className="size-3 shrink-0" />
      </Popover.Trigger>
      <Popover.Content className="p-3" width="md">
        <div className="text-xs font-medium uppercase tracking-wider text-fg-subtle">
          Slug
        </div>
        <div className="mt-2 flex items-center gap-1 rounded-sm border border-border bg-surface-inset px-2 py-1.5 font-mono text-xs">
          {props.slugPrefix ? (
            <span className="select-none text-fg-subtle">
              {props.slugPrefix}
            </span>
          ) : null}
          <input
            autoFocus
            className="outline-hidden min-w-0 flex-1 bg-transparent text-fg placeholder:text-fg-subtle"
            onChange={(event) => props.onSlugChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                setOpen(false)
              }
            }}
            placeholder={props.slugPlaceholder}
            value={props.slug}
          />
        </div>
      </Popover.Content>
    </Popover>
  )
}

function PostFields(props: {
  authorCandidates: ComponentProps<typeof AuthorsPicker>['candidates']
  categories: CategoryEntity[]
  siteDefaultLang: string
  state: WriteFormState
  tags: Array<{ count: number; name: string }>
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  const { t } = useI18n()
  const selectedTags = splitCommaList(props.state.tags)
  const toggleTag = (tag: string) => {
    props.updateField('tags', toggleListValue(selectedTags, tag).join(', '))
  }

  return (
    <>
      <PanelBlock
        description={t('write.authors.description')}
        icon={Users}
        title={t('write.authors.title')}
      >
        <AuthorsPicker
          candidates={props.authorCandidates}
          onChange={(authors) => props.updateField('authors', authors)}
          value={props.state.authors}
        />
        <SourceLangField
          onChange={(value) => props.updateField('sourceLang', value)}
          siteDefault={props.siteDefaultLang}
          value={props.state.sourceLang}
        />
      </PanelBlock>

      <PanelBlock title={t('write.postFields.section.category')}>
        <Field label={t('write.postFields.category')} required>
          <SelectField
            aria-label={t('write.postFields.category')}
            onValueChange={(categoryId) =>
              props.updateField('categoryId', categoryId)
            }
            options={props.categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
            value={props.state.categoryId}
          />
        </Field>
      </PanelBlock>

      <PanelBlock title={t('write.postFields.section.meta')}>
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          list="write-post-tags"
          label={t('write.postFields.allTags')}
          onChange={(value) => props.updateField('tags', value)}
          placeholder={t('write.postFields.allTagsPlaceholder')}
          value={props.state.tags}
        />
        <datalist id="write-post-tags">
          {props.tags.map((tag) => (
            <option key={tag.name} label={`${tag.name} (${tag.count})`}>
              {tag.name}
            </option>
          ))}
        </datalist>
        {props.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {props.tags.slice(0, 24).map((tag) => {
              const selected = selectedTags.includes(tag.name)

              return (
                <button
                  className={cn(
                    'rounded border px-2 py-1 text-xs transition-colors',
                    selected
                      ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900',
                  )}
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  type="button"
                >
                  {tag.name}
                  <span className="text-current/60 ml-1">{tag.count}</span>
                </button>
              )
            })}
          </div>
        ) : null}
        <TextArea
          controlClassName="min-h-24 focus:border-neutral-400"
          label={t('write.postFields.summary')}
          onChange={(value) => props.updateField('summary', value)}
          value={props.state.summary}
        />
        <FormSwitch
          checked={props.state.pin}
          label={t('write.postFields.pin')}
          onCheckedChange={(checked) => props.updateField('pin', checked)}
        />
        {props.state.pin ? (
          <TextInput
            controlClassName="h-9 focus:border-neutral-400"
            inputMode="numeric"
            label={t('write.postFields.pinOrder')}
            onChange={(value) => props.updateField('pinOrder', value)}
            value={props.state.pinOrder}
          />
        ) : null}
      </PanelBlock>

      <PanelBlock
        description={t('write.seo.sectionDescription')}
        icon={Search}
        title={t('write.seo.sectionTitle')}
      >
        <SeoFields
          onChange={(key, value) => props.updateField(key, value)}
          titlePlaceholder={props.state.title}
          value={props.state}
        />
      </PanelBlock>
    </>
  )
}

function MediaAndMetaFields(props: {
  draftId?: string
  refId?: string
  state: WriteFormState
  updateField: <TKey extends keyof WriteFormState>(
    key: TKey,
    value: WriteFormState[TKey],
  ) => void
}) {
  const { t } = useI18n()
  const images = buildWriteImages(props.state)
  const cover = props.state.image

  return (
    <>
      <PanelBlock
        description={t('write.section.image.description')}
        icon={ImageIcon}
        title={t('write.section.image.title')}
      >
        <TextInput
          controlClassName="h-9 focus:border-neutral-400"
          label={t('write.section.image.coverLabel')}
          list="page-cover-image-options"
          onChange={(value) => props.updateField('image', value)}
          placeholder={t('write.section.image.coverPlaceholder')}
          value={cover}
        />
        {images.length > 0 ? (
          <datalist id="page-cover-image-options">
            {images.map((image) => (
              <option key={image.src} value={image.src} />
            ))}
          </datalist>
        ) : null}
        {cover ? (
          <div className="overflow-hidden border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
            <img
              alt={t('write.section.image.coverAlt')}
              className="max-h-48 w-full object-contain"
              src={cover}
            />
          </div>
        ) : null}
        <CoverGenerationEntry
          currentCover={cover}
          draftId={props.draftId}
          onSelectCover={(url) => props.updateField('image', url)}
          refId={props.refId}
          summary={props.state.summary}
          text={props.state.text}
          title={props.state.title}
        />
        <TtsGenerationEntry refId={props.refId} />
        {images.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('write.section.image.imageCount', { count: images.length })}
            </div>
            <div className="grid gap-1.5">
              {images.slice(0, 6).map((image) => (
                <div
                  className="truncate border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300"
                  key={image.src}
                  title={image.src}
                >
                  {image.src}
                </div>
              ))}
              {images.length > 6 ? (
                <div className="text-xs text-neutral-400 dark:text-neutral-500">
                  {t('write.section.image.moreCount', {
                    count: images.length - 6,
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('write.section.image.candidateHint')}
          </p>
        )}
      </PanelBlock>

      <PanelBlock icon={Braces} title={t('write.section.image.metaTitle')}>
        <MetaPresetSection
          meta={props.state.meta}
          onUpdateMeta={(meta) => props.updateField('meta', meta)}
          scope="post"
        />
      </PanelBlock>
    </>
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asRecord(
  value: unknown,
  fallback: Record<string, unknown> = {},
): Record<string, unknown> {
  return isRecord(value) ? value : fallback
}

function buildWriteImages(state: WriteFormState): ImageModel[] {
  const images = new Map<string, ImageModel>()
  const addImage = (image: ImageModel | null | undefined) => {
    if (!image?.src) return
    images.set(image.src, image)
  }
  const addImageSrc = (src: string | undefined) => {
    if (!src || images.has(src)) return
    images.set(src, {
      height: 0,
      src,
      type: getFileExtension(src),
      width: 0,
    })
  }

  for (const image of state.images) addImage(image)
  for (const src of pickImagesFromMarkdown(state.text)) addImageSrc(src)
  addImageSrc(state.image)

  return [...images.values()]
}

function pickImagesFromMarkdown(text: string) {
  const images: string[] = []

  const imagePattern = /!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g

  for (const match of text.matchAll(imagePattern)) {
    if (match[1]) images.push(match[1])
  }

  return images
}

function getFileExtension(src: string) {
  const pathname = src.split(/[#?]/)[0] ?? src
  return pathname.split('.').pop() || ''
}

function PanelBlock(props: {
  children: ReactNode
  description?: string
  icon?: LucideIcon
  title: string
}) {
  const Icon = props.icon

  return (
    <section className="border-b border-neutral-200 pb-5 last:border-b-0 dark:border-neutral-800">
      <div className="mb-3 grid gap-1">
        <h3 className="inline-flex items-center gap-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
          {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
          <span>{props.title}</span>
        </h3>
        {props.description ? (
          <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {props.description}
          </p>
        ) : null}
      </div>
      <div className="space-y-3">{props.children}</div>
    </section>
  )
}

function Field(props: {
  children: ReactNode
  label: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {props.label}
        {props.required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {props.children}
    </label>
  )
}

function WriteSkeleton() {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="h-11 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-[34rem] animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-28 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
            key={index}
          />
        ))}
      </div>
    </div>
  )
}

type WriteModel = PostModel

const draftRefTypeByKind: Record<WriteKind, DraftRefType> = {
  post: DraftRefType.Post,
}

function getPublishedContent(model: WriteModel): PublishedWriteContent {
  return {
    content: model.content ?? undefined,
    text: model.text ?? '',
    title: model.title,
    updatedAt: model.modifiedAt || model.createdAt,
  }
}

function fromModel(_kind: WriteKind, post: WriteModel): WriteFormState {
  return {
    ...emptyState,
    ...postBylineFromModel(post),
    categoryId: post.categoryId,
    content: post.content ?? '',
    images: post.images ?? [],
    meta: asRecord(post.meta),
    pin: Boolean(post.pinAt),
    pinOrder: String(post.pinOrder ?? 1),
    slug: post.slug,
    summary: post.summary ?? '',
    tags: post.tags.join(', '),
    text: post.text ?? '',
    title: post.title,
  }
}

function fromRevision(
  kind: WriteKind,
  draft: RevisionSnapshot | DraftWriteData,
  previous: WriteFormState,
): WriteFormState {
  const specific = (draft.typeSpecificData ?? {}) as Record<string, any>
  return {
    ...previous,
    ...postBylineFromSpecific(specific, previous),
    content: draft.content ?? '',
    images: draft.images ?? previous.images,
    meta: asRecord(draft.meta, previous.meta),
    text: draft.text ?? '',
    title: draft.title ?? '',
    categoryId:
      typeof specific.categoryId === 'string'
        ? specific.categoryId
        : previous.categoryId,
    pin: 'pin' in specific ? Boolean(specific.pin) : previous.pin,
    pinOrder:
      typeof specific.pinOrder === 'number'
        ? String(specific.pinOrder)
        : previous.pinOrder,
    slug: typeof specific.slug === 'string' ? specific.slug : previous.slug,
    summary:
      'summary' in specific
        ? typeof specific.summary === 'string'
          ? specific.summary
          : ''
        : previous.summary,
    tags: Array.isArray(specific.tags)
      ? specific.tags.map((tag) => String(tag)).join(', ')
      : previous.tags,
  }
}

function buildDraftRecoveryReviewData(
  kind: WriteKind,
  model: PostModel,
  draft: DraftModel,
  ancestor?: RevisionSnapshot,
): DraftRecoveryReviewData {
  const current = fromModel(kind, model)
  const next = fromRevision(kind, draft.headRevision, current)
  const ancestorState = ancestor
    ? fromRevision(kind, ancestor, current)
    : undefined
  const fields: DraftRecoveryReviewData['fields'] = []
  const add = (
    labelKey: TranslationKey,
    currentValue: unknown,
    draftValue: unknown,
    ancestorValue?: unknown,
  ) => {
    if (
      serializeListKey([normalizeReviewValue(currentValue)]) ===
      serializeListKey([normalizeReviewValue(draftValue)])
    ) {
      return
    }
    fields.push({
      ancestor: ancestorState ? formatReviewValue(ancestorValue) : undefined,
      current: formatReviewValue(currentValue),
      draft: formatReviewValue(draftValue),
      label: translate(labelKey),
    })
  }

  add(
    'write.recovery.field.title',
    current.title,
    next.title,
    ancestorState?.title,
  )
  add('write.recovery.field.slug', current.slug, next.slug, ancestorState?.slug)

  add(
    'write.recovery.field.summary',
    current.summary,
    next.summary,
    ancestorState?.summary,
  )
  add(
    'write.recovery.field.category',
    current.categoryId,
    next.categoryId,
    ancestorState?.categoryId,
  )
  add(
    'write.recovery.field.tags',
    splitCommaList(current.tags).sort(),
    splitCommaList(next.tags).sort(),
    splitCommaList(ancestorState?.tags ?? '').sort(),
  )
  add('write.recovery.field.pin', current.pin, next.pin, ancestorState?.pin)
  add(
    'write.recovery.field.pinOrder',
    current.pinOrder,
    next.pinOrder,
    ancestorState?.pinOrder,
  )
  add(
    'write.recovery.field.images',
    current.images,
    next.images,
    ancestorState?.images,
  )
  add('write.recovery.field.meta', current.meta, next.meta, ancestorState?.meta)
  add(
    'write.authors.title',
    current.authors,
    next.authors,
    ancestorState?.authors,
  )
  add(
    'write.sourceLang.label',
    current.sourceLang,
    next.sourceLang,
    ancestorState?.sourceLang,
  )
  add(
    'write.section.image.coverLabel',
    current.image,
    next.image,
    ancestorState?.image,
  )
  add(
    'write.seo.sectionTitle',
    [current.seoTitle, current.seoDescription, current.seoImage],
    [next.seoTitle, next.seoDescription, next.seoImage],
    ancestorState
      ? [
          ancestorState.seoTitle,
          ancestorState.seoDescription,
          ancestorState.seoImage,
        ]
      : undefined,
  )

  const bodyChanged = current.content !== next.content

  return {
    ancestorContent: ancestorState?.content,
    ancestorText: ancestorState?.text,
    bodyChanged,
    currentContent: current.content,
    currentText: current.text,
    draftContent: next.content,
    draftText: next.text,
    fields,
    diverged:
      draft.relationToPublished === 'diverged' ||
      draft.relationToPublished === 'descendant',
    rich: true,
    savedAt: formatRelativeTime(draft.updatedAt ?? draft.createdAt),
  }
}

function normalizeReviewValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeReviewValue)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeReviewValue(item)]),
    )
  }
  return value ?? null
}

function formatReviewValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return translate(
      value
        ? 'write.recovery.review.enabled'
        : 'write.recovery.review.disabled',
    )
  }
  if (Array.isArray(value)) {
    if (value.every((item) => item && typeof item === 'object')) {
      return value
        .map((item) =>
          typeof (item as { src?: unknown }).src === 'string'
            ? String((item as { src: string }).src)
            : JSON.stringify(item),
        )
        .join(', ')
    }
    return value.filter(Boolean).join(', ')
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(normalizeReviewValue(value), null, 2)
  }
  return value == null ? '' : String(value)
}

function getDraftFingerprint(
  kind: WriteKind,
  state: WriteFormState,
  refId?: string,
) {
  return draftFingerprint(toDraftData(kind, state, refId))
}

function toDraftData(
  _kind: WriteKind,
  state: WriteFormState,
  _refId?: string,
): DraftWriteData {
  state = projectWriteState(state)

  return {
    content: state.content,
    contentFormat: 'lexical',
    meta: state.meta,
    text: state.text,
    title: state.title.trim() || state.title,
    typeSpecificData: {
      ...postBylineToSpecific(state),
      categoryId: state.categoryId,
      pin: state.pin,
      pinOrder: state.pin ? Number(state.pinOrder) || 1 : undefined,
      slug: state.slug,
      summary: state.summary || null,
      tags: state.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    },
  }
}

// Pending AI diff decorators (agent-diff) are transient review UI and must
// never be persisted — project them back to their factual (original) side.
function stripPendingAgentDiffs(content: string): string {
  if (!content.includes('"agent-diff"')) return content
  try {
    const editorState = JSON.parse(content) as SerializedEditorState
    return JSON.stringify(projectAgentDiffNodesToFactualState(editorState))
  } catch {
    return content
  }
}

function projectWriteState(state: WriteFormState): WriteFormState {
  if (!state.content.trim()) return state
  const content = stripPendingAgentDiffs(state.content)
  return {
    ...state,
    content,
    text: mxLexicalToMarkdown(content),
  }
}

function RichWriteSurface(props: {
  agentVisible?: boolean
  autoFocus?: boolean
  content: string
  contentClassName?: string
  kind: WriteKind
  onContentChange: (content: string) => void
  onTextChange: (text: string) => void
  getMetaFields?: () => Record<string, unknown>
  metaFieldsSchema?: MetaFieldsSchema
  onMetaFieldsUpdate?: (
    updates: Record<string, unknown>,
  ) => Promise<void> | void
  onPinSelection?: () => void
  refId?: string
  surfaceClassName?: string
  surfaceStyle?: CSSProperties
}) {
  const { t } = useI18n()
  const editorRef = useRef<RichEditorWithAgentRef | null>(null)
  const dynamicCatalogMessages = useDynamicCatalogSystemMessages()
  const imageGenerationOptionsQuery = useQuery({
    queryFn: () => getOption<{ imageGeneration?: { enable?: boolean } }>('ai'),
    queryKey: adminQueryKeys.ai.imageGenerationOptions(),
    staleTime: 60_000,
  })
  const imageGenerationEnabled = Boolean(
    imageGenerationOptionsQuery.data?.imageGeneration?.enable,
  )
  const agent = useWriteAgent({
    agentVisible: Boolean(props.agentVisible),
    documentId: props.refId,
    documentKind: props.kind,
  })
  const latestCallbacks = useRef({
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  })

  latestCallbacks.current = {
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  }

  const editorStyle = {
    maxWidth: '100%',
    ...props.surfaceStyle,
  } satisfies Record<string, string | number>
  const editorOptions: RichEditorWithAgentProps = {
    apiUrl: API_URL,
    autoFocus: props.autoFocus ?? false,
    className: cn('min-h-136 bg-background', props.surfaceClassName),
    contentClassName: cn('min-h-120 px-4 py-3', props.contentClassName),
    debounceMs: 250,
    editorStyle,
    imageUpload: async (file) => {
      const result = await uploadFile(file, 'image')
      return { src: result.url }
    },
    videoUpload: async (file, opts) => {
      const result = await uploadFileWithProgress(file, {
        type: 'video',
        onProgress: (percent) => opts?.onProgress?.(percent),
      })
      return { src: result.url }
    },
    fileUpload: async (file, opts) => {
      const result = await uploadFileWithProgress(file, {
        type: 'file',
        onProgress: (percent) => opts?.onProgress?.(percent),
      })
      return { src: result.url }
    },
    initialValue: parseSerializedEditorState(props.content),
    injectDocumentXml: false,
    litexmlRegistry: createMxLitexmlRegistry,
    plugins: [],
    systemMessages: [
      ...buildDocumentBashSystemMessages(),
      ...dynamicCatalogMessages,
      ...(props.metaFieldsSchema
        ? buildMetaSystemMessages(props.metaFieldsSchema)
        : []),
    ],
    tools: [
      agent.documentBashTool,
      ...agent.dynamicTools,
      ...(props.metaFieldsSchema &&
      props.getMetaFields &&
      props.onMetaFieldsUpdate
        ? buildMetaTools({
            getFields: props.getMetaFields,
            schema: props.metaFieldsSchema,
            setFields: props.onMetaFieldsUpdate,
          })
        : []),
      ...(imageGenerationEnabled
        ? buildImageTools({ refId: props.refId })
        : []),
    ],
    toolSystemRole: false,
    onAgentLoopReady: agent.onAgentLoopReady,
    onChange: (value) => {
      latestCallbacks.current.onContentChange(JSON.stringify(value))
    },
    onEditorReady: agent.onEditorReady,
    onPinSelection: props.onPinSelection,
    onTextChange: (text) => {
      latestCallbacks.current.onTextChange(text)
    },
    placeholder: t('write.richEditor.placeholder'),
    provider: agent.provider,
    saveExcalidrawSnapshot,
    store: agent.store,
    theme: getColorScheme(),
    variant: 'article',
  }

  return (
    <>
      <Suspense
        fallback={<RichEditorFallback className={editorOptions.className} />}
      >
        <RichEditorWithAgent ref={editorRef} {...editorOptions} />
      </Suspense>
      <ContentLayoutSlot active={Boolean(props.agentVisible)} id="agent">
        <AgentPanel agent={agent} />
      </ContentLayoutSlot>
    </>
  )
}

function RichEditorFallback(props: { className?: string }) {
  return (
    <div
      className={cn(
        'min-h-136 bg-white px-4 py-3 dark:bg-neutral-950',
        props.className,
      )}
    >
      <div className="h-32 animate-pulse bg-neutral-100 dark:bg-neutral-900" />
    </div>
  )
}

function parseSerializedEditorState(
  content: string,
): SerializedEditorState | undefined {
  if (!content.trim()) return undefined

  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as SerializedEditorState
    }
  } catch {
    return undefined
  }

  return undefined
}

async function saveExcalidrawSnapshot(snapshot: object, existingRef?: string) {
  const name = existingRef
    ? `${existingRef.replaceAll(/[^\w.-]/g, '-')}.json`
    : `excalidraw-${crypto.randomUUID()}.json`
  const file = new File([JSON.stringify(snapshot)], name, {
    type: 'application/json',
  })
  const result = await uploadFile(file, 'file')

  return result.url
}

function getColorScheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function formatDateTime(value: string | null | undefined) {
  if (value == null || value === '') return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date)
}

function validateState(state: WriteFormState, categories: CategoryEntity[]) {
  if (!state.title.trim()) return translate('write.validation.titleRequired')
  const hasBody =
    state.text.trim().length > 0 || state.content.trim().length > 0
  if (!hasBody) return translate('write.validation.textRequired')
  if (!state.slug.trim()) return translate('write.validation.slugRequired')
  if (!state.categoryId) {
    return categories.length > 0
      ? translate('write.validation.selectCategory')
      : translate('write.validation.createCategoryFirst')
  }
  if (state.pin && Number.isNaN(Number(state.pinOrder))) {
    return translate('write.validation.pinOrderNumber')
  }

  return null
}

function getWriteAgentMetaFields(state: WriteFormState) {
  return {
    pin: state.pin,
    pinOrder: Number(state.pinOrder) || 0,
    seoDescription: state.seoDescription,
    seoTitle: state.seoTitle,
    slug: state.slug,
    summary: state.summary,
    tags: splitCommaList(state.tags),
    title: state.title,
  }
}

function applyWriteAgentMetaUpdates(
  state: WriteFormState,
  updates: Record<string, unknown>,
) {
  const next = { ...state }

  if ('title' in updates) next.title = String(updates.title ?? '')
  if ('slug' in updates) next.slug = String(updates.slug ?? '')
  if ('tags' in updates && Array.isArray(updates.tags)) {
    next.tags = updates.tags.map((tag) => String(tag)).join(', ')
  }
  if ('summary' in updates) next.summary = String(updates.summary ?? '')
  if ('seoTitle' in updates) next.seoTitle = String(updates.seoTitle ?? '')
  if ('seoDescription' in updates) {
    next.seoDescription = String(updates.seoDescription ?? '')
  }
  if ('pin' in updates) {
    next.pin = Boolean(updates.pin)
    if (!next.pin) next.pinOrder = '0'
    else if (!next.pinOrder || Number(next.pinOrder) === 0) next.pinOrder = '1'
  }
  if ('pinOrder' in updates) {
    next.pinOrder = String(Number(updates.pinOrder ?? 0) || 0)
  }

  return next
}

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toggleListValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function buildPostPublicPath(
  state: Pick<WriteFormState, 'slug'>,
  category: CategoryEntity | undefined,
) {
  if (!state.slug.trim() || !category?.slug) return ''
  return `/posts/${category.slug}/${state.slug.trim()}`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
