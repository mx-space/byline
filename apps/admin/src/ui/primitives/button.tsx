import {
  Button as LobeButton,
  type ButtonProps as LobeButtonProps,
} from '@lobehub/ui'
import type { MouseEventHandler, ReactNode } from 'react'
import type { LinkProps } from 'react-router'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle'

export interface ButtonProps {
  'aria-label'?: string
  autoFocus?: boolean
  children?: ReactNode
  className?: string
  disabled?: boolean
  iconOnly?: boolean
  id?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>
  title?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
}

export interface ButtonLinkProps extends Omit<
  LinkProps,
  'className' | 'children'
> {
  children?: ReactNode
  className?: string
  iconOnly?: boolean
  variant?: ButtonVariant
}

function lobeType(variant: ButtonVariant): LobeButtonProps['type'] {
  if (variant === 'primary') return 'primary'
  if (variant === 'ghost') return 'text'
  return 'fill'
}

export function Button({
  className,
  iconOnly = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <LobeButton
      {...({
        ...props,
        className,
        htmlType: type,
        shape: 'round',
        size: iconOnly ? 'small' : 'middle',
        type: lobeType(variant),
      } as LobeButtonProps)}
    />
  )
}

export function ButtonLink({
  children,
  className,
  iconOnly = false,
  to,
  variant = 'primary',
}: ButtonLinkProps) {
  return (
    <LobeButton
      className={className}
      href={typeof to === 'string' ? to : undefined}
      shape="round"
      size={iconOnly ? 'small' : 'middle'}
      type={lobeType(variant)}
    >
      {children}
    </LobeButton>
  )
}
