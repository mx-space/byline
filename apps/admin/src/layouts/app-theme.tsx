import '@lobehub/ui/theme.css'
import '@lobehub/ui/style.css'
import '@lobehub/ui/global.css'
import '~/lobe-button.css'

import {
  ConfigProvider,
  createStaticStyles,
  ModalHost,
  ToastHost,
} from '@lobehub/ui'
import { domMax, LazyMotion } from 'motion/react'
import * as motion from 'motion/react-m'
import type { ReactNode } from 'react'
import { Link as RouterLink, type LinkProps } from 'react-router'

import { useI18n } from '~/i18n'
import { useThemeMode } from '~/theme'

import { useSyncLobeAppearance } from './use-sync-lobe-appearance'

function AppLink({
  href,
  to,
  ...rest
}: { href?: string } & Omit<LinkProps, 'to'> & { to?: LinkProps['to'] }) {
  return <RouterLink to={to ?? href ?? ''} {...rest} />
}

const styles = createStaticStyles(({ css }) => ({
  app: css`
    display: flex;
    flex-direction: column;

    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    min-height: 0;

    overflow: hidden;
  `,
}))

export function AppTheme(props: { children: ReactNode }) {
  const { locale } = useI18n()
  const { themeMode } = useThemeMode()
  useSyncLobeAppearance(themeMode)

  return (
    <div className={styles.app}>
      <ConfigProvider
        config={{
          aAs: AppLink,
        }}
        locale={locale}
        motion={motion}
      >
        <LazyMotion features={domMax}>
          <ModalHost />
          <ToastHost />
          {props.children}
        </LazyMotion>
      </ConfigProvider>
    </div>
  )
}
