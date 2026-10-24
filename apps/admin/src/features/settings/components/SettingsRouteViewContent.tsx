import {
  Alert,
  confirmModal,
  createStaticStyles,
  Flexbox,
  List,
  SkeletonText,
  Text,
} from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { getFormSchema } from '~/api/options'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { FocusScope, useScopeArrowNav } from '~/ui/focus-scope'
import { MasterDetailShell } from '~/ui/layout/master-detail-shell'
import { DetailPlaceholder, ListPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { accountGroups } from '../constants'
import { settingsCopy } from '../copy'
import type { SettingsGroupSummary } from '../types/settings'
import { getGroupIcon, getGroupTitle } from '../utils/settings'
import { SettingsRouteContext } from './settings-route-context'

const styles = createStaticStyles(({ css, cssVar }) => ({
  heading: css`
    margin: 0;
    padding-block: 12px 4px;
    padding-inline: 12px;

    font-size: ${cssVar.fontSizeSM};
    font-weight: 500;
    color: ${cssVar.colorTextTertiary};
  `,
  nav: css`
    padding-block-end: 12px;
    padding-inline: 4px;
  `,
  scope: css`
    height: 100%;
    min-height: 0;
  `,
  skeleton: css`
    padding-inline: 12px;
  `,
}))

const SETTINGS_NAV_SCOPE_ID = 'settings-nav'

export function SettingsRouteViewContent() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const params = useParams<{ section?: string }>()
  const selectedSection = params.section ?? null
  const [searchParams] = useSearchParams()
  const queryGroup = searchParams.get('group')
  const leaveGuardRef = useRef<(() => boolean) | null>(null)
  const confirmingRef = useRef(false)

  const schemaQuery = useQuery({
    queryFn: getFormSchema,
    queryKey: adminQueryKeys.settings.schema(),
  })

  const systemGroups = useMemo<SettingsGroupSummary[]>(
    () =>
      schemaQuery.data?.groups.map((group) => ({
        description: group.description,
        icon: getGroupIcon(group.icon),
        key: group.key,
        systemGroup: group,
        title: group.title,
        type: 'system',
      })) ?? [],
    [schemaQuery.data?.groups],
  )

  const groups = useMemo(
    () => [...systemGroups, ...accountGroups],
    [systemGroups],
  )
  const groupsRef = useRef(groups)
  groupsRef.current = groups

  const activeKey = selectedSection ?? queryGroup ?? null

  const registerLeaveGuard = useCallback((guard: (() => boolean) | null) => {
    leaveGuardRef.current = guard
  }, [])

  const confirmLeave = useCallback(
    (go: () => void) => {
      if (!leaveGuardRef.current?.()) {
        go()
        return
      }
      if (confirmingRef.current) return
      confirmingRef.current = true
      confirmModal({
        cancelText: settingsCopy(locale, 'leaveCancel'),
        content: settingsCopy(locale, 'leaveBody'),
        okButtonProps: { danger: true },
        okText: settingsCopy(locale, 'leaveConfirm'),
        onCancel: () => {
          confirmingRef.current = false
        },
        onOk: () => {
          confirmingRef.current = false
          leaveGuardRef.current = null
          go()
        },
        title: settingsCopy(locale, 'leaveTitle'),
      })
    },
    [locale],
  )

  const navigateTo = useCallback(
    (pathname: string, replace = false) => {
      const next = new URLSearchParams(searchParams)
      next.delete('group')
      const search = next.toString()
      navigate({ pathname, search: search ? `?${search}` : '' }, { replace })
    },
    [navigate, searchParams],
  )

  const selectGroup = useCallback(
    (key: string) => {
      if (key === selectedSection) return
      confirmLeave(() => navigateTo(`/setting/${encodeURIComponent(key)}`))
    },
    [confirmLeave, navigateTo, selectedSection],
  )
  const selectGroupRef = useRef(selectGroup)
  selectGroupRef.current = selectGroup

  useScopeArrowNav({
    itemSelector: 'nav button',
    onItemFocus: (el) => {
      const nav = el.closest('nav')
      if (!nav) return
      const index = [...nav.querySelectorAll('button')].indexOf(
        el as HTMLButtonElement,
      )
      const group = groupsRef.current[index]
      if (group) selectGroupRef.current(group.key)
    },
    scopeId: SETTINGS_NAV_SCOPE_ID,
  })

  useEffect(() => {
    if (selectedSection) return
    if (queryGroup) {
      navigateTo(`/setting/${encodeURIComponent(queryGroup)}`, true)
      return
    }
    if (!isDesktop || schemaQuery.isLoading) return
    const first = groupsRef.current[0]
    if (first) navigateTo(`/setting/${encodeURIComponent(first.key)}`, true)
  }, [
    isDesktop,
    navigateTo,
    queryGroup,
    schemaQuery.isLoading,
    selectedSection,
  ])

  const closeDetail = useCallback(() => {
    confirmLeave(() => {
      const qs = searchParams.toString()
      navigate(`/setting${qs ? `?${qs}` : ''}`)
    })
  }, [confirmLeave, navigate, searchParams])

  const routeContextValue = useMemo(
    () => ({
      groups,
      onBack: closeDetail,
      registerLeaveGuard,
      schema: schemaQuery.data,
    }),
    [closeDetail, groups, registerLeaveGuard, schemaQuery.data],
  )

  const navList = (items: SettingsGroupSummary[]) => (
    <List
      activeKey={activeKey}
      compact
      items={items.map((group) => ({
        icon: group.icon,
        key: group.key,
        label: getGroupTitle(locale, group),
      }))}
      onActiveChange={(key) => selectGroup(String(key))}
      selectable
    />
  )

  return (
    <SettingsRouteContext.Provider value={routeContextValue}>
      <MasterDetailShell
        defaultSize={240}
        emptyDetail={
          <DetailPlaceholder
            description={settingsCopy(locale, 'emptyDetail')}
            icon={SlidersHorizontal}
            title={t('settings.shell.title')}
          />
        }
        maxSize={320}
        minSize={200}
        onDismiss={closeDetail}
        list={
          <FocusScope className={styles.scope} id={SETTINGS_NAV_SCOPE_ID}>
            <ListPane
              notices={
                schemaQuery.isError && !schemaQuery.data ? (
                  <Alert
                    action={
                      <Button
                        onClick={() => schemaQuery.refetch()}
                        size="small"
                      >
                        {settingsCopy(locale, 'retry')}
                      </Button>
                    }
                    description={settingsCopy(locale, 'loadFailedDetail')}
                    showIcon
                    title={settingsCopy(locale, 'loadFailed')}
                    type="warning"
                  />
                ) : null
              }
              title={t('settings.shell.title')}
            >
              <nav
                aria-label={t('settings.shell.title')}
                className={styles.nav}
              >
                <Flexbox>
                  <Text as="h2" className={styles.heading}>
                    {settingsCopy(locale, 'navSystem')}
                  </Text>
                  {schemaQuery.isLoading ? (
                    <div className={styles.skeleton}>
                      <SkeletonText rows={4} />
                    </div>
                  ) : systemGroups.length > 0 ? (
                    navList(systemGroups)
                  ) : null}
                </Flexbox>
                <Flexbox>
                  <Text as="h2" className={styles.heading}>
                    {settingsCopy(locale, 'navAccount')}
                  </Text>
                  {navList(accountGroups)}
                </Flexbox>
              </nav>
            </ListPane>
          </FocusScope>
        }
      />
    </SettingsRouteContext.Provider>
  )
}
