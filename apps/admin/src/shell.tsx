import { createStaticStyles, css, cssVar, cx, Flexbox } from '@lobehub/ui'
import {
  Breadcrumb,
  ConsoleBrand,
  ConsoleNav,
  ConsoleShell,
  SurfaceLinkProvider,
  type SurfaceRenderLink,
  useConsoleShell,
} from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'
import { sidebarTree } from 'virtual:admin-routes'

import { getAppInfo } from '~/api/system'
import { failedTasksQuery } from '~/features/dashboard/queries'
import { useDocumentTitleOverride } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { Combine, LogoColor } from '~/ui/brand'
import { GlobalSearch } from '~/ui/global-search'
import { filterSidebarNode } from '~/ui/layout/filter-sidebar-node'
import { PageLoadingFrame } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { ConsoleFooter } from './layouts/console-footer'
import {
  artefactWriteBreadcrumb,
  productDetailBreadcrumb,
  toBreadcrumbItems,
  toConsoleNavigation,
  withDetailCrumb,
  withParentCrumb,
} from './layouts/console-nav'
import {
  type WriteTopbarSlots,
  WriteTopbarSlotsContext,
} from './layouts/write-topbar-slots'

const styles = createStaticStyles(({ css }) => ({
  content: css`
    display: flex;
    flex-direction: column;

    height: 100%;
    min-height: 0;

    overflow: hidden;
  `,
  loading: css`
    width: 100%;
    height: 100dvh;
    min-height: 0;
  `,
  navigation: css`
    display: flex;
    flex: 1;
    flex-direction: column;

    min-block-size: 0;
  `,
  shell: css`
    width: 100%;
    height: 100%;
    min-height: 0;

    .lobe-dashboard-console-shell__main {
      overflow: hidden;
      padding: 0;
    }
  `,
  shellWriting: css`
    .lobe-dashboard-console-shell__topbar-main {
      min-width: 0;
    }
  `,
  writeIdentity: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
  `,
  writeTrail: css`
    display: flex;
    align-items: center;
    gap: 8px;

    min-width: 0;
    max-width: 100%;

    > nav {
      flex: 0 1 auto;
      width: auto;
      min-width: 0;
    }

    > nav > span:last-child {
      min-width: 0;
    }

    > nav [aria-current='page'] {
      overflow: hidden;
      display: block;

      max-width: 240px;
      min-width: 0;

      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
}))

const WRITE_PATH = '/posts/edit'

const WRITE_BUTTON_PATHS = new Set(['/dashboard', '/posts', '/posts/scheduled'])

function ShellTools(props: {
  pathname: string
  sections: readonly SidebarSection[]
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const showWrite = WRITE_BUTTON_PATHS.has(props.pathname)

  return (
    <Flexbox align="center" gap={8} horizontal>
      <GlobalSearch sections={props.sections} />
      {showWrite ? (
        <Button
          icon={Plus}
          onClick={() => navigate(WRITE_PATH)}
          shape="round"
          type="primary"
        >
          {t('routes.writePost.title')}
        </Button>
      ) : null}
    </Flexbox>
  )
}

function navSectionDividerClass(childIndexes: number[]) {
  if (childIndexes.length === 0) return undefined

  return css`
    ${childIndexes
      .map(
        (index) => `
          & nav > :nth-child(${index})[data-level='0'][data-icon='true'] {
            margin-block-start: 6px;
            padding-block-start: 8px;
            border-block-start: 1px solid ${cssVar.colorBorderSecondary};
          }
        `,
      )
      .join('')}
  `
}

const SHELL_STORAGE_KEY = 'byline-console-shell'

const BRAND_RAIL_SIZE = 24
const BRAND_LOCKUP_SIZE = 40
const BRAND_WORDMARK_SIZE = 20

export function ShellBrand() {
  const { collapsed } = useConsoleShell()
  const { t } = useI18n()

  return (
    <ConsoleBrand
      href="/dashboard"
      label="Byline"
      logo={
        collapsed ? (
          <LogoColor aria-hidden size={BRAND_RAIL_SIZE} />
        ) : (
          <Combine
            aria-hidden
            caption={t('shell.brand.derivedFrom')}
            size={BRAND_LOCKUP_SIZE}
            textSize={BRAND_WORDMARK_SIZE}
          />
        )
      }
      renderLink={renderRouterLink}
    />
  )
}

export function LayoutLoading(props: { label: string }) {
  return (
    <ConsoleShell
      loading
      brand={<ShellBrand />}
      className={styles.loading}
      storageKey={SHELL_STORAGE_KEY}
      loadingContent={
        <div className={styles.content}>
          <PageLoadingFrame label={props.label} />
        </div>
      }
    />
  )
}

const renderSurfaceLink: SurfaceRenderLink = ({ children, href, ...rest }) => (
  <Link to={href} {...rest}>
    {children}
  </Link>
)

function renderRouterLink({
  children,
  className,
  href,
  onClick,
  ...rest
}: {
  children: ReactNode
  className: string
  href: string
  onClick?: () => void
}) {
  return (
    <Link className={className} onClick={onClick} to={href} {...rest}>
      {children}
    </Link>
  )
}

function visibleSections(
  sections: SidebarSection[],
  includeDebug: boolean,
): SidebarSection[] {
  if (includeDebug) return sections
  return sections
    .map((section) => ({
      ...section,
      items: section.items.flatMap((node) => {
        const visible: SidebarNode | null = filterSidebarNode(node)
        return visible ? [visible] : []
      }),
    }))
    .filter((section) => section.items.length > 0)
}

export function AdminShell(props: PropsWithChildren) {
  const location = useLocation()
  const { t } = useI18n()
  const writing = location.pathname === WRITE_PATH
  const [identitySlot, setIdentitySlot] = useState<HTMLDivElement | null>(null)
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null)
  const [pageTitle, setPageTitle] = useState<string | null>(null)
  const topbarSlots = useMemo<WriteTopbarSlots>(
    () => ({
      actions: actionsSlot,
      identity: identitySlot,
      setPageTitle,
    }),
    [actionsSlot, identitySlot],
  )
  const appInfoQuery = useQuery({
    queryFn: getAppInfo,
    queryKey: ['shell', 'app-info'],
    retry: false,
  })
  const includeDebug =
    window.injectData.PAGE_PROXY || appInfoQuery.data?.version === 'dev'
  const sections = useMemo(
    () => visibleSections(sidebarTree, includeDebug),
    [includeDebug],
  )
  const failedTasks = useQuery(failedTasksQuery)
  const failedCount = failedTasks.data?.total ?? 0
  const navigation = useMemo(
    () =>
      toConsoleNavigation(
        sections,
        t,
        failedCount ? { '/tasks': failedCount } : {},
      ),
    [failedCount, sections, t],
  )
  const detailTitle = useDocumentTitleOverride()
  const breadcrumbItems = useMemo(() => {
    const items = toBreadcrumbItems(sections, location.pathname, t)
    if (/^\/users\/[^/]+$/.test(location.pathname)) {
      return withDetailCrumb(
        items,
        `/users${location.search}`,
        t('routes.users.detail'),
      )
    }
    const product = productDetailBreadcrumb(
      location.pathname,
      location.search,
      detailTitle || t('routes.ai.detail'),
      t,
    )
    if (product) return product
    if (location.pathname !== WRITE_PATH) return items
    const translationTrail = artefactWriteBreadcrumb(
      location.search,
      pageTitle || t('routes.ai.detail'),
      t,
    )
    if (translationTrail) return translationTrail
    const trail = withParentCrumb(items, {
      href: '/posts',
      label: t('routes.posts.title'),
    })
    if (!pageTitle) return trail
    return trail.map((item, index) =>
      index === trail.length - 1 ? { ...item, label: pageTitle } : item,
    )
  }, [detailTitle, location.pathname, location.search, pageTitle, sections, t])
  const sectionDividerClass = navSectionDividerClass(
    navigation.dividerBefore.flatMap((key) => {
      const index = navigation.groups.findIndex((group) => group.key === key)
      if (index < 0) return []
      return [index + 1 + (navigation.items.length > 0 ? 1 : 0)]
    }),
  )

  return (
    <ConsoleShell
      className={cx(styles.shell, writing && styles.shellWriting)}
      closeNavigationLabel={t('common.closeNavigation')}
      collapseLabel={t('ui.layout.collapseSidebar')}
      expandLabel={t('ui.layout.expandSidebar')}
      footer={<ConsoleFooter />}
      openNavigationLabel={t('common.openNavigation')}
      skipToContentLabel={t('common.skipToContent')}
      storageKey={SHELL_STORAGE_KEY}
      tools={
        writing ? (
          <div ref={setActionsSlot} />
        ) : (
          <ShellTools pathname={location.pathname} sections={sections} />
        )
      }
      brand={<ShellBrand />}
      breadcrumb={
        writing ? (
          <div className={styles.writeTrail}>
            <Breadcrumb items={breadcrumbItems} renderLink={renderRouterLink} />
            <div className={styles.writeIdentity} ref={setIdentitySlot} />
          </div>
        ) : (
          <Breadcrumb items={breadcrumbItems} renderLink={renderRouterLink} />
        )
      }
      navigation={
        <div className={cx(styles.navigation, sectionDividerClass)}>
          <ConsoleNav
            defaultExpanded="all"
            groups={navigation.groups}
            items={navigation.items}
            label={t('common.primaryNavigation')}
            pathname={location.pathname}
            renderLink={renderRouterLink}
            storageKey="byline-console-nav"
          />
        </div>
      }
    >
      <WriteTopbarSlotsContext.Provider value={topbarSlots}>
        <SurfaceLinkProvider renderLink={renderSurfaceLink}>
          <div className={styles.content}>{props.children}</div>
        </SurfaceLinkProvider>
      </WriteTopbarSlotsContext.Provider>
    </ConsoleShell>
  )
}
