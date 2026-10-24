import { Flexbox } from '@lobehub/ui'
import type { HTMLAttributes } from 'react'

import { LogoColor } from './logo'
import { LogoText } from './text'

const MARK_UNITS = 21
const GAP_UNITS = 5
const TEXT_UNITS = 15

export interface CombineProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
  textSize?: number
}

export function Combine({
  size = 32,
  textSize,
  className,
  style,
  ...rest
}: CombineProps) {
  const wordmark = textSize ?? (size * TEXT_UNITS) / MARK_UNITS

  return (
    <Flexbox
      horizontal
      align="center"
      aria-label="Byline"
      className={className}
      flex="none"
      style={style}
      {...rest}
    >
      <LogoColor aria-hidden size={size} />
      <LogoText
        aria-hidden
        size={wordmark}
        style={{ marginLeft: (size * GAP_UNITS) / MARK_UNITS }}
      />
    </Flexbox>
  )
}
