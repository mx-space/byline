import type { HTMLAttributes } from 'react'

import { Combine, type CombineProps } from './combine'
import { LogoColor, type LogoProps } from './logo'
import { LogoText } from './text'

export type BrandType = 'color' | 'text' | 'combine'

export interface BrandProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  type?: BrandType
}

export function Brand({
  type = 'color',
  size = 32,
  className,
  style,
  ...rest
}: BrandProps) {
  if (type === 'combine') {
    return <Combine className={className} size={size} style={style} {...rest} />
  }

  const Logo = type === 'text' ? LogoText : LogoColor
  return (
    <Logo
      className={className}
      size={size}
      style={style}
      {...(rest as LogoProps)}
    />
  )
}

export type { CombineProps, LogoProps }
export { Combine, LogoColor, LogoText }
