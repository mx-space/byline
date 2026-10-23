import {
  ActionIcon,
  Avatar,
  createStaticStyles,
  cssVar,
  DropdownMenu,
  Flexbox,
  List,
  Popover,
  Text,
} from '@lobehub/ui'
import { useConsoleShell } from '@lobehub/ui/dashboard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronsUpDown,
  CircleUserRound,
  ExternalLink,
  Languages,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { getMe } from '~/api/users'
import { API_URL, GATEWAY_URL, WEB_URL } from '~/constants/env'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { resetAllCollections } from '~/data/resource/collection'
import { useI18n } from '~/i18n'
import { SUPPORTED_LOCALES } from '~/i18n/resources'
import type { Locale, TranslationKey } from '~/i18n/types'
import { adminQueryKeys } from '~/query/keys'
import type { ThemeMode } from '~/theme'
import { useThemeMode } from '~/theme'
import { authClient, clearAuthBearerToken } from '~/utils/authjs/auth'

const localeLabelKeys = {
  'en-US': 'shell.locale.en',
  'zh-CN': 'shell.locale.zh',
} satisfies Record<Locale, TranslationKey>

const themeModeLabelKeys = {
  dark: 'shell.theme.dark',
  light: 'shell.theme.light',
  system: 'shell.theme.system',
} satisfies Record<ThemeMode, TranslationKey>

const themeIcons = {
  dark: Moon,
  light: Sun,
  system: Monitor,
} satisfies Record<ThemeMode, typeof Sun>

const styles = createStaticStyles(({ css, cssVar }) => ({
  chevron: css`
    flex: none;
    color: ${cssVar.colorTextQuaternary};
  `,
  debug: css`
    cursor: pointer;

    display: flex;
    gap: 6px;
    align-items: center;

    margin-block-end: 8px;
    padding-block: 6px;
    padding-inline: 8px;
    border: none;
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorWarning};

    background: ${cssVar.colorWarningBg};

    font-size: ${cssVar.fontSizeSM};
  `,
  identity: css`
    display: grid;
    flex: 1;
    min-inline-size: 0;

    > strong {
      overflow: hidden;

      font-size: ${cssVar.fontSize};
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    > small {
      overflow: hidden;

      font-size: ${cssVar.fontSizeSM};
      color: ${cssVar.colorTextTertiary};
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  identityRow: css`
    flex: 1;
    min-inline-size: 0;
  `,
  name: css`
    line-height: 1.4;
  `,
  panel: css`
    min-inline-size: 300px;
  `,
  popover: css`
    padding: 0;

    --lobe-popover-viewport-inline-padding: 0;
  `,
  profile: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 8px;
    border: none;
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorText};
    text-align: start;

    background: none;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }

    &[data-collapsed='true'] {
      justify-content: center;
      padding-inline: 0;
    }
  `,
}))

export function ConsoleFooter() {
  const { collapsed } = useConsoleShell()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { locale, setLocale, t } = useI18n()
  const { setThemeMode, themeMode } = useThemeMode()
  const [open, setOpen] = useState(false)
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
    retry: false,
  })
  const owner = meQuery.data
  const name =
    owner?.displayName || owner?.username || t('shell.owner.fallback')
  const handle = owner?.email || owner?.username
  const subtitle = handle && handle !== name ? handle : undefined
  const isInApiDebugMode = Boolean(
    localStorage.getItem('__api') ||
    localStorage.getItem('__gateway') ||
    sessionStorage.getItem('__api') ||
    sessionStorage.getItem('__gateway') ||
    window.injectData.PAGE_PROXY,
  )

  const handleLogout = async () => {
    await authClient.signOut()
    sessionStorage.removeItem(SESSION_WITH_LOGIN)
    clearAuthBearerToken()
    queryClient.clear()
    resetAllCollections()
    navigate('/login', { replace: true })
  }

  const close = () => setOpen(false)

  return (
    <div>
      {isInApiDebugMode && !collapsed ? (
        <button
          className={styles.debug}
          onClick={() => navigate('/setup-api')}
          title={`${t('setup.api.urlLabel')}: ${API_URL ?? '--'}\nGateway: ${GATEWAY_URL ?? '--'}`}
          type="button"
        >
          <AlertTriangle aria-hidden size={14} />
          <span>
            {window.injectData.PAGE_PROXY
              ? t('shell.debug.local')
              : t('shell.debug.api')}
          </span>
        </button>
      ) : null}
      <Popover
        arrow={false}
        classNames={{ content: styles.popover }}
        open={open}
        placement="topLeft"
        trigger="click"
        content={
          <Flexbox className={styles.panel} gap={2}>
            <Flexbox
              horizontal
              align="center"
              gap={12}
              justify="space-between"
              paddingBlock={12}
              paddingInline={12}
            >
              <Flexbox
                horizontal
                align="center"
                className={styles.identityRow}
                gap={12}
              >
                <Avatar
                  alt={name}
                  avatar={owner?.avatar || name.slice(0, 1).toUpperCase()}
                  background={cssVar.colorFill}
                  size={36}
                />
                <Flexbox className={styles.identityRow}>
                  <Text ellipsis className={styles.name} weight="bold">
                    {name}
                  </Text>
                  {subtitle ? (
                    <Text
                      ellipsis
                      className={styles.name}
                      fontSize={12}
                      type="secondary"
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </Flexbox>
              </Flexbox>
              <Flexbox horizontal align="center" gap={2}>
                <DropdownMenu
                  nativeButton
                  placement="rightTop"
                  items={SUPPORTED_LOCALES.map((value) => ({
                    checked: locale === value,
                    closeOnClick: true,
                    key: value,
                    label: t(localeLabelKeys[value]),
                    onCheckedChange: (checked: boolean) => {
                      if (checked) setLocale(value)
                    },
                    type: 'checkbox' as const,
                  }))}
                >
                  <ActionIcon
                    icon={Languages}
                    size={16}
                    title={t('shell.locale.label')}
                    variant="borderless"
                  />
                </DropdownMenu>
                <DropdownMenu
                  nativeButton
                  placement="rightTop"
                  items={(['system', 'light', 'dark'] as const).map((mode) => ({
                    checked: themeMode === mode,
                    closeOnClick: true,
                    icon: themeIcons[mode],
                    key: mode,
                    label: t(themeModeLabelKeys[mode]),
                    onCheckedChange: (checked: boolean) => {
                      if (checked) setThemeMode(mode)
                    },
                    type: 'checkbox' as const,
                  }))}
                >
                  <ActionIcon
                    icon={themeIcons[themeMode]}
                    size={16}
                    title={t('shell.theme.label')}
                    variant="borderless"
                  />
                </DropdownMenu>
              </Flexbox>
            </Flexbox>
            <List
              selectable={false}
              items={[
                { key: 'lead', type: 'divider' },
                {
                  icon: CircleUserRound,
                  key: 'settings',
                  label: t('ui.layout.accountSettings'),
                },
                ...(WEB_URL
                  ? [
                      {
                        icon: ExternalLink,
                        key: 'site',
                        label: t('common.openMainSite'),
                      },
                    ]
                  : []),
                { key: 'out', type: 'divider' },
                {
                  icon: LogOut,
                  key: 'logout',
                  label: t('shell.logout'),
                },
              ]}
              onClick={({ key }) => {
                close()
                if (key === 'settings') navigate('/setting?group=user')
                if (key === 'site' && WEB_URL) {
                  window.open(WEB_URL, '_blank', 'noopener,noreferrer')
                }
                if (key === 'logout') void handleLogout()
              }}
            />
          </Flexbox>
        }
        onOpenChange={setOpen}
      >
        <button
          aria-label={collapsed ? name : undefined}
          className={styles.profile}
          data-collapsed={collapsed || undefined}
          type="button"
        >
          <Avatar
            alt=""
            avatar={owner?.avatar || name.slice(0, 1).toUpperCase()}
            background={cssVar.colorFill}
            size={32}
          />
          {collapsed ? null : (
            <>
              <span className={styles.identity}>
                <strong title={name}>{name}</strong>
                {subtitle ? <small>{subtitle}</small> : null}
              </span>
              <ChevronsUpDown
                aria-hidden
                className={styles.chevron}
                size={15}
              />
            </>
          )}
        </button>
      </Popover>
    </div>
  )
}
