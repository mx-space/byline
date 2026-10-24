import { Empty, Hotkey, Icon, Modal, SearchBar } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, FileText, Search } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Link, useNavigate } from 'react-router'
import type { SidebarSection } from 'virtual:admin-routes'

import { ApiRequestError } from '~/api/http'
import { getPosts, searchPosts } from '~/api/posts'
import { useI18n } from '~/i18n'
import type { PostModel } from '~/models/post'
import { Button } from '~/ui/site-button'

import {
  collectMatchingPosts,
  POST_SCAN_PAGE_SIZE,
  POST_SEARCH_SIZE,
  postSearchHref,
  postSearchMeta,
  postsListSearchHref,
} from './articles'
import {
  collectSearchPages,
  filterSearchPages,
  groupSearchPages,
} from './pages'
import { styles } from './style'

const COMPACT_QUERY = '(max-width: 991px)'
const SEARCH_DEBOUNCE_MS = 250

function shouldScanPosts(error: unknown) {
  return error instanceof ApiRequestError && error.status !== 401
}

async function loadPostSearch(keyword: string) {
  try {
    return await searchPosts({
      keyword,
      page: 1,
      size: POST_SEARCH_SIZE,
    })
  } catch (error) {
    if (!shouldScanPosts(error)) throw error
    return collectMatchingPosts(keyword, POST_SEARCH_SIZE, (page) =>
      getPosts({
        page,
        size: POST_SCAN_PAGE_SIZE,
        sort_by: 'modifiedAt',
        sort_order: 'desc',
      }),
    )
  }
}

const useIsCompact = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(COMPACT_QUERY)
      media.addEventListener('change', onStoreChange)
      return () => media.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  )

function useDebounced(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, value])
  return debounced
}

function SearchHit(props: {
  description?: string
  href: string
  icon: LucideIcon
  onNavigate: () => void
  title: string
}) {
  return (
    <Link
      className={styles.searchResult}
      onClick={props.onNavigate}
      to={props.href}
    >
      <span className={styles.glyph}>
        <Icon icon={props.icon} size={15} />
      </span>
      <span className={styles.spacer}>
        {props.title}
        {props.description ? (
          <small className={styles.searchResultMeta} title={props.description}>
            {props.description}
          </small>
        ) : null}
      </span>
      <Icon icon={ChevronRight} size={15} />
    </Link>
  )
}

export function GlobalSearch(props: { sections: readonly SidebarSection[] }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const isCompact = useIsCompact()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const fieldRef = useRef<HTMLDivElement>(null)
  const resultsObserver = useRef<ResizeObserver | null>(null)
  const keyword = query.trim()
  const debouncedKeyword = useDebounced(keyword, SEARCH_DEBOUNCE_MS)
  const keywordSettled = keyword === debouncedKeyword

  const pages = useMemo(
    () => collectSearchPages(props.sections, t),
    [props.sections, t],
  )
  const bindResults = useCallback((node: HTMLDivElement | null) => {
    resultsObserver.current?.disconnect()
    resultsObserver.current = null
    if (!node) return
    const apply = () => {
      const next = `${node.offsetWidth - node.clientWidth}px`
      if (node.style.getPropertyValue('--search-scrollbar') !== next) {
        node.style.setProperty('--search-scrollbar', next)
      }
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    resultsObserver.current = observer
  }, [])

  const groups = useMemo(
    () => groupSearchPages(pages, query, t('shell.search.pages')),
    [pages, query, t],
  )
  const articles = useQuery({
    enabled: open && debouncedKeyword.length > 0,
    queryFn: () => loadPostSearch(debouncedKeyword),
    queryKey: ['shell', 'post-search', debouncedKeyword],
    staleTime: 30_000,
  })
  const articleItems: PostModel[] =
    keywordSettled && articles.data ? articles.data.data : []
  const articlesLoading =
    keyword.length > 0 &&
    (!keywordSettled || articles.isFetching) &&
    articleItems.length === 0
  const articlesFailed = keywordSettled && articles.isError
  const articleTotal = keywordSettled
    ? (articles.data?.pagination.total ?? 0)
    : 0

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.key.toLowerCase() !== 'k') return
      if (!(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      setOpen((current) => !current)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const close = () => setOpen(false)
  const openSearch = () => setOpen(true)

  const openFirst = (value: string) => {
    const nextKeyword = value.trim()
    if (!nextKeyword) return
    const page = filterSearchPages(pages, nextKeyword)[0]
    if (page) {
      setOpen(false)
      navigate(page.href)
      return
    }
    if (nextKeyword !== debouncedKeyword) return
    const article = articles.data?.data[0]
    if (!article) return
    setOpen(false)
    navigate(postSearchHref(article.id))
  }

  const showArticles = keyword.length > 0
  const noMatches =
    groups.length === 0 &&
    !articlesLoading &&
    !articlesFailed &&
    articleItems.length === 0

  return (
    <>
      {isCompact ? (
        <Button
          aria-label={t('shell.search.label')}
          icon={Search}
          onClick={openSearch}
          title={t('shell.search.label')}
          type="text"
        />
      ) : (
        <SearchBar
          readOnly
          aria-keyshortcuts="Meta+K Control+K"
          aria-label={t('shell.search.label')}
          classNames={{ input: styles.searchTrigger }}
          enableShortKey={false}
          onClick={openSearch}
          onFocus={(event) => {
            event.currentTarget.blur()
            openSearch()
          }}
          placeholder={t('shell.search.trigger')}
          style={{ width: 220 }}
          suffix={<Hotkey compact keys="mod+k" />}
          variant="outlined"
        />
      )}
      <Modal
        destroyOnHidden
        afterOpenChange={(next) => {
          if (!next) return
          fieldRef.current
            ?.querySelector('input')
            ?.focus({ preventScroll: true })
        }}
        footer={false}
        onCancel={close}
        open={open}
        styles={{
          body: { padding: 0, paddingBlock: 0, paddingInline: 0 },
          wrapper: { alignItems: 'flex-start', paddingBlockStart: 72 },
        }}
        title={t('shell.search.label')}
        width={560}
      >
        <div className={styles.searchField} ref={fieldRef}>
          <SearchBar
            aria-label={t('shell.search.label')}
            onInputChange={setQuery}
            onSearch={openFirst}
            placeholder={t('shell.search.placeholder')}
            value={query}
          />
        </div>
        <div
          aria-live="polite"
          className={styles.searchResults}
          ref={bindResults}
        >
          {groups.map((group) => (
            <section key={group.label}>
              <h3 className={styles.searchSection}>{group.label}</h3>
              {group.pages.map((page) => (
                <SearchHit
                  description={page.description}
                  href={page.href}
                  icon={page.icon ?? FileText}
                  key={page.href}
                  onNavigate={close}
                  title={page.title}
                />
              ))}
            </section>
          ))}
          {showArticles &&
          (articlesLoading || articlesFailed || articleItems.length > 0) ? (
            <section>
              <h3 className={styles.searchSection}>
                {t('shell.search.posts')}
              </h3>
              {articlesLoading ? (
                <p className={styles.searchStatus}>
                  {t('shell.search.postsLoading')}
                </p>
              ) : null}
              {articlesFailed ? (
                <div className={styles.searchStatus}>
                  <span>{t('shell.search.postsError')}</span>
                  <Button onClick={() => articles.refetch()} size="small">
                    {t('common.retry')}
                  </Button>
                </div>
              ) : null}
              {articleItems.map((post) => (
                <SearchHit
                  description={postSearchMeta(
                    post,
                    t('shell.search.unpublished'),
                  )}
                  href={postSearchHref(post.id)}
                  icon={FileText}
                  key={post.id}
                  onNavigate={close}
                  title={post.title || post.slug}
                />
              ))}
              {articleTotal > articleItems.length ? (
                <SearchHit
                  href={postsListSearchHref(debouncedKeyword)}
                  icon={Search}
                  onNavigate={close}
                  title={t('shell.search.postsMore')}
                />
              ) : null}
            </section>
          ) : null}
          {noMatches ? (
            <Empty
              description={t('shell.search.hint')}
              icon={Search}
              title={t('shell.search.empty')}
              action={
                query ? (
                  <Button onClick={() => setQuery('')} size="small">
                    {t('shell.search.clear')}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </div>
      </Modal>
    </>
  )
}
