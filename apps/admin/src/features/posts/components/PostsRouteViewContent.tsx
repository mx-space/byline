import {
  Alert,
  Button,
  confirmModal,
  SearchBar,
  Select,
  showContextMenu,
  Tag,
  Text,
  Tooltip,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { Trash2, X } from 'lucide-react'
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router'

import { useAiQuickActionsBuilder } from '~/features/ai/hooks/use-ai-quick-actions'
import { useI18n } from '~/i18n'
import type { PostModel } from '~/models/post'
import { FocusScope } from '~/ui/focus-scope'
import { type ListSelectionAPI, useListKeyboard } from '~/ui/list-actions'
import { Page } from '~/ui/page'

import { allCategoriesValue, postsPageSize } from '../constants'
import { usePostCopy } from '../copy'
import { usePostMutations } from '../hooks/use-post-mutations'
import { usePostsList } from '../hooks/use-posts-list'
import type { PostSortKey, SortOrder } from '../types/posts'
import { buildPostActions } from './buildPostActions'
import { buildPostMenuItems } from './buildPostMenuItems'
import { formatUpdatedAt, postExternalHref, postTitle } from './post-format'
import { PostBylineCell, PostRowActions, PostTitleCell } from './PostCells'
import { PostsEmpty } from './PostsEmpty'
import { PostsError } from './PostsError'
import { styles } from './styles'

const FOCUS_SCOPE_ID = 'posts-list'

const sortChoices: Array<{
  copyKey:
    | 'sortCreatedAsc'
    | 'sortCreatedDesc'
    | 'sortModifiedAsc'
    | 'sortModifiedDesc'
    | 'sortPinnedAsc'
    | 'sortPinnedDesc'
  order: SortOrder
  sortKey: PostSortKey
}> = [
  { copyKey: 'sortModifiedDesc', order: 'desc', sortKey: 'modifiedAt' },
  { copyKey: 'sortModifiedAsc', order: 'asc', sortKey: 'modifiedAt' },
  { copyKey: 'sortCreatedDesc', order: 'desc', sortKey: 'createdAt' },
  { copyKey: 'sortCreatedAsc', order: 'asc', sortKey: 'createdAt' },
  { copyKey: 'sortPinnedDesc', order: 'desc', sortKey: 'pinAt' },
  { copyKey: 'sortPinnedAsc', order: 'asc', sortKey: 'pinAt' },
]

function sortValue(sortKey: PostSortKey, order: SortOrder) {
  return `${sortKey}:${order}`
}

function useAfter(active: boolean, delayMs: number) {
  const [due, setDue] = useState(false)
  useEffect(() => {
    if (!active) {
      setDue(false)
      return
    }
    const timer = window.setTimeout(() => setDue(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [active, delayMs])
  return due
}

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a,button,input,label,[role="menuitem"],[data-row-actions]',
      ),
    )
  )
}

export function PostsRouteViewContent() {
  const copy = usePostCopy()
  const { format, t } = useI18n()
  const navigate = useNavigate()
  const buildAiItems = useAiQuickActionsBuilder()
  const {
    categories,
    categoriesQuery,
    categoryId,
    clearSearch,
    keyword,
    keywordInput,
    page,
    pagination,
    posts,
    postsQuery,
    setCategoryId,
    setKeywordInput,
    setPage,
    setSort,
    sortKey,
    sortOrder,
    submitSearch,
  } = usePostsList()

  const selectionRef = useRef<ListSelectionAPI<PostModel> | null>(null)
  const [failedDeleteIds, setFailedDeleteIds] = useState<string[]>([])

  const {
    batchDeleteMutation,
    categoryMutation,
    deleteMutation,
    pinMutation,
    publishMutation,
  } = usePostMutations({
    onBatchPartial: setFailedDeleteIds,
    onBatchSuccess: () => selectionRef.current?.clear(),
  })

  const openEdit = (post?: PostModel) => {
    if (!post) {
      navigate('/posts/edit')
      return
    }
    navigate(`/posts/edit?id=${encodeURIComponent(post.id)}`)
  }

  const confirmAndDelete = (targets: Array<{ id: string; title: string }>) => {
    if (targets.length === 0) return
    const single = targets.length === 1 ? targets[0] : null
    confirmModal({
      cancelText: copy('cancel'),
      content: copy('deleteBody'),
      okButtonProps: { danger: true },
      okText: single
        ? copy('deleteOk')
        : copy('deleteBatchOk', { count: targets.length }),
      onOk: async () => {
        if (single) {
          const wasSelected =
            selectionRef.current?.isSelected(single.id) ?? false
          await deleteMutation.mutateAsync(single.id)
          if (wasSelected) selectionRef.current?.toggle(single.id)
          return
        }
        await batchDeleteMutation.mutateAsync(
          targets.map((target) => target.id),
        )
      },
      title: single
        ? copy('deleteTitle', { title: single.title || copy('untitled') })
        : copy('deleteBatchTitle', { count: targets.length }),
    })
  }

  const toDeleteTargets = (targets: PostModel[]) =>
    targets.map((post) => ({
      id: post.id,
      title: postTitle(post, copy('untitled')),
    }))

  const actions = buildPostActions(
    {
      deleteMany: (targets) => confirmAndDelete(toDeleteTargets(targets)),
      navigateToEdit: (post) => openEdit(post),
      openExternal: (post) => {
        window.open(postExternalHref(post), '_blank', 'noopener,noreferrer')
      },
    },
    copy,
  )

  const { selection } = useListKeyboard<PostModel>({
    actions,
    getId: (post) => post.id,
    items: posts,
    resetOn: [categoryId, keyword, page, sortKey, sortOrder],
    scopeId: FOCUS_SCOPE_ID,
  })
  selectionRef.current = selection

  const rowCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }))

  const menuItemsFor = (post: PostModel) =>
    buildPostMenuItems(post, {
      actions,
      aiLabel: t('ai.menu.label'),
      aiMenuItems: buildAiItems(post.id),
      categories: rowCategories,
      categoryDisabled: categoryMutation.isPending,
      copy,
      externalHref: postExternalHref(post),
      onCategoryChange: (nextCategoryId) =>
        categoryMutation.mutate({ categoryId: nextCategoryId, id: post.id }),
      onPinToggle: (isPinned) => pinMutation.mutate({ id: post.id, isPinned }),
      onPublishToggle: (isPublished) =>
        publishMutation.mutate({ id: post.id, isPublished }),
      pinDisabled: pinMutation.isPending,
      publishDisabled: publishMutation.isPending,
    })

  const initialLoading = postsQuery.isLoading && posts.length === 0
  const showSlow = useAfter(initialLoading, 10_000)
  const filtered = Boolean(keyword) || categoryId !== allCategoriesValue
  const emptyKind = filtered ? 'filter' : page > 1 ? 'page' : 'first'
  const searchActive = Boolean(keyword)
  const selectedCount = selection.size
  const deleting = batchDeleteMutation.isPending || deleteMutation.isPending

  const columns: ProColumns<PostModel>[] = [
    {
      dataIndex: 'title',
      render: (_dom, post) => <PostTitleCell post={post} />,
      title: copy('columnTitle'),
    },
    {
      dataIndex: 'authors',
      render: (_dom, post) => <PostBylineCell post={post} />,
      responsive: ['lg'],
      title: copy('byline'),
      width: 200,
    },
    {
      dataIndex: 'category',
      ellipsis: true,
      render: (_dom, post) => (
        <Text type="secondary">
          {post.category?.name ?? copy('uncategorized')}
        </Text>
      ),
      responsive: ['lg'],
      title: copy('categoryLabel'),
      width: 140,
    },
    {
      dataIndex: 'isPublished',
      render: (_dom, post) =>
        post.isPublished ? (
          <Tag color="success">{copy('published')}</Tag>
        ) : (
          <Tag>{copy('draft')}</Tag>
        ),
      responsive: ['md'],
      title: copy('status'),
      width: 96,
    },
    {
      dataIndex: 'modifiedAt',
      render: (_dom, post) => {
        const value = post.modifiedAt ?? post.createdAt
        return (
          <Tooltip title={formatUpdatedAt(value, copy('emptyValue'))}>
            <span className={styles.time}>
              {value ? format.relativeTime(value) : copy('emptyValue')}
            </span>
          </Tooltip>
        )
      },
      responsive: ['md'],
      title: copy('updated'),
      width: 120,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, post) => (
        <PostRowActions
          menuItems={() => menuItemsFor(post)}
          onEdit={() => openEdit(post)}
          post={post}
        />
      ),
      title: '',
      width: 112,
    },
  ]

  let emptyNode: ReactNode
  if (postsQuery.isError) {
    emptyNode = (
      <PostsError kind="failed" onRetry={() => void postsQuery.refetch()} />
    )
  } else {
    emptyNode = (
      <PostsEmpty
        kind={emptyKind}
        onBack={() => setPage(1)}
        onClear={() => {
          clearSearch()
          setCategoryId(allCategoriesValue)
        }}
        onWrite={() => openEdit()}
      />
    )
  }

  const showStale = postsQuery.isError && posts.length > 0
  const showCategoryAlert = categoriesQuery.isError
  const showPartial = failedDeleteIds.length > 0

  const filters = (
    <div className={styles.filters} key="filters">
      <SearchBar
        allowClear
        aria-label={copy('searchLabel')}
        className={styles.search}
        onInputChange={(value) => {
          setKeywordInput(value)
          if (!value && keyword) clearSearch()
        }}
        onSearch={(value) => {
          setKeywordInput(value)
          submitSearch(value)
        }}
        placeholder={copy('searchPlaceholder')}
        value={keywordInput}
      />
      <Tooltip title={searchActive ? copy('filterDisabled') : undefined}>
        <span>
          <Select
            aria-label={copy('categoryLabel')}
            disabled={searchActive}
            onChange={(value) => {
              if (typeof value !== 'string') return
              setCategoryId(value)
            }}
            options={[
              { label: copy('allCategories'), value: allCategoriesValue },
              ...categories.map((category) => ({
                label: category.name,
                value: category.id,
              })),
            ]}
            popupMatchSelectWidth={false}
            value={categoryId}
          />
        </span>
      </Tooltip>
      <Tooltip title={searchActive ? copy('filterDisabled') : undefined}>
        <span>
          <Select
            aria-label={copy('sortLabel')}
            disabled={searchActive}
            onChange={(value) => {
              if (typeof value !== 'string') return
              const next = sortChoices.find(
                (choice) => sortValue(choice.sortKey, choice.order) === value,
              )
              if (!next) return
              setSort({ field: next.sortKey, order: next.order })
            }}
            options={sortChoices.map((choice) => ({
              label: copy(choice.copyKey),
              value: sortValue(choice.sortKey, choice.order),
            }))}
            popupMatchSelectWidth={false}
            value={sortValue(sortKey, sortOrder)}
          />
        </span>
      </Tooltip>
    </div>
  )

  return (
    <FocusScope className={styles.root} id={FOCUS_SCOPE_ID}>
      <Page
        count={pagination ? pagination.total : undefined}
        title={copy('title')}
        width="wide"
      >
        {showStale || showCategoryAlert || showPartial ? (
          <div className={styles.alerts}>
            {showStale ? (
              <Alert
                action={
                  <Button
                    htmlType="button"
                    onClick={() => void postsQuery.refetch()}
                  >
                    {copy('retry')}
                  </Button>
                }
                description={copy('staleDescription')}
                title={copy('staleTitle')}
                type="warning"
              />
            ) : null}
            {showCategoryAlert ? (
              <Alert
                action={
                  <Button
                    htmlType="button"
                    onClick={() => void categoriesQuery.refetch()}
                  >
                    {copy('retry')}
                  </Button>
                }
                description={copy('categoriesFailedDescription')}
                title={copy('categoriesFailedTitle')}
                type="warning"
              />
            ) : null}
            {showPartial ? (
              <Alert
                action={
                  <Button
                    htmlType="button"
                    onClick={() =>
                      confirmAndDelete(
                        failedDeleteIds.map((id) => {
                          const post = posts.find((item) => item.id === id)
                          return {
                            id,
                            title: post
                              ? postTitle(post, copy('untitled'))
                              : copy('untitled'),
                          }
                        }),
                      )
                    }
                  >
                    {copy('retryFailed')}
                  </Button>
                }
                closable={{ onClose: () => setFailedDeleteIds([]) }}
                description={copy('batchPartialDescription')}
                title={
                  failedDeleteIds.length === 1
                    ? copy('batchPartialTitleOne')
                    : copy('batchPartialTitle', {
                        failed: failedDeleteIds.length,
                      })
                }
                type="warning"
              />
            ) : null}
          </div>
        ) : null}
        <ProTable<PostModel>
          columnEmptyText={copy('emptyValue')}
          columns={columns}
          dataSource={posts}
          loading={postsQuery.isFetching && !initialLoading}
          locale={{ emptyText: emptyNode }}
          onRow={(post) =>
            ({
              'data-cursor': selection.isCursor(post.id) ? '' : undefined,
              'data-id': post.id,
              'data-scope-item': 'row',
              onClick: (event) => {
                if (isInteractiveTarget(event.target)) return
                selection.setCursor(post.id)
                if (event.shiftKey) selection.selectRange(post.id)
                else if (event.metaKey || event.ctrlKey)
                  selection.toggleWithAnchor(post.id)
                else openEdit(post)
              },
              onContextMenu: (event) => {
                event.preventDefault()
                selection.setCursor(post.id)
                showContextMenu(menuItemsFor(post))
              },
              tabIndex: -1,
            }) as HTMLAttributes<HTMLElement>
          }
          options={{
            density: false,
            fullScreen: false,
            reload: () => void postsQuery.refetch(),
            search: false,
            setting: false,
          }}
          pagination={{
            current: page,
            hideOnSinglePage: true,
            onChange: (nextPage) => setPage(nextPage),
            pageSize: postsPageSize,
            showSizeChanger: false,
            total: pagination?.total ?? 0,
          }}
          rowClassName={() => styles.row}
          rowKey="id"
          rowSelection={{
            onChange: (keys) => {
              const next = new Set(keys.map(String))
              for (const post of posts) {
                if (next.has(post.id) !== selection.isSelected(post.id)) {
                  selection.toggle(post.id)
                }
              }
            },
            selectedRowKeys: [...selection.selectedIds],
          }}
          search={false}
          tableAlertOptionRender={() => (
            <div className={styles.selectionBar}>
              <Button
                danger
                htmlType="button"
                icon={Trash2}
                loading={deleting}
                onClick={() =>
                  confirmAndDelete(
                    toDeleteTargets(selection.getSelectedTargets()),
                  )
                }
                size="small"
              >
                {copy('bulkDelete')}
              </Button>
              <Button
                htmlType="button"
                icon={X}
                onClick={() => selection.clear()}
                size="small"
                type="text"
              >
                {copy('clearSelection')}
              </Button>
            </div>
          )}
          tableAlertRender={() => (
            <Text weight={500}>
              {copy('selected', { count: selectedCount })}
            </Text>
          )}
          tableRender={(_props, dom) => {
            if (initialLoading && showSlow) {
              return (
                <PostsError
                  kind="slow"
                  onRetry={() => void postsQuery.refetch()}
                />
              )
            }
            return initialLoading ? <TableSkeleton rows={8} /> : dom
          }}
          toolBarRender={() => [filters]}
          variant="outlined"
        />
      </Page>
    </FocusScope>
  )
}
