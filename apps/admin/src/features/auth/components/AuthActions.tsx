import { Button, type ButtonProps, cx } from '@lobehub/ui'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { authStyles } from './auth-styles'

export function AuthSubmitButton(props: {
  children: ReactNode
  flush?: boolean
  htmlType?: 'button' | 'submit'
  icon?: ButtonProps['icon']
  loading?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      block
      className={props.flush ? authStyles.method : authStyles.submit}
      htmlType={props.htmlType ?? 'submit'}
      icon={props.icon}
      loading={props.loading}
      onClick={props.onClick}
      size="large"
      type="primary"
    >
      {props.children}
    </Button>
  )
}

export function AuthTextLink(props: {
  children: ReactNode
  spaced?: 'fields' | 'section'
  to: string
}) {
  return (
    <Link
      className={cx(
        authStyles.link,
        props.spaced === 'fields' && authStyles.afterFields,
        props.spaced === 'section' && authStyles.afterForm,
      )}
      to={props.to}
    >
      {props.children}
    </Link>
  )
}
