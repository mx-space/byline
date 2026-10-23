import { Button } from '@lobehub/ui'
import { useLocation, useNavigate, useParams } from 'react-router'

import { getCategory } from '~/api/categories'
import {
  useCollectionDetailQuery,
  useEntity,
  useEntityList,
} from '~/data/resource/hooks'
import { categories } from '~/data/resources/category'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { adminQueryKeys } from '~/query/keys'

import { useCategoryCopy } from '../copy'
import { isForbiddenError, isNotFoundError } from '../utils/errors'
import { categoryIdFromRouteParam } from '../utils/route-id'
import { CategoryFormModal, CategoryModalState } from './CategoryFormModal'

export function CategoryDetailRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const categoryId = categoryIdFromRouteParam(params.id)
  const { text } = useCategoryCopy()
  const category = useEntity(categories, categoryId ?? undefined)
  const list = useEntityList(categories, adminQueryKeys.categories.list())
  const detailQuery = useCollectionDetailQuery(categories, {
    enabled: Boolean(categoryId),
    queryFn: () => getCategory(categoryId ?? ''),
    queryKey: categoryId
      ? adminQueryKeys.categories.detail(categoryId)
      : adminQueryKeys.categories.root,
  })

  useDocumentTitle(category?.name)

  const close = () => {
    navigate({ pathname: '/posts/category', search: location.search })
  }

  if (category) {
    return (
      <CategoryFormModal
        category={category}
        isLast={list.isHydrated && list.items.length === 1}
        mode="edit"
        onClose={close}
        open
      />
    )
  }

  if (!categoryId || isNotFoundError(detailQuery.error)) {
    return (
      <CategoryModalState
        description={text('notFoundDescription')}
        onClose={close}
        title={text('notFoundTitle')}
      />
    )
  }

  if (isForbiddenError(detailQuery.error)) {
    return (
      <CategoryModalState
        description={text('forbiddenDescription')}
        onClose={close}
        title={text('forbiddenTitle')}
      />
    )
  }

  if (detailQuery.isError) {
    return (
      <CategoryModalState
        action={
          <Button onClick={() => void detailQuery.refetch()}>
            {text('retry')}
          </Button>
        }
        onClose={close}
        title={text('detailLoadErrorTitle')}
      />
    )
  }

  return (
    <CategoryModalState loading onClose={close} title={text('editTitle')} />
  )
}

export default CategoryDetailRoute
