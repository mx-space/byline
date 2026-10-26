import { AuthLayout } from '@lobehub/ui/dashboard'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { lazy, type ReactNode, Suspense } from 'react'

import { useI18n } from '~/i18n'
import { Combine } from '~/ui/brand'

import { AuthTools } from './auth-tools'

const Grainient = lazy(() =>
  import('@lobehub/ui/awesome').then((module) => ({
    default: module.Grainient,
  })),
)

const styles = stylex.create({
  form: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },
  link: {
    fontSize: cssVar.fontSizeSM,
    lineHeight: cssVar.lineHeightSM,
    color: { default: cssVar.colorPrimary, ':hover': cssVar.colorPrimaryHover },
    textDecoration: { default: 'none', ':focus-visible': 'underline' },
  },
})

export function AuthScreen(props: {
  alert?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  loading?: boolean
  subtitle?: ReactNode
  title: ReactNode
}) {
  const { t } = useI18n()

  return (
    <AuthLayout
      alert={props.alert}
      aside={
        <AuthLayout.Aside
          kicker="Byline"
          line={t('auth.login.asideLine')}
          background={
            <Suspense fallback={null}>
              <Grainient lightMode="auto" />
            </Suspense>
          }
        />
      }
      background="plain"
      brand={<Combine size={32} />}
      description={props.subtitle}
      footer={props.footer}
      loading={props.loading}
      title={props.title}
      tools={<AuthTools />}
      variant="default"
    >
      {props.children}
    </AuthLayout>
  )
}

export const authFormClassName = stylex.props(styles.form).className
export const authLinkClassName = stylex.props(styles.link).className
