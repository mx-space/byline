import {
  createStaticStyles,
  ModalBackdrop,
  ModalClose as LobeModalClose,
  ModalDescription as LobeModalDescription,
  ModalPopup,
  ModalPortal,
  ModalRoot,
  ModalTitle as LobeModalTitle,
} from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'

import { useI18n } from '~/i18n'
import { PortalLayerScope, useFloatingZ } from '~/ui/feedback/portal-layer'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u466e3f9f: css`
    outline: none;
    box-shadow: ${cssVar.boxShadow};
    position: fixed;
    left: 50%;
    top: 50%;
    display: flex;
    translate: -50%;
    translate: 0 -50%;
    flex-direction: column;
    overflow: hidden;
    border-radius: 12px;
    background-color: ${cssVar.colorBgContainer};
  `,
  u6db1278a: css`
    display: grid;
    flex-shrink: 0;
    grid-template-columns: minmax(0, 1fr) _auto;
    column-gap: 0.75rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 1rem;
  `,
  u9a9c293b: css`
    min-height: 4rem;
    align-content: center;
    padding-block: 0.625rem;
  `,
  u0a40d363: css`
    height: 3rem;
    align-items: center;
  `,
  uaf1e6cc0: css`
    display: inline-flex;
    min-width: 0px;
    align-self: center;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.375rem;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  uc39c8d01: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  uf283ea9b: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u2cb4700a: css`
    grid-column-start: 2;
    grid-row-start: 1;
    display: flex;
    flex-shrink: 0;
    align-self: center;
    align-items: center;
    gap: 0.25rem;
  `,
  u4a825ed2: css`
    margin-right: calc(0.375rem * -1);
    display: inline-flex;
    width: 1.75rem;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: ${cssVar.colorTextTertiary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u2b1bb3c1: css`
    grid-column-start: 1;
    grid-row-start: 2;
    margin-top: 0.125rem;
    min-width: 0px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u6da05ed2: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    border-top-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 1rem;
    padding-block: 0.5rem;
  `,
  u4d3af606: css`
    position: fixed;
    inset: 0px;
    background-color: color-mix(in srgb, ${cssVar.colorText} 35%, transparent);
  `,
}))

export interface ModalProps {
  children: ReactNode
  className?: string
  initialFocus?: ComponentProps<typeof ModalPopup>['initialFocus']
  onClose?: () => void
  onExitComplete?: () => void
  onOpenChange?: ComponentProps<typeof ModalRoot>['onOpenChange']
  open: boolean
  popupStyle?: CSSProperties
}

export function Modal(props: ModalProps) {
  const { depth } = useFloatingZ('dialog')

  return (
    <ModalRoot
      onExitComplete={props.onExitComplete}
      onOpenChange={(open, eventDetails) => {
        if (props.onOpenChange) {
          props.onOpenChange(open, eventDetails)
          if (eventDetails.isCanceled) return
        }
        if (!open) props.onClose?.()
      }}
      open={props.open}
    >
      <ModalPortal>
        <ModalBackdrop />
        <ModalPopup
          initialFocus={props.initialFocus}
          panelClassName={props.className}
          popupStyle={props.popupStyle}
        >
          <PortalLayerScope depth={depth}>{props.children}</PortalLayerScope>
        </ModalPopup>
      </ModalPortal>
    </ModalRoot>
  )
}

export const ModalTitle = LobeModalTitle
export const ModalDescription = LobeModalDescription
export const ModalClose = LobeModalClose

export function ModalHeader(props: {
  actions?: ReactNode
  className?: string
  icon?: LucideIcon
  onClose?: () => void
  showClose?: boolean
  subtitle?: ReactNode
  title: ReactNode
}) {
  const { t } = useI18n()
  const Icon = props.icon
  const showClose = props.showClose ?? true
  return (
    <div
      className={cn(
        lobeStyles.u6db1278a,
        props.subtitle ? lobeStyles.u9a9c293b : lobeStyles.u0a40d363,
        props.className,
      )}
    >
      <ModalTitle className={lobeStyles.uaf1e6cc0}>
        {Icon ? (
          <Icon aria-hidden="true" className={lobeStyles.uc39c8d01} />
        ) : null}
        <span className={lobeStyles.uf283ea9b}>{props.title}</span>
      </ModalTitle>
      <div className={lobeStyles.u2cb4700a}>
        {props.actions}
        {showClose ? (
          <ModalClose
            aria-label={t('ui.modal.closeAria')}
            className={lobeStyles.u4a825ed2}
          >
            <X aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </ModalClose>
        ) : null}
      </div>
      {props.subtitle ? (
        <p className={lobeStyles.u2b1bb3c1}>{props.subtitle}</p>
      ) : null}
    </div>
  )
}

export function ModalFooter(props: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(lobeStyles.u6da05ed2, props.className)}>
      {props.children}
    </div>
  )
}
