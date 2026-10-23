import {
  Button,
  createStaticStyles,
  css,
  cssVar,
  cx,
  Flexbox,
  Hotkey,
} from '@lobehub/ui'
import {
  Breadcrumb,
  ConsoleBrand,
  ConsoleNav,
  ConsoleShell,
  PageLoading,
  SurfaceLinkProvider,
  type SurfaceRenderLink,
} from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'
import { sidebarTree } from 'virtual:admin-routes'

import { getAppInfo } from '~/api/system'
import { failedTasksQuery } from '~/features/dashboard/queries'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { useCommandPalette } from '~/ui/command-palette'
import { filterSidebarNode } from '~/ui/layout/filter-sidebar-node'

import faviconUrl from '../favicon.png'
import { ConsoleFooter } from './layouts/console-footer'
import { toBreadcrumbItems, toConsoleNavigation } from './layouts/console-nav'

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
  logo: css`
    display: block;
    width: 20px;
    height: 20px;
    object-fit: cover;
  `,
  navigation: css`
    display: flex;
    flex: 1;
    flex-direction: column;

    min-block-size: 0;
  `,
  search: css`
    min-inline-size: 200px;
    justify-content: space-between;
    color: ${cssVar.colorTextTertiary};
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
}))

const WRITE_PATH = '/posts/edit'

function ShellTools() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const palette = useCommandPalette()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const writing = location.pathname === WRITE_PATH

  return (
    <Flexbox align="center" gap={8} horizontal>
      {palette ? (
        isDesktop ? (
          <Button
            className={styles.search}
            icon={Search}
            onClick={palette.open}
            size="small"
            type="default"
          >
            <Flexbox
              align="center"
              flex={1}
              gap={8}
              horizontal
              justify="space-between"
            >
              <span>{t('common.search')}</span>
              <Hotkey keys="mod+k" />
            </Flexbox>
          </Button>
        ) : (
          <Button
            aria-label={t('common.search')}
            icon={Search}
            onClick={palette.open}
            size="small"
            type="default"
          />
        )
      ) : null}
      {writing ? null : (
        <Button
          icon={Plus}
          onClick={() => navigate(WRITE_PATH)}
          size="small"
          type="primary"
        >
          {t('routes.writePost.title')}
        </Button>
      )}
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

export function ShellBrand() {
  return (
    <ConsoleBrand
      href="/dashboard"
      label="Byline"
      logo={<img alt="" className={styles.logo} src={faviconUrl} />}
      renderLink={renderRouterLink}
      title="Byline"
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
          <PageLoading label={props.label} />
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
  const breadcrumbItems = useMemo(
    () => toBreadcrumbItems(sections, location.pathname, t),
    [location.pathname, sections, t],
  )
  const sectionDividerClass = navSectionDividerClass(
    navigation.dividerBefore.flatMap((key) => {
      const index = navigation.groups.findIndex((group) => group.key === key)
      if (index < 0) return []
      return [index + 1 + (navigation.items.length > 0 ? 1 : 0)]
    }),
  )

  return (
    <ConsoleShell
      className={styles.shell}
      closeNavigationLabel={t('common.closeNavigation')}
      collapseLabel={t('ui.layout.collapseSidebar')}
      expandLabel={t('ui.layout.expandSidebar')}
      footer={<ConsoleFooter />}
      openNavigationLabel={t('common.openNavigation')}
      skipToContentLabel={t('common.skipToContent')}
      storageKey={SHELL_STORAGE_KEY}
      tools={<ShellTools />}
      brand={<ShellBrand />}
      breadcrumb={
        <Breadcrumb items={breadcrumbItems} renderLink={renderRouterLink} />
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
      <SurfaceLinkProvider renderLink={renderSurfaceLink}>
        <div className={styles.content}>{props.children}</div>
      </SurfaceLinkProvider>
    </ConsoleShell>
  )
}
