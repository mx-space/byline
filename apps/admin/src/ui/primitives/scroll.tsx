import { ScrollArea } from '@lobehub/ui'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { forwardRef } from 'react'

interface ScrollProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  innerClassName?: string
  orientation?: 'both' | 'horizontal' | 'vertical'
  viewportClassName?: string
}

export const Scroll = forwardRef<HTMLDivElement, ScrollProps>(
  function Scroll(props, ref) {
    const {
      children,
      className,
      innerClassName,
      orientation = 'vertical',
      viewportClassName,
      ...rest
    } = props

    return (
      <ScrollArea
        className={className}
        contentProps={{ className: innerClassName }}
        corner={orientation === 'both'}
        disableContentFit={orientation !== 'horizontal'}
        scrollFade={orientation === 'both' ? 'both' : orientation}
        viewportProps={{ className: viewportClassName, ref }}
        {...rest}
      >
        {children}
      </ScrollArea>
    )
  },
)
