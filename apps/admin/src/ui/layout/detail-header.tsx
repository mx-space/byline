import { createStaticStyles } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { HeaderBackButton } from '~/ui/layout/header-back-button'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uebfd35ab: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding-inline: 1rem;
  `,
  u6a00a25d: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
  `,
  u2bdda2c0: css`
    display: contents;
    @media (min-width: 1024px) {
      display: none;
    }
  `,
  uc39c8d01: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  u3b4c716c: css`
    min-width: 0px;
    flex: 1 1 0%;
  `,
  ua46c7513: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
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
  u0b1f52d8: css`
    display: inline-flex;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u0a935cc3: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
  `,
  ud8539e83: css`
    display: none;
    width: 2.25rem;
    height: 2.25rem;
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
    @media (min-width: 1024px) {
      display: inline-flex;
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

export interface DetailHeaderProps {
  title?: ReactNode
  icon?: LucideIcon
  /** Icon 之额外 className（如 animate-spin、status 染色） */
  iconClassName?: string
  /** Title 下副行（meta、summary） */
  subtitle?: ReactNode
  actions?: ReactNode
  /**
   * Desktop 关 detail 之 X button 之 handler。传则显，未传则不显。
   * Mobile 总有 back button 经 `HeaderBackButton`，自调 `navigate(-1)`。
   */
  onClose?: () => void
  /** Mobile back 之自定义行为（默认 `navigate(-1)`） */
  onBack?: () => void
  className?: string
}

/**
 * Master-detail 之 detail panel 共享 header。
 *
 * - Mobile (<lg)：左侧显 `HeaderBackButton`，触发 `onBack`（默认 `navigate(-1)`）
 * - Desktop (≥lg)：back button 隐；若传 `onClose`，右侧显 X 关 button
 * - Title、icon、actions 两端同
 */
export function DetailHeader(props: DetailHeaderProps) {
  const { t } = useI18n()
  const Icon = props.icon
  const hasContent =
    props.title != null ||
    props.subtitle != null ||
    props.actions != null ||
    props.onClose != null

  if (!hasContent) return null

  const hasSubtitle = props.subtitle != null

  return (
    <div
      className={cn(
        lobeStyles.uebfd35ab,
        APP_SHELL_HEADER_HEIGHT_CLASS,
        props.className,
      )}
    >
      <div className={lobeStyles.u6a00a25d}>
        <span className={lobeStyles.u2bdda2c0}>
          <HeaderBackButton onClick={props.onBack} />
        </span>
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn(lobeStyles.uc39c8d01, props.iconClassName)}
          />
        ) : null}
        {hasSubtitle ? (
          <div className={lobeStyles.u3b4c716c}>
            <h2 className={lobeStyles.ua46c7513}>{props.title}</h2>
            <p className={lobeStyles.ubdf0a62f}>{props.subtitle}</p>
          </div>
        ) : props.title ? (
          <h2 className={lobeStyles.u0b1f52d8}>{props.title}</h2>
        ) : null}
      </div>
      <div className={lobeStyles.u0a935cc3}>
        {props.actions}
        {props.onClose ? (
          <button
            aria-label={t('ui.modal.closeAria')}
            className={lobeStyles.ud8539e83}
            onClick={props.onClose}
            type="button"
          >
            <X aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
