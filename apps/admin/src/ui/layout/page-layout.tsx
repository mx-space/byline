import { createStaticStyles } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { DesktopSidebarHamburger } from '~/ui/layout/desktop-sidebar-hamburger'
import { HeaderBackButton } from '~/ui/layout/header-back-button'
import { MobileHamburger } from '~/ui/layout/mobile-hamburger'
import { useShellNav } from '~/ui/layout/shell-nav-context'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ud435703e: css`
    display: flex;
    height: 100%;
    min-height: 0px;
    flex-direction: column;
  `,
  ubbcd58b2: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom-width: 1px;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0;
  `,
  u85dd57df: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.625rem;
  `,
  u9d380b5c: css`
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    color: ${cssVar.colorTextSecondary};
  `,
  uef93af5f: css`
    display: flex;
    min-width: 0px;
    flex-direction: column;
  `,
  ue1939db5: css`
    display: flex;
    min-width: 0px;
    align-items: baseline;
    gap: 0.5rem;
  `,
  u31144146: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.875rem;
    line-height: 1.375rem;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  ub2ddbe74: css`
    flex-shrink: 0;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
  ubdf0a62f: css`
    margin-top: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uf65d5356: css`
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  `,
  u4a756ca0: css`
    display: contents;
  `,
  u1f5f0b3e: css`
    display: none;
    @media (min-width: 1024px) {
      display: contents;
    }
  `,
  u2bdda2c0: css`
    display: contents;
    @media (min-width: 1024px) {
      display: none;
    }
  `,
  ubcbc48bc: css`
    &:focus-visible {
      outline: none;
    }
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
    &:disabled {
      cursor: not-allowed;
    }
    &:disabled {
      opacity: 0.5;
    }
  `,
  u11f8fd1f: css`
    box-shadow: ${cssVar.boxShadowTertiary};
    background-color: ${cssVar.colorPrimary};
    color: ${cssVar.colorTextLightSolid};
    &:hover {
      background-color: ${cssVar.colorPrimaryHover};
    }
  `,
  u2b3db831: css`
    box-shadow: ${cssVar.boxShadowTertiary};
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    color: ${cssVar.colorText};
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  ud8f5213f: css`
    width: 2rem;
    height: 2rem;
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  ud3ade0e3: css`
    width: 2rem;
    height: 2rem;
    @media (min-width: 1024px) {
      display: none;
    }
  `,
  ub1ae9e5b: css`
    display: none;
    height: 2rem;
    gap: 0.375rem;
    padding-inline: 0.625rem;
    @media (min-width: 1024px) {
      display: inline-flex;
    }
  `,
}))

export function AppPage(props: { children: ReactNode; className?: string }) {
  return (
    <section className={cn(lobeStyles.ud435703e, props.className)}>
      {props.children}
    </section>
  )
}

export interface PageHeaderBackProp {
  label?: string
  onClick?: () => void
  to?: string
}

export type HeaderAction =
  | {
      kind: 'button'
      icon: LucideIcon
      label: string
      onClick: () => void
      primary?: boolean
      disabled?: boolean
      iconOnly?: boolean
    }
  | {
      kind: 'custom'
      node: ReactNode
      mobileNode?: ReactNode
    }

interface PageHeaderProps {
  actions?: ReactNode | HeaderAction[]
  back?: PageHeaderBackProp
  className?: string
  count?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  title: ReactNode
}

export function isHeaderActionArray(
  actions: PageHeaderProps['actions'],
): actions is HeaderAction[] {
  if (!Array.isArray(actions) || actions.length === 0) return false
  return actions.every(
    (item) =>
      item != null &&
      typeof item === 'object' &&
      'kind' in item &&
      (item.kind === 'button' || item.kind === 'custom'),
  )
}

export function PageHeader(props: PageHeaderProps) {
  const typedActions = isHeaderActionArray(props.actions) ? props.actions : null
  const hasActions =
    typedActions !== null ||
    (props.actions !== undefined &&
      props.actions !== null &&
      !(Array.isArray(props.actions) && props.actions.length === 0))

  const shellNav = useShellNav()
  const registerPageHeader = shellNav?.registerPageHeader
  useEffect(() => registerPageHeader?.(), [registerPageHeader])

  return (
    <header
      className={cn(
        lobeStyles.ubbcd58b2,
        APP_SHELL_HEADER_HEIGHT_CLASS,
        props.className,
      )}
    >
      <div className={lobeStyles.u85dd57df}>
        <MobileHamburger />
        <DesktopSidebarHamburger />
        {props.back ? <HeaderBackButton {...props.back} /> : null}
        {props.icon ? (
          <span className={lobeStyles.u9d380b5c}>{props.icon}</span>
        ) : null}
        <div className={lobeStyles.uef93af5f}>
          <div className={lobeStyles.ue1939db5}>
            <h1 className={lobeStyles.u31144146}>{props.title}</h1>
            {props.count != null ? (
              <span className={lobeStyles.ub2ddbe74}>{props.count}</span>
            ) : null}
          </div>
          {props.description ? (
            <p className={lobeStyles.ubdf0a62f}>{props.description}</p>
          ) : null}
        </div>
      </div>
      {hasActions ? (
        <div className={lobeStyles.uf65d5356}>
          {typedActions
            ? typedActions.map((action, index) =>
                renderHeaderAction(action, index),
              )
            : (props.actions as ReactNode)}
        </div>
      ) : null}
    </header>
  )
}

export function HeaderActions(props: {
  actions: HeaderAction[]
  className?: string
}) {
  if (!props.actions.length) return null
  return (
    <div className={cn(lobeStyles.uf65d5356, props.className)}>
      {props.actions.map((action, index) => renderHeaderAction(action, index))}
    </div>
  )
}

function renderHeaderAction(action: HeaderAction, index: number) {
  if (action.kind === 'custom') {
    return (
      <span key={index} className={lobeStyles.u4a756ca0}>
        <span className={lobeStyles.u1f5f0b3e}>{action.node}</span>
        <span className={lobeStyles.u2bdda2c0}>
          {action.mobileNode ?? action.node}
        </span>
      </span>
    )
  }

  const Icon = action.icon
  const baseClasses = lobeStyles.ubcbc48bc
  const primaryClasses = lobeStyles.u11f8fd1f
  const secondaryClasses = lobeStyles.u2b3db831
  const variantClasses = action.primary ? primaryClasses : secondaryClasses

  if (action.iconOnly) {
    return (
      <span key={index} className={lobeStyles.u4a756ca0}>
        <button
          aria-label={action.label}
          className={cn(baseClasses, variantClasses, lobeStyles.ud8f5213f)}
          disabled={action.disabled}
          onClick={action.onClick}
          title={action.label}
          type="button"
        >
          <Icon aria-hidden="true" className={lobeStyles.u783b0d9d} />
        </button>
      </span>
    )
  }

  return (
    <span key={index} className={lobeStyles.u4a756ca0}>
      <button
        aria-label={action.label}
        className={cn(baseClasses, variantClasses, lobeStyles.ud3ade0e3)}
        disabled={action.disabled}
        onClick={action.onClick}
        title={action.label}
        type="button"
      >
        <Icon aria-hidden="true" className={lobeStyles.u783b0d9d} />
      </button>
      <button
        aria-label={action.label}
        className={cn(baseClasses, variantClasses, lobeStyles.ub1ae9e5b)}
        disabled={action.disabled}
        onClick={action.onClick}
        type="button"
      >
        <Icon aria-hidden="true" className={lobeStyles.u783b0d9d} />
        <span>{action.label}</span>
      </button>
    </span>
  )
}
