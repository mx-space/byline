import { Drawer, Skeleton, toast } from '@lobehub/ui'
import { createMxLitexmlRegistry } from '@mx-space/editor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LexicalEditor, SerializedEditorState } from 'lexical'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
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

import { AiQueryType, getTranslationsByRef, writerGenerate } from '~/api/ai'
import { getCategories, getTags } from '~/api/categories'
import type { DraftWriteData } from '~/api/drafts'
import {
  createDraft,
  createDraftCheckpoint,
  getDraftById,
  getDraftContext,
  getNewDrafts,
  getRevision,
  openWorkingCopy,
  updateDraft,
  updateDraftFields,
} from '~/api/drafts'
import { uploadFile, uploadFileWithProgress } from '~/api/files'
import { ApiRequestError } from '~/api/http'
import { getOption } from '~/api/options'
import { deletePost, getPostById } from '~/api/posts'
import type { PublishAiResourceRequest, PublishTask } from '~/api/publish-jobs'
import { createPublishJob } from '~/api/publish-jobs'
import { AITaskStatus, getTask } from '~/api/tasks'
import { getMe, getUsers } from '~/api/users'
import { API_URL, WEB_URL } from '~/constants/env'
import {
  useCollectionDetailQuery,
  useCollectionListQuery,
  useEntity,
  useEntityList,
} from '~/data/resource/hooks'
import type { CategoryEntity } from '~/data/resources/category'
import { categories as categoriesCollection } from '~/data/resources/category'
import { posts as postsCollection } from '~/data/resources/post'
import { publishPost } from '~/data/resources/post.mutations'
import type { AIConfig } from '~/features/settings/types/settings'
import { useTaskDetailSubscription } from '~/features/tasks/hooks/useTaskSubscription'
import { hasPermission, Permission } from '~/features/users/utils/permissions'
import { AgentPanel, useWriteAgent } from '~/features/write/components/agent'
import { DraftHintBanner } from '~/features/write/components/DraftHintBanner'
import {
  normalizeTaskAiResources,
  publishAiResourceLabels,
} from '~/features/write/components/publish-ai-choices'
import { PublishConfirmationDialog } from '~/features/write/components/PublishConfirmationDialog'
import { openPublishProcessDock } from '~/features/write/components/PublishProcessDock'
import { TimelinePanel } from '~/features/write/components/TimelinePanel'
import type { PresenceUser } from '~/features/write/crdt/collab-presence'
import { diffDraftFields } from '~/features/write/crdt/draft-fields'
import { createReadyGate } from '~/features/write/crdt/ready-gate'
import { resyncRejectedDraft } from '~/features/write/crdt/resync-rejected'
import {
  type CrdtDraftController,
  useCrdtDraft,
} from '~/features/write/crdt/use-crdt-draft'
import { draftFingerprint } from '~/features/write/utils/draft-fingerprint'
import { postBylineFromModel } from '~/features/write/utils/post-byline-state'
import {
  asRecord,
  emptyState,
  fieldsOf,
  formFieldsOf,
  fromRevision,
  toDraftData,
  type WriteFormState,
  type WriteKind,
} from '~/features/write/utils/write-form'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { translate } from '~/i18n/translate'
import type { Image as ImageModel } from '~/models/base'
import type { DraftFields, DraftModel } from '~/models/draft'
import { DraftRefType } from '~/models/draft'
import type { PostModel } from '~/models/post'
import { adminQueryKeys } from '~/query/keys'
import { subscribeDraftUpdate } from '~/socket/draft-update-signal'
import { confirmDialog } from '~/ui/feedback/confirm'
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

import { writeCopy } from '../copy'
import { writeChromeStyles as editorStyles } from './chrome/styles'
import type { WriteDockTone } from './chrome/WriteChrome'
import { WriteChrome } from './chrome/WriteChrome'
import { PeerAvatars } from './collab/PeerAvatars'
import { RemoteCarets } from './collab/RemoteCarets'

interface DraftSaveVariables {
  baseDraft: DraftModel | null
  data: DraftWriteData
  draftId: string
  explicit?: boolean
  fingerprint: string
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

const FIELDS_RETRY_MS = 2000

// The editor and its Loro session are bound to the discarded draft id; a full reload is the
// only way to drop both and open the article's new working copy cleanly.
const reloadWithoutDraft = (published: boolean) => {
  const url = new URL(window.location.href)
  const [path = '', query = ''] = url.hash.slice(1).split('?')
  const params = new URLSearchParams(query)
  params.delete('draftId')
  url.hash = published ? `${path}?${params}` : '/drafts'
  window.history.replaceState(null, '', url)
  window.location.reload()
}
const CRDT_READY_TIMEOUT_MS = 10_000

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
  const formStateRef = useRef(options.state)
  formStateRef.current = options.state
  const latestFingerprintRef = useRef(options.fingerprint)
  const autosaveTimerRef = useRef<number | null>(null)
  const [acceptedFingerprint, setAcceptedFingerprint] = useState('')
  const ackedFieldsRef = useRef<DraftFields | null>(null)
  const fieldsTimerRef = useRef<number | null>(null)
  const fieldsInFlightRef = useRef<Promise<void> | null>(null)
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
    staleTime: 5 * 60_000,
  })
  const me = meQuery.data
  const presenceUser = useMemo<PresenceUser>(
    () => ({
      avatar: me?.avatar || null,
      id: me?.id ?? '',
      name: me?.displayName || me?.username || '',
    }),
    [me],
  )
  const crdt = useCrdtDraft({
    author: me?.id ? `human:${me.id}` : undefined,
    draftId,
    enabled: Boolean(me?.id),
    onRejected: async () => {
      if (!draftId) return
      try {
        const draft = await resyncRejectedDraft({
          checkpoint: () => createDraftCheckpoint(draftId, 'save'),
          data: latestDataRef.current,
          update: (data, expectedHeadRevisionId) =>
            updateDraft(draftId, { data, expectedHeadRevisionId }),
        })
        acceptedDraftRef.current = draft
        toast.info(t('write.toast.draftResynced'))
      } catch (error) {
        toast.error(getErrorMessage(error, t('write.toast.draftSaveFailed')))
      }
    },
    onRemoteTitle: (title) =>
      options.setState((previous) =>
        previous.title === title ? previous : { ...previous, title },
      ),
    onRevoked: (reason) => {
      if (reason !== 'deleted') return
      toast.error(
        t(
          options.isEditing
            ? 'write.toast.draftDiscarded'
            : 'write.toast.draftDeleted',
        ),
      )
      reloadWithoutDraft(options.isEditing)
    },
  })
  const crdtRef = useRef(crdt)
  crdtRef.current = crdt

  const sendFields = useCallback(async () => {
    if (fieldsTimerRef.current !== null) {
      window.clearTimeout(fieldsTimerRef.current)
      fieldsTimerRef.current = null
    }
    await fieldsInFlightRef.current
    const acked = ackedFieldsRef.current
    if (!crdtRef.current.active || !draftId || !acked) return
    const next = fieldsOf(latestDataRef.current)
    const patch = diffDraftFields(acked, next)
    if (!patch) return
    const request = updateDraftFields(draftId, patch).then(
      () => {
        ackedFieldsRef.current = next
      },
      (error: unknown) => {
        if (fieldsTimerRef.current === null) {
          fieldsTimerRef.current = window.setTimeout(() => {
            fieldsTimerRef.current = null
            void sendFieldsRef.current().catch(() => undefined)
          }, FIELDS_RETRY_MS)
        }
        throw error
      },
    )
    fieldsInFlightRef.current = request.finally(() => {
      fieldsInFlightRef.current = null
    })
    await request
  }, [draftId])
  const sendFieldsRef = useRef(sendFields)
  sendFieldsRef.current = sendFields

  const flushCrdt = useCallback(async () => {
    await crdtRef.current.flush()
    await sendFields()
  }, [sendFields])

  useEffect(() => {
    latestDataRef.current = options.data
    latestFingerprintRef.current = options.fingerprint
  }, [options.data, options.fingerprint])

  const hasUnsavedChanges = useCallback(() => {
    if (crdtRef.current.active) {
      const acked = ackedFieldsRef.current
      return (
        crdtRef.current.pending() ||
        fieldsTimerRef.current !== null ||
        fieldsInFlightRef.current !== null ||
        (acked !== null &&
          diffDraftFields(acked, fieldsOf(latestDataRef.current)) !== null)
      )
    }
    return (
      dirtyRef.current &&
      options.hasContent &&
      latestFingerprintRef.current !== acceptedFingerprintRef.current
    )
  }, [options.hasContent])

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
      ackedFieldsRef.current = draft
        ? formFieldsOf(options.kind, draft.headRevision, formStateRef.current)
        : null
      acceptedFingerprintRef.current = fingerprint
      if (!settings?.preserveLatest) {
        latestFingerprintRef.current = fingerprint
      }
      dirtyRef.current = Boolean(settings?.dirty)
      setAcceptedFingerprint(fingerprint)
      if (settings?.draftId !== undefined) setDraftId(settings.draftId)
    },
    [options.kind],
  )

  const markDirty = useCallback((dirty = true) => {
    dirtyRef.current = dirty
  }, [])

  useEffect(
    () =>
      subscribeDraftUpdate((payload) => {
        const session = crdtRef.current
        if (payload.branchId !== draftId || !session.active || session.live()) {
          return
        }
        void session.pull()
      }),
    [draftId],
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
    mutationFn: async (variables) => {
      if (variables.draftId && crdtRef.current.active) {
        await flushCrdt()
        return createDraftCheckpoint(variables.draftId, 'save')
      }
      if (variables.draftId && crdtRef.current.locked) {
        throw new Error(t('write.toast.draftSyncPending'))
      }
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
        error.code !== 'DRAFT_HEAD_CONFLICT' ||
        !variables.draftId
      ) {
        toast.error(getErrorMessage(error, t('write.toast.draftSaveFailed')))
        return
      }

      void getDraftById(variables.draftId).then(
        (remote) => {
          accept(remote, acceptedFingerprintRef.current, {
            dirty: true,
            preserveLatest: true,
          })
          toast.info(t('write.toast.draftHeadReloaded'))
        },
        (loadError: unknown) =>
          toast.error(
            getErrorMessage(loadError, t('write.toast.draftSaveFailed')),
          ),
      )
    },
    onSuccess: async (draft, variables) => {
      const isFirstDraftSave = !variables.draftId
      if (isFirstDraftSave) crdtRef.current.adoptEditorOnBind()
      acceptedDraftRef.current = draft
      setDraftId(draft.id)
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

  const [crdtGate] = useState(() =>
    createReadyGate(() => crdtRef.current.active),
  )
  useEffect(() => {
    if (crdt.active) crdtGate.release()
  }, [crdt.active, crdtGate])

  const ensureCrdt = useCallback(
    () =>
      crdtGate.once(async () => {
        if (crdtRef.current.active) return true
        if (!draftId && !mutationRef.current.isPending) {
          if (!options.hasContent) {
            toast.error(t('write.toast.contentEmptyForDraft'))
            return false
          }
          try {
            await mutationRef.current.mutateAsync(buildSaveVariables(true))
          } catch {
            return false
          }
        }
        const ready = await crdtGate.wait(CRDT_READY_TIMEOUT_MS)
        if (!ready) toast.error(t('write.toast.draftSyncPending'))
        return ready
      }),
    [buildSaveVariables, crdtGate, draftId, options.hasContent, t],
  )

  const saveNow = useCallback(() => {
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
  }, [buildSaveVariables, options.hasContent, t])

  useEffect(() => {
    if (!dirtyRef.current || !options.hasContent) return
    if (options.fingerprint === acceptedFingerprintRef.current) return

    const timer = window.setTimeout(() => {
      if (autosaveTimerRef.current === timer) autosaveTimerRef.current = null
      if (!dirtyRef.current || mutationRef.current.isPending) return
      if (crdtRef.current.locked) return
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
    options.fingerprint,
    options.hasContent,
  ])

  useEffect(() => {
    if (!crdt.active || !ackedFieldsRef.current) return
    if (!diffDraftFields(ackedFieldsRef.current, fieldsOf(options.data))) return
    const timer = window.setTimeout(() => {
      if (fieldsTimerRef.current === timer) fieldsTimerRef.current = null
      void sendFields().catch((error) =>
        toast.error(getErrorMessage(error, t('write.toast.draftSaveFailed'))),
      )
    }, 500)
    fieldsTimerRef.current = timer
    return () => {
      window.clearTimeout(timer)
      if (fieldsTimerRef.current === timer) fieldsTimerRef.current = null
    }
  }, [crdt.active, options.data, sendFields, t])

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

  return {
    accept,
    acceptedDraft: () => acceptedDraftRef.current,
    acceptedFingerprint: () => acceptedFingerprintRef.current,
    flushCrdt,
    ensureCrdt,
    presenceUser,
    checkpoint: async (kind: 'publish' | 'save') => {
      await flushCrdt()
      return createDraftCheckpoint(draftId, kind)
    },
    reloadFields: async () => {
      if (!draftId) return
      const draft = await getDraftById(draftId)
      acceptedDraftRef.current = draft
      ackedFieldsRef.current = formFieldsOf(
        options.kind,
        draft.headRevision,
        formStateRef.current,
      )
      options.setState((previous) => ({
        ...fromRevision(options.kind, draft.headRevision, previous),
        content: previous.content,
        text: previous.text,
        title: previous.title,
      }))
    },
    crdt,
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
    latestDraft: () => acceptedDraftRef.current ?? mutation.data,
    latestFingerprint: () => latestFingerprintRef.current,
    markDirty,
    mutation,
    saveNow,
    setDraftId,
  }
}

function WritePage(props: { kind: WriteKind }) {
  const { locale, t } = useI18n()
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
  const [publishError, setPublishError] = useState<string | null>(null)
  useDocumentTitle(state.title)
  const [agentOpen, setAgentOpen] = useState(false)
  const [revisionsOpen, setRevisionsOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [draftListHintDismissed, setDraftListHintDismissed] = useState(false)
  const appliedRouteDraftIdRef = useRef<string | null>(null)
  const formSeededKeyRef = useRef<string | null>(null)
  const draftRefType = draftRefTypeByKind[props.kind]

  const categoriesQuery = useCollectionListQuery(categoriesCollection, {
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
  const canEditDraft = hasPermission(
    meQuery.data?.permissions,
    Permission.EditPost,
  )
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
    draftId,
    mutation: draftMutation,
    saveNow: saveDraftNow,
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
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      await deletePost(id)
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('write.toast.saveFailed'))),
    onSuccess: async () => {
      toast.success(t('write.toast.postDeleted'))
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.write.contentRoot(props.kind),
      })
      navigate(POST_LIST_PATH)
    },
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
      toast.success({
        actions: background.length
          ? [
              {
                label: t('write.publishProcess.viewBackground'),
                onClick: () => navigate(`/ai/overview/${articleId}`),
              },
            ]
          : undefined,
        description: background.length
          ? t('write.publishProcess.backgroundGenerating', {
              resources: background.join('、'),
            })
          : undefined,
        title:
          task.payload.operation === 'online-update'
            ? t('write.publishProcess.onlineUpdated')
            : task.payload.operation === 'republish'
              ? t('write.publishProcess.republished')
              : t('write.publishProcess.firstPublished'),
      })
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
  const firstCategoryId = categories[0]?.id ?? ''
  const activeCategory =
    categories.find((category) => category.id === state.categoryId) ??
    categories[0]
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

  useEffect(() => {
    const draft = routeDraftQuery.data
    if (!draft || appliedRouteDraftIdRef.current === draft.id) return

    if (draft.document.refType !== draftRefType) {
      toast.error(t('write.toast.draftTypeMismatch'))
      appliedRouteDraftIdRef.current = draft.id
      return
    }

    appliedRouteDraftIdRef.current = draft.id
    // Our own first save put this id in the URL; the editor is already ahead of the saved
    // revision, and re-applying it would remount the editor and drop keystrokes typed since.
    if (draftSession.draftId === draft.id) return
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
    draftSession.draftId,
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
      regenerateLockedTranslations: boolean
    }
  >({
    mutationFn: async ({ aiResources, regenerateLockedTranslations }) => {
      const currentDraftId = draftId || routeDraftId
      const { baseline, data, fingerprint } =
        draftSession.getPublishInput(currentDraftId)
      if (currentDraftId && !baseline) {
        throw new Error(t('write.toast.draftBaselineMissing'))
      }
      const draft = draftSession.crdt.active
        ? await draftSession.checkpoint('publish')
        : currentDraftId
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
        confirmDiverged: false,
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
        setPublishError(t('write.publishConfirm.onlineChanged'))
        return
      }
      setPublishError(
        getErrorMessage(error, t('write.publishProcess.acceptFailed')),
      )
    },
    onSuccess: async (result) => {
      setPublishConfirmOpen(false)
      setPublishError(null)
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

  const crdtActive = draftSession.crdt.active
  const peerAvatars = crdtActive ? (
    <PeerAvatars
      peers={draftSession.crdt.peers}
      selfId={draftSession.presenceUser.id}
    />
  ) : null
  const setCrdtTitle = draftSession.crdt.setTitle
  useEffect(() => {
    if (crdtActive) setCrdtTitle(state.title)
  }, [crdtActive, setCrdtTitle, state.title])

  const workingCopy = versionContextQuery.data?.branches[0]
  const openingWorkingCopyRef = useRef(false)
  useEffect(() => {
    if (!isEditing || routeDraftId || routeBaseRevisionId) return
    if (!versionContextQuery.isSuccess || !canEditDraft) return
    const showDraft = (nextDraftId: string) => {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('draftId', nextDraftId)
      setSearchParams(nextParams, { replace: true })
    }
    if (workingCopy) {
      showDraft(workingCopy.id)
      return
    }
    if (openingWorkingCopyRef.current) return
    openingWorkingCopyRef.current = true
    void openWorkingCopy(draftRefType, id)
      .then((draft) => showDraft(draft.id))
      .catch((error: unknown) => {
        if (
          error instanceof ApiRequestError &&
          error.code === 'PERMISSION_DENIED'
        ) {
          return
        }
        toast.error(getErrorMessage(error, t('write.toast.draftSaveFailed')))
      })
      .finally(() => {
        openingWorkingCopyRef.current = false
      })
  }, [
    canEditDraft,
    draftRefType,
    id,
    isEditing,
    routeBaseRevisionId,
    routeDraftId,
    searchParams,
    setSearchParams,
    t,
    versionContextQuery.isSuccess,
    workingCopy,
  ])

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

  const generateTitleOrSlug = () => {
    if (!state.title.trim() && !state.text.trim()) {
      toast.error(t('write.slugGenerate.bothMissing'))
      return
    }

    writerGenerateMutation.mutate()
  }

  const latestDraftCandidate = draftSession.latestDraft()
  const latestDraft =
    latestDraftCandidate?.status === 'active' ? latestDraftCandidate : undefined
  const draftListHintCount =
    !isEditing && !routeDraftId ? activeNewDrafts.length : 0
  const showDraftListHint = draftListHintCount > 0 && !draftListHintDismissed
  const draftKindText = t('write.kind.post')
  const isDirty = draftSession.hasUnsavedChanges()
  const slugPathPrefix = `/posts/${activeCategory?.slug ?? ''}/`
  const publishLabel =
    publishOperation === 'online-update'
      ? writeCopy(locale, 'updateOnline')
      : publishOperation === 'republish'
        ? writeCopy(locale, 'republish')
        : writeCopy(locale, 'publish')
  const dockTone: WriteDockTone = saveMutation.isPending
    ? 'publishing'
    : !hasDraftAutosaveContent
      ? 'needContent'
      : draftMutation.isPending
        ? 'saving'
        : isDirty
          ? 'unsaved'
          : publishTaskId
            ? 'submitted'
            : isPublished && !canSubmitPublication
              ? 'matchesLive'
              : latestDraft
                ? 'saved'
                : isEditing && !isPublished
                  ? 'offline'
                  : 'fresh'
  const requestPublish = () => {
    if (!canPublish || saveMutation.isPending) return
    setPublishError(null)
    setPublishConfirmOpen(true)
  }
  const phase = detailLoading
    ? 'loading'
    : isEditing && postDetailQuery.isError && !detailModel
      ? 'error'
      : 'ready'
  const publicPath = postPublicPath ? `${WEB_URL}${postPublicPath}` : ''

  return (
    <>
      <WriteChrome
        aiOpen={agentOpen}
        aiSeoDescription={versionContextQuery.data?.document.aiSeo?.description}
        authorCandidates={authorCandidates}
        categories={categories}
        categoriesFailed={categoriesQuery.isError}
        coverImages={buildWriteImages(state)}
        draft={latestDraft}
        draftId={draftId || routeDraftId || undefined}
        editor={
          <RichWriteSurface
            agentVisible={agentOpen}
            autoFocus={isEditing}
            content={state.content}
            getMetaFields={getAgentMetaFields}
            key={`${props.kind}:${id || 'new'}`}
            kind={props.kind}
            metaFieldsSchema={POST_META_SCHEMA}
            onAgentClose={() => setAgentOpen(false)}
            onContentChange={(content) => updateField('content', content)}
            crdt={draftSession.crdt}
            ensureDocument={draftSession.ensureCrdt}
            onMetaFieldsUpdate={applyAgentMetaUpdates}
            onPinSelection={() => setAgentOpen(true)}
            onTextChange={(text) => updateField('text', text)}
            refId={isEditing ? id : routeDraftId || undefined}
          />
        }
        generatePending={writerGenerateMutation.isPending}
        hasArticle={isEditing}
        metaOpen={metaOpen}
        notices={
          showDraftListHint ? (
            <DraftHintBanner
              actionLabel={t('write.draftList.hintAction')}
              message={t('write.draftList.hintMessage', {
                count: draftListHintCount,
                label: draftKindText,
              })}
              onAction={() => navigate('/drafts')}
              onDismiss={() => setDraftListHintDismissed(true)}
              variant="list"
            />
          ) : null
        }
        onCloseAi={() => setAgentOpen(false)}
        onCloseMeta={() => setMetaOpen(false)}
        onCloseRevisions={() => setRevisionsOpen(false)}
        deletePending={deletePostMutation.isPending}
        onDelete={() => {
          void confirmDialog({
            confirmText: t('write.publication.deleteAction'),
            description: t('write.publication.deleteDescription'),
            destructive: true,
            title: t('write.publication.deleteTitle'),
          }).then((confirmed) => {
            if (confirmed) deletePostMutation.mutate()
          })
        }}
        onGenerate={generateTitleOrSlug}
        onOpenAi={() => setAgentOpen(true)}
        onOpenMeta={() => setMetaOpen(true)}
        onOpenRevisions={() => setRevisionsOpen(true)}
        onPublish={requestPublish}
        onRetryCategories={() => {
          void categoriesQuery.refetch()
        }}
        onRetryLoad={() => {
          void postDetailQuery.refetch()
        }}
        onSave={saveDraftNow}
        onUnpublish={() => {
          if (!canPublish) return
          void confirmDialog({
            confirmText: t('write.publication.unpublishAction'),
            description: t('write.publication.unpublishDescription'),
            destructive: true,
            title: t('write.publication.unpublishTitle'),
          }).then((confirmed) => {
            if (confirmed) publicationMutation.mutate(false)
          })
        }}
        onViewTask={() => {
          if (publishTaskId) navigate(`/tasks/${publishTaskId}`)
          else navigate('/tasks')
        }}
        phase={phase}
        publicPath={publicPath}
        publishDisabled={
          !canPublish ||
          saveMutation.isPending ||
          detailLoading ||
          !canSubmitPublication
        }
        publishLabel={publishLabel}
        published={isPublished}
        publishedPublicAt={detailModel?.publicAt}
        publishing={saveMutation.isPending}
        refId={isEditing ? id : undefined}
        peers={peerAvatars}
        revisions={
          <TimelinePanel
            authorName={(userId) =>
              authorCandidates.find((user) => user.id === userId)
                ?.displayName ?? null
            }
            documentId={versionContextQuery.data?.document.id ?? null}
            draftId={draftId || routeDraftId}
            onBeforeChange={draftSession.flushCrdt}
            onChanged={async ({ restored }) => {
              await draftSession.crdt.pull()
              if (restored) await draftSession.reloadFields()
            }}
            publishedRevisionId={
              versionContextQuery.data?.document.publishedRevisionId ?? null
            }
            selfId={draftSession.presenceUser.id || null}
          />
        }
        revisionsOpen={revisionsOpen}
        saveDisabled={
          detailLoading ||
          draftMutation.isPending ||
          saveMutation.isPending ||
          !hasDraftAutosaveContent
        }
        saving={draftMutation.isPending}
        savingDraft={draftMutation.isPending}
        showViewTask={Boolean(publishTaskId)}
        siteDefaultLang={siteDefaultLang}
        slugPrefix={slugPathPrefix}
        tags={tags}
        title={state.title}
        tone={dockTone}
        unpublishPending={publicationMutation.isPending}
        updateField={updateField}
        values={state}
      />
      <PublishConfirmationDialog
        aiConfig={aiPublishOptionsQuery.data}
        failureMessage={publishError}
        lockedTranslationLangs={lockedTranslationLangs}
        onClose={() => {
          if (saveMutation.isPending) return
          setPublishConfirmOpen(false)
          setPublishError(null)
        }}
        onConfirm={(resources, options) => {
          setPublishError(null)
          saveMutation.mutate({
            aiResources: resources,
            regenerateLockedTranslations: options.regenerateLockedTranslations,
          })
        }}
        open={publishConfirmOpen}
        operation={publishOperation}
        pending={saveMutation.isPending}
        rememberedResources={
          versionContextQuery.data?.document.publishAiResources
        }
        seoDescriptionEmpty={!state.seoDescription.trim()}
        savedAt={
          latestDraftCandidate
            ? formatRelativeTime(latestDraftCandidate.updatedAt)
            : undefined
        }
        validationError={validationError}
      />
    </>
  )
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

type WriteModel = PostModel

const draftRefTypeByKind: Record<WriteKind, DraftRefType> = {
  post: DraftRefType.Post,
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
    publishedAt: post.createdAt ?? '',
    slug: post.slug,
    summary: post.summary ?? '',
    tags: post.tags.join(', '),
    text: post.text ?? '',
    title: post.title,
  }
}

function getDraftFingerprint(
  kind: WriteKind,
  state: WriteFormState,
  refId?: string,
) {
  return draftFingerprint(toDraftData(kind, state, refId))
}

export function RichWriteSurface(props: {
  agentVisible?: boolean
  onAgentClose?: () => void
  autoFocus?: boolean
  content: string
  crdt?: CrdtDraftController
  ensureDocument?: () => Promise<boolean>
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
  surfaceStyle?: CSSProperties
}) {
  const { locale, t } = useI18n()
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
    document: props.crdt,
    documentId: props.refId,
    documentKind: props.kind,
    ensureDocument: props.ensureDocument,
  })
  const latestCallbacks = useRef({
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  })
  const bindCrdtEditor = props.crdt?.bindEditor
  const lexicalEditorRef = useRef<LexicalEditor | null>(null)
  const [lexicalEditor, setLexicalEditor] = useState<LexicalEditor | null>(null)
  const crdtLocked = Boolean(props.crdt?.locked)
  const crdtLockedRef = useRef(crdtLocked)
  crdtLockedRef.current = crdtLocked
  useEffect(() => {
    lexicalEditorRef.current?.setEditable(!crdtLocked)
  }, [crdtLocked])

  latestCallbacks.current = {
    onContentChange: props.onContentChange,
    onTextChange: props.onTextChange,
  }

  const editorStyle = {
    ...props.surfaceStyle,
  } satisfies Record<string, string | number>
  const editorOptions: RichEditorWithAgentProps = {
    apiUrl: API_URL,
    autoFocus: props.autoFocus ?? false,
    className: editorStyles.editorSurface,
    contentClassName: editorStyles.editorContent,
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
      ...buildDocumentBashSystemMessages({
        shared: Boolean(props.crdt?.active),
      }),
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
    onEditorReady: (editor) => {
      lexicalEditorRef.current = editor
      setLexicalEditor(editor)
      if (crdtLockedRef.current) editor?.setEditable(false)
      agent.onEditorReady(editor)
      bindCrdtEditor?.(editor)
    },
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
      <Suspense fallback={<RichEditorFallback />}>
        <RichEditorWithAgent ref={editorRef} {...editorOptions} />
      </Suspense>
      {props.crdt?.active ? (
        <RemoteCarets
          editor={lexicalEditor}
          peers={props.crdt.peers}
          resolveCaret={props.crdt.resolveCaret}
        />
      ) : null}
      <Drawer
        classNames={{ bodyContent: editorStyles.drawerBody }}
        onClose={props.onAgentClose}
        open={Boolean(props.agentVisible)}
        placement="right"
        title={writeCopy(locale, 'aiTitle')}
        width="min(400px, 100vw)"
      >
        {props.agentVisible ? <AgentPanel agent={agent} /> : null}
      </Drawer>
    </>
  )
}

function RichEditorFallback() {
  return (
    <div className={editorStyles.editorFallback}>
      <Skeleton.Text rows={4} />
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
