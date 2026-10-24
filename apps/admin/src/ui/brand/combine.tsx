import { Flexbox } from '@lobehub/ui'
import type { HTMLAttributes, ReactNode } from 'react'

import { LogoColor } from './logo'
import { styles } from './style'
import { LOGO_TEXT_INSET_UNITS, LogoText, TEXT_HEIGHT } from './text'

const MARK_UNITS = 21
const GAP_UNITS = 5
const TEXT_UNITS = 15

export interface CombineProps extends HTMLAttributes<HTMLDivElement> {
  caption?: ReactNode
  size?: number
  textSize?: number
}

export function Combine({
  caption,
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
      <Flexbox style={{ marginLeft: (size * GAP_UNITS) / MARK_UNITS }}>
        <LogoText aria-hidden size={wordmark} />
        {caption ? (
          <span
            className={styles.caption}
            style={{
              marginLeft: (wordmark * LOGO_TEXT_INSET_UNITS) / TEXT_HEIGHT,
            }}
          >
            {caption}
          </span>
        ) : null}
      </Flexbox>
    </Flexbox>
  )
}
