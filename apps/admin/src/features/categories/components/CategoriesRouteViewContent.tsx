import {
  ActionIcon,
  Alert,
  Button,
  Empty,
  SearchBar,
  Tooltip,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router'

import { getCategories } from '~/api/categories'
import { useCollectionListQuery, useEntityList } from '~/data/resource/hooks'
import type { CategoryEntity } from '~/data/resources/category'
import { categories } from '~/data/resources/category'
import { adminQueryKeys } from '~/query/keys'
import { Page } from '~/ui/page'

import { useCategoryCopy } from '../copy'
import { useConfirmDeleteCategory } from '../hooks/use-category-mutations'
import { categoryStyles } from '../styles'
import { isForbiddenError } from '../utils/errors'
import { formatAbsoluteTime } from '../utils/slug'
import { CategoryFormModal } from './CategoryFormModal'

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest('a,button,input,[role="menuitem"],[data-row-actions]'),
    )
  )
}

export function CategoriesRouteViewContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { format, text } = useCategoryCopy()
  const [params, setParams] = useSearchParams()
  const queryText = params.get('q') ?? ''
  const [creating, setCreating] = useState(false)
  const confirmDelete = useConfirmDeleteCategory()

  const categoriesQuery = useCollectionListQuery(categories, {
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: adminQueryKeys.categories.list(),
    toPage: (result) => ({ items: result }),
  })
  const categoriesList = useEntityList(
    categories,
    adminQueryKeys.categories.list(),
  )
  const items = categoriesList.items

  const filtered = useMemo(() => {
    const needle = queryText.trim().toLowerCase()
    if (!needle) return items
    return items.filter(
      (category) =>
        category.name.toLowerCase().includes(needle) ||
        category.slug.toLowerCase().includes(needle),
    )
  }, [items, queryText])

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const openCategory = (id: string) => {
    navigate({
      pathname: `/posts/category/${encodeURIComponent(id)}`,
      search: location.search,
    })
  }

  const isLast = items.length === 1
  const forbidden = isForbiddenError(categoriesQuery.error)
  const initialLoading = categoriesQuery.isLoading && items.length === 0
  const showStale = categoriesQuery.isError && items.length > 0

  const columns: ProColumns<CategoryEntity>[] = [
    {
      dataIndex: 'name',
      render: (_dom, category) => (
        <div className={categoryStyles.nameCell}>
          <span className={categoryStyles.name} title={category.name}>
            {category.name}
          </span>
          <span className={categoryStyles.slug}>/{category.slug}</span>
        </div>
      ),
      title: text('columnName'),
    },
    {
      align: 'right',
      dataIndex: 'count',
      render: (_dom, category) => {
        const count = category.count ?? 0
        if (count === 0)
          return <span className={categoryStyles.countZero}>0</span>
        return (
          <Link
            className={categoryStyles.count}
            title={text('viewPostsTitle')}
            to={{
              pathname: '/posts',
              search: `?category=${encodeURIComponent(category.id)}`,
            }}
          >
            {format.number(count)}
          </Link>
        )
      },
      title: text('columnCount'),
      width: 96,
    },
    {
      dataIndex: 'createdAt',
      render: (_dom, category) => (
        <Tooltip
          title={formatAbsoluteTime(category.createdAt, text('emptyValue'))}
        >
          <span className={categoryStyles.time}>
            {category.createdAt
              ? format.relativeTime(category.createdAt)
              : text('emptyValue')}
          </span>
        </Tooltip>
      ),
      responsive: ['md'],
      title: text('columnCreated'),
      width: 140,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, category) => {
        const count = category.count ?? 0
        return (
          <div className={categoryStyles.actions} data-row-actions="">
            <ActionIcon
              aria-label={text('edit')}
              icon={Pencil}
              onClick={() => openCategory(category.id)}
              size="small"
              title={text('edit')}
            />
            <ActionIcon
              aria-label={text('delete')}
              disabled={count > 0}
              icon={Trash2}
              onClick={() => confirmDelete(category, { isLast })}
              size="small"
              title={
                count > 0 ? text('deleteBlocked', { count }) : text('delete')
              }
            />
          </div>
        )
      },
      title: '',
      width: 88,
    },
  ]

  const createButton = (
    <Button icon={Plus} onClick={() => setCreating(true)} type="primary">
      {text('create')}
    </Button>
  )

  let emptyNode: ReactNode
  if (categoriesQuery.isError) {
    emptyNode = (
      <Empty
        action={
          forbidden ? undefined : (
            <Button onClick={() => void categoriesQuery.refetch()}>
              {text('retry')}
            </Button>
          )
        }
        description={forbidden ? text('forbiddenDescription') : undefined}
        title={forbidden ? text('forbiddenTitle') : text('loadErrorTitle')}
      />
    )
  } else if (queryText.trim()) {
    emptyNode = (
      <Empty
        action={
          <Button onClick={() => setQuery('')}>{text('clearSearch')}</Button>
        }
        title={text('filterEmptyTitle')}
      />
    )
  } else {
    emptyNode = (
      <Empty
        action={createButton}
        description={text('emptyDescription')}
        icon={FolderOpen}
        title={text('emptyTitle')}
      />
    )
  }

  return (
    <Page
      actions={forbidden && items.length === 0 ? undefined : createButton}
      count={
        categoriesQuery.isSuccess || items.length > 0 ? items.length : undefined
      }
      description={text('description')}
      title={text('title')}
    >
      {showStale ? (
        <Alert
          action={
            <Button onClick={() => void categoriesQuery.refetch()}>
              {text('retry')}
            </Button>
          }
          description={text('staleDescription')}
          title={text('staleTitle')}
          type="warning"
        />
      ) : null}
      <ProTable<CategoryEntity>
        columnEmptyText={text('emptyValue')}
        columns={columns}
        dataSource={filtered}
        loading={
          categoriesQuery.isFetching && categoriesQuery.isPlaceholderData
        }
        locale={{ emptyText: emptyNode }}
        onRow={(category) => ({
          onClick: (event) => {
            if (isInteractiveTarget(event.target)) return
            openCategory(category.id)
          },
        })}
        options={{
          density: false,
          fullScreen: false,
          reload: () => void categoriesQuery.refetch(),
          search: false,
          setting: false,
        }}
        pagination={{
          hideOnSinglePage: true,
          pageSize: 20,
          showSizeChanger: false,
        }}
        rowClassName={() => categoryStyles.row}
        rowKey="id"
        search={false}
        tableRender={(_props, dom) =>
          initialLoading ? <TableSkeleton rows={5} /> : dom
        }
        toolBarRender={() => [
          <div className={categoryStyles.search} key="search">
            <SearchBar
              allowClear
              aria-label={text('searchPlaceholder')}
              enableShortKey={false}
              onInputChange={setQuery}
              placeholder={text('searchPlaceholder')}
              value={queryText}
            />
          </div>,
        ]}
        variant="outlined"
      />
      <CategoryFormModal
        mode="create"
        onClose={() => setCreating(false)}
        open={creating}
      />
      <Outlet />
    </Page>
  )
}
