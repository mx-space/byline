import {
  ActionIcon,
  Alert,
  Center,
  createStaticStyles,
  Empty,
  Pagination,
  SearchBar,
  Segmented,
  Select,
} from '@lobehub/ui'
import { FileClock, RefreshCw, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'

import type { DraftModel } from '~/models/draft'
import { FocusScope } from '~/ui/focus-scope'
import type { ListAction, ListSelectionAPI } from '~/ui/list-actions'
import { ListPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { DRAFT_PAGE_SIZE } from '../constants'
import { useDraftCopy } from '../copy'
import type { DraftSort, DraftTypeFilter } from '../utils/draft-decision'
import { DraftListSkeleton } from './DraftListSkeleton'
import { DraftRow } from './DraftRow'
import { useDraftAuthors } from './use-draft-authors'

const styles = createStaticStyles(({ css }) => ({
  empty: css`
    height: 100%;
    padding: 24px;
  `,
  filter: css`
    flex: 1;
    min-width: 0;
  `,
  rows: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-block-end: 8px;
  `,
  search: css`
    flex: 1 1 100%;
  `,
  scope: css`
    height: 100%;
    min-height: 0;
  `,
  sort: css`
    flex: none;
    width: 7.5rem;
  `,
}))

export const DRAFT_LIST_SCOPE_ID = 'drafts-list'

export function DraftListPane(props: {
  actions: ReadonlyArray<ListAction<DraftModel>>
  detailId: string | null
  drafts: DraftModel[]
  error: string | null
  filter: DraftTypeFilter
  isFetching: boolean
  isPending: boolean
  keyword: string
  onClearSearch: () => void
  onFilterChange: (filter: DraftTypeFilter) => void
  onKeywordChange: (keyword: string) => void
  onOpen: (draft: DraftModel) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
  onSortChange: (sort: DraftSort) => void
  onWrite: () => void
  page: number
  searching: boolean
  selection: ListSelectionAPI<DraftModel>
  sort: DraftSort
  total: number | null
  totalPages: number
}) {
  const { copy } = useDraftCopy()
  const authorNames = useDraftAuthors()
  const { drafts, selection } = props

  const onRowSelect = (draft: DraftModel) => {
    selection.setCursor(draft.id)
    props.onOpen(draft)
  }

  const notices: ReactNode[] = []
  if (props.error && drafts.length > 0) {
    notices.push(
      <Alert
        action={
          <Button onClick={props.onRefresh} size="small">
            {copy('retry')}
          </Button>
        }
        description={props.error}
        key="error"
        showIcon
        title={copy('listErrorTitle')}
        type="warning"
      />,
    )
  }
  const body = (() => {
    if (props.isPending && drafts.length === 0) return <DraftListSkeleton />
    if (props.error && drafts.length === 0) {
      return (
        <Center className={styles.empty}>
          <Empty
            action={<Button onClick={props.onRefresh}>{copy('retry')}</Button>}
            description={props.error}
            icon={RefreshCw}
            title={copy('listErrorTitle')}
          />
        </Center>
      )
    }
    if (drafts.length === 0 && (props.keyword || props.filter !== 'all')) {
      return (
        <Center className={styles.empty}>
          <Empty
            action={
              props.keyword ? (
                <Button onClick={props.onClearSearch}>
                  {copy('clearSearch')}
                </Button>
              ) : undefined
            }
            description={props.keyword ? copy('filterEmptyBody') : undefined}
            icon={SearchX}
            title={copy('filterEmptyTitle')}
          />
        </Center>
      )
    }
    if (drafts.length === 0) {
      return (
        <Center className={styles.empty}>
          <Empty
            action={
              <Button onClick={props.onWrite} type="primary">
                {copy('listEmptyAction')}
              </Button>
            }
            description={copy('listEmptyBody')}
            icon={FileClock}
            title={copy('listEmptyTitle')}
          />
        </Center>
      )
    }
    return (
      <div className={styles.rows}>
        {drafts.map((draft) => (
          <DraftRow
            actions={props.actions}
            authorNames={authorNames}
            cursor={selection.isCursor(draft.id)}
            draft={draft}
            isDetailTarget={props.detailId === draft.id}
            key={draft.id}
            onSelect={() => onRowSelect(draft)}
          />
        ))}
      </div>
    )
  })()

  return (
    <FocusScope className={styles.scope} id={DRAFT_LIST_SCOPE_ID}>
      <ListPane
        actions={
          <ActionIcon
            aria-label={copy('refresh')}
            icon={RefreshCw}
            loading={props.isFetching && !props.isPending}
            onClick={props.onRefresh}
            size="small"
            title={copy('refresh')}
          />
        }
        aria-busy={props.isFetching}
        count={props.total ?? undefined}
        footer={
          props.totalPages > 1 && props.total != null ? (
            <Pagination
              current={props.page}
              onChange={props.onPageChange}
              pageSize={DRAFT_PAGE_SIZE}
              showSizeChanger={false}
              simple
              size="small"
              total={props.total}
            />
          ) : undefined
        }
        notices={notices.length > 0 ? notices : undefined}
        title={copy('title')}
        toolbar={
          <>
            <SearchBar
              aria-label={copy('searchLabel')}
              className={styles.search}
              enableShortKey={false}
              loading={props.searching}
              onInputChange={props.onKeywordChange}
              placeholder={copy('searchPlaceholder')}
              value={props.keyword}
            />
            <div
              aria-label={copy('filterLabel')}
              className={styles.filter}
              role="group"
            >
              <Segmented
                block
                onChange={(value) =>
                  props.onFilterChange(value as DraftTypeFilter)
                }
                options={[
                  { label: copy('filterAll'), value: 'all' },
                  { label: copy('filterNew'), value: 'new' },
                  { label: copy('filterChanged'), value: 'changed' },
                ]}
                size="small"
                value={props.filter}
              />
            </div>
            <Select
              aria-label={copy('sortLabel')}
              className={styles.sort}
              onChange={(value) => props.onSortChange(value as DraftSort)}
              options={[
                { label: copy('sortSaved'), value: 'saved' },
                { label: copy('sortOldest'), value: 'oldest' },
                { label: copy('sortTitle'), value: 'title' },
              ]}
              size="small"
              value={props.sort}
            />
          </>
        }
      >
        {body}
      </ListPane>
    </FocusScope>
  )
}
