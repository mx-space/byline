import { createStaticStyles } from '@lobehub/ui'
import { AuthLayout } from '@lobehub/ui/dashboard'
import { lazy, type ReactNode, Suspense } from 'react'

import { useI18n } from '~/i18n'

import faviconUrl from '../../../../favicon.png'
import { AuthTools } from './auth-tools'

const Grainient = lazy(() =>
  import('@lobehub/ui/awesome').then((module) => ({
    default: module.Grainient,
  })),
)

const styles = createStaticStyles(({ css, cssVar }) => ({
  form: css`
    display: flex;
    flex-direction: column;
    gap: 12px;

    width: 100%;
  `,
  link: css`
    font-size: 12px;
    line-height: 18px;
    color: ${cssVar.colorPrimary};

    &:hover {
      color: ${cssVar.colorPrimaryHover};
    }

    &:focus-visible {
      text-decoration: underline;
    }
  `,
  logo: css`
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 8px;

    object-fit: cover;
  `,
}))

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
      background="grid"
      description={props.subtitle}
      footer={props.footer}
      loading={props.loading}
      logo={<img alt="" className={styles.logo} src={faviconUrl} />}
      title={props.title}
      tools={<AuthTools />}
      variant="elevated"
    >
      {props.children}
    </AuthLayout>
  )
}

export const authFormClassName = styles.form
export const authLinkClassName = styles.link
