import {
  Drawer,
  Empty,
  Flexbox,
  Input,
  Pagination,
  Tag,
  TextArea,
  toast,
} from '@lobehub/ui'
import { LoadingAnnouncer, TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { TranslationEntry, TranslationEntryKeyPath } from '~/api/ai'
import {
  deleteTranslationEntry,
  generateTranslationEntries,
  getTranslationEntries,
  updateTranslationEntry,
} from '~/api/ai'
import { useUrlListState } from '~/features/_shared/hooks/use-url-list-state'
import { adminQueryKeys } from '~/query/keys'
import { readSingleFilter } from '~/ui/data/table-header'
import { confirmDialog } from '~/ui/feedback/confirm'
import { Page } from '~/ui/page'
import { emptyOr } from '~/ui/placeholders'
import {
  pinEnd,
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import { translationEntryKeyPathOptions } from '../constants'
import { useAiCopy } from '../copy'
import { aiStyles } from '../shell/styles'
import { getErrorMessage } from '../utils/ai'

const PAGE_SIZE = 20

function readPositiveInt(value: null | string) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}

function isKeyPath(value: string): value is TranslationEntryKeyPath {
  return (translationEntryKeyPathOptions as readonly string[]).includes(value)
}

interface TranslationEntriesUrlState {
  keyPath: TranslationEntryKeyPath | ''
  lang: string
  page: number
}

function writeTranslationEntriesUrlState(state: TranslationEntriesUrlState) {
  const next = new URLSearchParams()
  if (state.page > 1) next.set('page', String(state.page))
  if (state.keyPath) next.set('keyPath', state.keyPath)
  if (state.lang) next.set('lang', state.lang)
  return next
}

function usageLabel(
  keyPath: TranslationEntryKeyPath,
  copy: ReturnType<typeof useAiCopy>,
) {
  if (keyPath === 'category.name') return copy('usageCategory')
  return copy('usageTag')
}

export function AiTranslationEntriesRouteView() {
  const copy = useAiCopy()
  const table = useRecordTable()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<TranslationEntry | null>(null)
  const [draft, setDraft] = useState('')
  const urlStateOptions = useMemo(
    () => ({
      read: (searchParams: URLSearchParams): TranslationEntriesUrlState => {
        const rawKeyPath = searchParams.get('keyPath') ?? ''
        return {
          keyPath: rawKeyPath && isKeyPath(rawKeyPath) ? rawKeyPath : '',
          lang: searchParams.get('lang') ?? '',
          page: readPositiveInt(searchParams.get('page')),
        }
      },
      write: writeTranslationEntriesUrlState,
    }),
    [],
  )
  const [urlState, setUrlState] = useUrlListState(urlStateOptions)
  const { keyPath, lang, page } = urlState
  const params = {
    keyPath: keyPath || undefined,
    lang: lang.trim() || undefined,
    page,
    size: PAGE_SIZE,
  }
  const filtered = Boolean(keyPath || lang.trim())

  const query = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getTranslationEntries(params),
    queryKey: adminQueryKeys.ai.translationEntries(params),
  })

  const entries = query.data?.data ?? []
  const total = query.data?.pagination.total ?? entries.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.ai.translationEntriesRoot,
    })
  }

  const generateMutation = useMutation({
    mutationFn: () => generateTranslationEntries(),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('entryGenerateFailed'))),
    onSuccess: async (result) => {
      toast.success(
        copy('entryGenerated', {
          created: result.created,
          skipped: result.skipped,
        }),
      )
      await invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (entry: TranslationEntry) =>
      updateTranslationEntry(entry.id, { translatedText: draft }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('entrySaveFailed'))),
    onSuccess: async () => {
      toast.success(copy('entrySaved'))
      setEditing(null)
      await invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTranslationEntry,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('entryDeleteFailed'))),
    onSuccess: async () => {
      toast.success(copy('entryDeleted'))
      await invalidate()
    },
  })

  const confirmAndDelete = async (entry: TranslationEntry) => {
    const ok = await confirmDialog({
      cancelText: copy('cancel'),
      confirmText: copy('deleteEntry'),
      description: copy('deleteEntryBody'),
      destructive: true,
      title: copy('deleteEntryTitle'),
    })
    if (ok) deleteMutation.mutate(entry.id)
  }

  const glossaryColumns: ProColumns<TranslationEntry>[] = [
    {
      dataIndex: 'sourceText',
      title: copy('columnSource'),
    },
    {
      dataIndex: 'translatedText',
      render: (_dom, entry) => emptyOr(entry.translatedText),
      title: copy('columnTranslated'),
      width: 220,
    },
    {
      dataIndex: 'lang',
      render: (_dom, entry) => <Tag>{entry.lang}</Tag>,
      responsive: ['md'],
      title: copy('columnLang'),
      width: 96,
    },
    {
      dataIndex: 'keyPath',
      filterMultiple: false,
      filteredValue: keyPath ? [keyPath] : null,
      filters: translationEntryKeyPathOptions.map((option) => ({
        text: usageLabel(option, copy),
        value: option,
      })),
      onFilter: false,
      render: (_dom, entry) => (
        <span>
          {usageLabel(entry.keyPath, copy)}
          <span className={aiStyles.meta}> {entry.keyPath}</span>
        </span>
      ),
      responsive: ['lg'],
      title: copy('columnUsage'),
      width: 200,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, entry) => (
        <div className={aiStyles.actions}>
          <Button
            htmlType="button"
            onClick={() => {
              setDraft(entry.translatedText)
              setEditing(entry)
            }}
          >
            {copy('editEntry')}
          </Button>
          <Button
            danger
            htmlType="button"
            onClick={() => void confirmAndDelete(entry)}
          >
            {copy('deleteEntry')}
          </Button>
        </div>
      ),
      title: '',
      width: 180,
      ...pinEnd(table.pin),
    },
  ]

  const status =
    query.isLoading && entries.length === 0
      ? 'loading'
      : query.isError
        ? 'error'
        : entries.length === 0
          ? filtered
            ? 'filter-empty'
            : 'empty'
          : 'ready'

  return (
    <Page
      actions={
        <Button
          htmlType="button"
          loading={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
          type={editing ? 'default' : 'primary'}
        >
          {copy('generateEntries')}
        </Button>
      }
      count={copy('glossaryCount', { count: total })}
      title={copy('glossaryTitle')}
      width="wide"
    >
      <Flexbox align="center" gap={8} horizontal>
        <Input
          allowClear
          aria-label={copy('columnLang')}
          className={aiStyles.filterControl}
          onChange={(event) => {
            const value = typeof event === 'string' ? event : event.target.value
            setUrlState((current) => ({ ...current, lang: value, page: 1 }))
          }}
          placeholder={copy('langPlaceholder')}
          value={lang}
        />
        <Button
          aria-label={copy('refresh')}
          htmlType="button"
          icon={RefreshCw}
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        />
      </Flexbox>
      {status === 'loading' ? (
        <div aria-busy="true">
          <LoadingAnnouncer label={copy('glossaryLoading')} />
          <TableSkeleton rows={6} />
        </div>
      ) : null}
      {status === 'error' ? (
        <Empty
          action={
            <Button htmlType="button" onClick={() => void query.refetch()}>
              {copy('retryLoad')}
            </Button>
          }
          description={copy('glossaryFailedBody')}
          title={copy('glossaryFailedTitle')}
        />
      ) : null}
      {status === 'empty' || status === 'filter-empty' || status === 'ready' ? (
        <ProTable<TranslationEntry>
          className={recordTableStyles.root}
          columnEmptyText={copy('emptyValue')}
          columns={glossaryColumns}
          dataSource={entries}
          tableLayout="fixed"
          locale={{
            emptyText:
              status === 'filter-empty' ? (
                <Empty
                  action={
                    <Button
                      htmlType="button"
                      onClick={() =>
                        setUrlState({ keyPath: '', lang: '', page: 1 })
                      }
                    >
                      {copy('clearFilters')}
                    </Button>
                  }
                  description={copy('glossaryFilterBody')}
                  title={copy('glossaryFilterTitle')}
                />
              ) : (
                <Empty
                  description={copy('glossaryEmptyBody')}
                  title={copy('glossaryEmptyTitle')}
                />
              ),
          }}
          onChange={(_pagination, filters, _sorter, extra) => {
            if (extra.action !== 'filter') return
            const next = readSingleFilter(filters, 'keyPath') ?? ''
            setUrlState((current) => ({
              ...current,
              keyPath: isKeyPath(next) ? next : '',
              page: 1,
            }))
          }}
          options={false}
          pagination={false}
          rowKey="id"
          scroll={recordTableScroll(glossaryColumns, table)}
          search={false}
          variant="outlined"
        />
      ) : null}
      {status === 'ready' && pageCount > 1 ? (
        <Flexbox align="center" horizontal justify="space-between">
          <span className={aiStyles.meta}>{copy('pageIndex', { page })}</span>
          <Pagination
            current={page}
            onChange={(nextPage) => setUrlState({ page: nextPage })}
            pageSize={PAGE_SIZE}
            total={total}
          />
        </Flexbox>
      ) : null}
      <Drawer
        onClose={() => setEditing(null)}
        open={Boolean(editing)}
        placement="right"
        title={copy('editEntry')}
        width={420}
      >
        {editing ? (
          <form
            className={aiStyles.drawerForm}
            onSubmit={(event) => {
              event.preventDefault()
              updateMutation.mutate(editing)
            }}
          >
            <p className={aiStyles.meta}>
              {usageLabel(editing.keyPath, copy)} · {editing.lang}
            </p>
            <p className={aiStyles.prose}>{editing.sourceText}</p>
            <label className={aiStyles.field}>
              <span className={aiStyles.label}>{copy('columnTranslated')}</span>
              <TextArea
                onChange={(event) => setDraft(event.target.value)}
                rows={6}
                value={draft}
              />
            </label>
            <div className={aiStyles.actions}>
              <Button htmlType="button" onClick={() => setEditing(null)}>
                {copy('cancel')}
              </Button>
              <Button
                htmlType="submit"
                loading={updateMutation.isPending}
                type={editing ? 'primary' : 'default'}
              >
                {copy('saveEntry')}
              </Button>
            </div>
          </form>
        ) : null}
      </Drawer>
    </Page>
  )
}
