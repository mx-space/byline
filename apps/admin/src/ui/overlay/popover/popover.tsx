import {
  createStaticStyles,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot as LobePopoverRoot,
  PopoverTriggerElement,
} from '@lobehub/ui'
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

import { PortalLayerScope, useFloatingZ } from '~/ui/feedback/portal-layer'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u14e35066: css`
    outline: none;
  `,
  ua1605e6e: css`
    width: min(92vw, 22rem);
  `,
  u7ab81aed: css`
    width: 20rem;
  `,
  u6ca62528: css`
    width: 16rem;
  `,
  u5f8ac90d: css`
    width: min(92vw, 32rem);
  `,
  uef2894d0: css`
    outline: none;
    box-shadow: ${cssVar.boxShadowSecondary};
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgElevated};
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
  `,
  uf59d3d94: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: ${cssVar.colorTextTertiary};
  `,
  ueb6e8b88: css`
    padding: 0.75rem;
  `,
  udc96923d: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-top-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u7ba1744e: css`
    transition-property: opacity, transform;
    transition-duration: 200ms;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  u4d8e30e0: css`
    &[data-starting-style] {
      opacity: 0;
    }
  `,
  udc5e0451: css`
    &[data-ending-style] {
      opacity: 0;
    }
  `,
}))

type RootProps = ComponentPropsWithoutRef<typeof LobePopoverRoot>

function PopoverRoot({ children, ...rest }: RootProps) {
  return <LobePopoverRoot {...rest}>{children}</LobePopoverRoot>
}

type TriggerProps = Omit<
  ComponentPropsWithoutRef<typeof PopoverTriggerElement>,
  'className'
> & { className?: string }

function PopoverTrigger({ className, children, ...rest }: TriggerProps) {
  return (
    <PopoverTriggerElement
      {...(rest as ComponentPropsWithoutRef<typeof PopoverTriggerElement>)}
      className={className}
    >
      {children}
    </PopoverTriggerElement>
  )
}

type PositionerProps = ComponentPropsWithoutRef<typeof PopoverPositioner>

type ContentProps = Omit<
  ComponentPropsWithoutRef<typeof PopoverPopup>,
  'className'
> & {
  align?: PositionerProps['align']
  anchor?: PositionerProps['anchor']
  alignOffset?: PositionerProps['alignOffset']
  className?: string
  container?: HTMLElement | null
  side?: PositionerProps['side']
  sideOffset?: PositionerProps['sideOffset']
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl'
}

const widthClass: Record<NonNullable<ContentProps['width']>, string> = {
  auto: '',
  lg: lobeStyles.ua1605e6e,
  md: lobeStyles.u7ab81aed,
  sm: lobeStyles.u6ca62528,
  xl: lobeStyles.u5f8ac90d,
}

function PopoverContent({
  align = 'start',
  alignOffset,
  anchor,
  children,
  className,
  container,
  side = 'bottom',
  sideOffset = 6,
  width = 'auto',
  ...rest
}: ContentProps) {
  const { depth, z } = useFloatingZ('popover')
  const positionerStyle: CSSProperties = { zIndex: z }

  return (
    <PopoverPortal container={container ?? undefined}>
      <PopoverPositioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        side={side}
        sideOffset={sideOffset}
        style={positionerStyle}
      >
        <PortalLayerScope depth={depth}>
          <PopoverPopup {...rest} className={cn(widthClass[width], className)}>
            {children}
          </PopoverPopup>
        </PortalLayerScope>
      </PopoverPositioner>
    </PopoverPortal>
  )
}

interface SectionProps {
  children: ReactNode
  className?: string
}

function PopoverHeader({ children, className }: SectionProps) {
  return <div className={cn(lobeStyles.uf59d3d94, className)}>{children}</div>
}

function PopoverBody({ children, className }: SectionProps) {
  return <div className={cn(lobeStyles.ueb6e8b88, className)}>{children}</div>
}

function PopoverFooter({ children, className }: SectionProps) {
  return <div className={cn(lobeStyles.udc96923d, className)}>{children}</div>
}

export const Popover = Object.assign(PopoverRoot, {
  Body: PopoverBody,
  Content: PopoverContent,
  Footer: PopoverFooter,
  Header: PopoverHeader,
  Trigger: PopoverTrigger,
})

export type {
  ContentProps as PopoverContentProps,
  TriggerProps as PopoverTriggerProps,
}
