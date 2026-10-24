import { ActionIcon, Alert, Center, Empty, SearchBar } from '@lobehub/ui'
import * as stylex from '@stylexjs/stylex'
import { Plus, RefreshCw, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useI18n } from '~/i18n'
import { ListPane } from '~/ui/page'
import { ListSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useDynamicCatalog } from '../hooks/use-dynamic-catalog'
import type { DynamicComponentItem } from '../types/dynamic-components'
import { styles } from './styles'

export function DynamicComponentList(props: {
  onCreate: () => void
  onSelect: (item: DynamicComponentItem) => void
  selectedId: string | null
}) {
  const { t } = useI18n()
  const { items, query } = useDynamicCatalog()
  const [search, setSearch] = useState('')
  const hasItems = items.length > 0

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.url.toLowerCase().includes(keyword),
    )
  }, [items, search])

  const body = (() => {
    if (query.isPending) return <ListSkeleton rows={4} />
    if (query.isError && !hasItems) {
      return (
        <Center className={stylex.props(styles.empty).className}>
          <Empty
            action={
              <Button onClick={() => void query.refetch()}>
                {t('common.retry')}
              </Button>
            }
            description={query.error.message}
            icon={RefreshCw}
            title={t('dynamicComponents.loadFailed')}
          />
        </Center>
      )
    }
    if (visibleItems.length === 0) {
      return (
        <Center className={stylex.props(styles.empty).className}>
          <Empty icon={SearchX} title={t('dynamicComponents.noMatch')} />
        </Center>
      )
    }
    return (
      <nav aria-label={t('dynamicComponents.title')}>
        {visibleItems.map((item) => (
          <DynamicComponentRow
            item={item}
            key={item.id}
            onSelect={() => props.onSelect(item)}
            selected={item.id === props.selectedId}
          />
        ))}
      </nav>
    )
  })()

  return (
    <ListPane
      actions={
        <>
          <ActionIcon
            aria-label={t('dynamicComponents.refreshAria')}
            icon={RefreshCw}
            loading={query.isFetching && !query.isPending}
            onClick={() => void query.refetch()}
            title={t('dynamicComponents.refreshAria')}
          />
          <ActionIcon
            aria-label={t('dynamicComponents.add')}
            icon={Plus}
            onClick={props.onCreate}
            title={t('dynamicComponents.add')}
          />
        </>
      }
      aria-busy={query.isFetching}
      count={hasItems ? items.length : undefined}
      notices={
        query.isError && hasItems ? (
          <Alert
            action={
              <Button onClick={() => void query.refetch()} size="small">
                {t('common.retry')}
              </Button>
            }
            showIcon
            title={t('dynamicComponents.loadFailed')}
            type="warning"
          />
        ) : undefined
      }
      title={t('dynamicComponents.title')}
      toolbar={
        hasItems ? (
          <SearchBar
            aria-label={t('dynamicComponents.searchPlaceholder')}
            className={stylex.props(styles.search).className}
            enableShortKey={false}
            onInputChange={setSearch}
            placeholder={t('dynamicComponents.searchPlaceholder')}
            value={search}
          />
        ) : undefined
      }
    >
      {body}
    </ListPane>
  )
}

function DynamicComponentRow(props: {
  item: DynamicComponentItem
  onSelect: () => void
  selected: boolean
}) {
  return (
    <button
      aria-current={props.selected ? 'true' : undefined}
      {...stylex.props(styles.row, props.selected && styles.rowCurrent)}
      onClick={props.onSelect}
      title={props.item.url}
      type="button"
    >
      <span {...stylex.props(styles.rowMain)}>
        <span {...stylex.props(styles.rowName)}>{props.item.name}</span>
        <span {...stylex.props(styles.rowUrl)}>{props.item.url}</span>
      </span>
      <span {...stylex.props(styles.rowHeight)}>
        {props.item.initialHeight}px
      </span>
    </button>
  )
}
