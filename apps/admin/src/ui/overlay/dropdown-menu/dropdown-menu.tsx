import {
  DropdownMenuGroup as LobeDropdownMenuGroup,
  DropdownMenuGroupLabel as LobeDropdownMenuGroupLabel,
  DropdownMenuItem as LobeDropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuRoot as LobeDropdownMenuRoot,
  DropdownMenuSeparator as LobeDropdownMenuSeparator,
  DropdownMenuTrigger as LobeDropdownMenuTrigger,
  Text,
} from '@lobehub/ui'
import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react'
import { createContext, useCallback, useContext, useRef } from 'react'

import {
  useCloseOnAnchorHidden,
  useFloatLayerContainer,
  useLayerZIndex,
} from '../floating-layer'

type RootProps = ComponentPropsWithoutRef<typeof LobeDropdownMenuRoot>
type MenuActions = NonNullable<
  Extract<RootProps['actionsRef'], RefObject<unknown>> extends RefObject<
    infer T
  >
    ? T
    : never
>

const MenuActionsContext = createContext<RefObject<MenuActions | null> | null>(
  null,
)

function DropdownMenuRoot({ actionsRef, children, ...rest }: RootProps) {
  const fallbackRef = useRef<MenuActions | null>(null)
  const resolvedRef = actionsRef ?? fallbackRef

  return (
    <MenuActionsContext value={resolvedRef}>
      <LobeDropdownMenuRoot {...rest} actionsRef={resolvedRef}>
        {children}
      </LobeDropdownMenuRoot>
    </MenuActionsContext>
  )
}

type TriggerOwnProps = Omit<
  ComponentPropsWithoutRef<typeof LobeDropdownMenuTrigger>,
  'className'
> & { className?: string }

function DropdownMenuTrigger({
  className,
  children,
  ...rest
}: TriggerOwnProps) {
  return (
    <LobeDropdownMenuTrigger
      {...(rest as ComponentPropsWithoutRef<typeof LobeDropdownMenuTrigger>)}
      className={className}
    >
      {children}
    </LobeDropdownMenuTrigger>
  )
}

type PositionerProps = ComponentPropsWithoutRef<typeof DropdownMenuPositioner>

type ContentProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPopup>,
  'className'
> & {
  align?: PositionerProps['align']
  alignOffset?: PositionerProps['alignOffset']
  className?: string
  container?: HTMLElement | null
  side?: PositionerProps['side']
  sideOffset?: PositionerProps['sideOffset']
}

function DropdownMenuContent({
  align = 'start',
  alignOffset,
  children,
  className,
  container,
  side = 'bottom',
  sideOffset = 6,
  ...rest
}: ContentProps) {
  const { ref: zRef, zIndex } = useLayerZIndex<HTMLDivElement>('floating')
  const actionsRef = useContext(MenuActionsContext)
  const anchorRef = useCloseOnAnchorHidden<HTMLDivElement>(() => {
    actionsRef?.current?.close()
  })
  const positionerRef = useCallback(
    (node: HTMLDivElement | null) => {
      zRef(node)
      anchorRef(node)
    },
    [anchorRef, zRef],
  )
  const ctxContainer = useFloatLayerContainer()
  const resolvedContainer = container ?? ctxContainer ?? undefined

  return (
    <DropdownMenuPortal container={resolvedContainer}>
      <DropdownMenuPositioner
        align={align}
        alignOffset={alignOffset}
        ref={positionerRef}
        side={side}
        sideOffset={sideOffset}
        style={{ zIndex }}
      >
        <DropdownMenuPopup {...rest} className={className}>
          {children}
        </DropdownMenuPopup>
      </DropdownMenuPositioner>
    </DropdownMenuPortal>
  )
}

type ItemProps = Omit<
  ComponentPropsWithoutRef<typeof LobeDropdownMenuItem>,
  'className'
> & {
  className?: string
  danger?: boolean
}

function DropdownMenuItem({ className, danger, ...rest }: ItemProps) {
  return (
    <LobeDropdownMenuItem {...rest} className={className} danger={danger} />
  )
}

type SeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof LobeDropdownMenuSeparator>,
  'className'
> & { className?: string }

function DropdownMenuSeparator({ className, ...rest }: SeparatorProps) {
  return <LobeDropdownMenuSeparator {...rest} className={className} />
}

const DropdownMenuGroup = LobeDropdownMenuGroup

type GroupLabelProps = Omit<
  ComponentPropsWithoutRef<typeof LobeDropdownMenuGroupLabel>,
  'className'
> & { className?: string }

function DropdownMenuGroupLabel({ className, ...rest }: GroupLabelProps) {
  return <LobeDropdownMenuGroupLabel {...rest} className={className} />
}

function DropdownMenuEmpty({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{ display: 'block', padding: '12px 8px', textAlign: 'center' }}
      type="secondary"
    >
      {children}
    </Text>
  )
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Content: DropdownMenuContent,
  Empty: DropdownMenuEmpty,
  Group: DropdownMenuGroup,
  GroupLabel: DropdownMenuGroupLabel,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Trigger: DropdownMenuTrigger,
})

export type {
  ContentProps as DropdownMenuContentProps,
  ItemProps as DropdownMenuItemProps,
}
