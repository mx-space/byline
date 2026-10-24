import { createStaticStyles } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CloudDownload, History, X } from 'lucide-react'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u016f2eea: css`
    background-color: ${cssVar.colorBgContainer};
    border-color: ${cssVar.colorBorderSecondary};
  `,
  ud40b0a80: css`
    color: ${cssVar.colorTextSecondary};
  `,
  ucfc6e672: css`
    color: ${cssVar.colorText};
  `,
  uc4bced39: css`
    background-color: ${cssVar.colorWarningBg};
    border-color: ${cssVar.colorWarningBg};
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorWarning} 30%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      border-color: color-mix(in srgb, ${cssVar.colorWarning} 40%, transparent);
    }
  `,
  u126b835a: css`
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  ufddad14f: css`
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarningBg};
    }
  `,
  u0b4bebd9: css`
    color: color-mix(in srgb, ${cssVar.colorWarning} 70%, transparent);
    &:hover {
      background-color: ${cssVar.colorWarningBg};
    }
    &:hover {
      color: ${cssVar.colorWarning};
    }
    :where(.dark, .dark *) & {
      color: color-mix(in srgb, ${cssVar.colorWarning} 70%, transparent);
    }
    :where(.dark, .dark *) &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorWarning} 40%,
        transparent
      );
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorWarningBg};
    }
  `,
  ua82a1496: css`
    color: ${cssVar.colorPrimary};
  `,
  u5ad81ca6: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    @media (min-width: 640px) {
      gap: 0.75rem;
    }
  `,
  uc39c8d01: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  u9459aa18: css`
    min-width: 0px;
    flex: 1 1 0%;
    font-size: 0.75rem;
    line-height: 1.125rem;
    @media (max-width: 639px) {
      flex-basis: calc(100%-2rem);
    }
  `,
  ub93021ad: css`
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    @media (max-width: 639px) {
      width: 100%;
    }
    @media (max-width: 639px) {
      padding-left: 1.5rem;
    }
  `,
  uca068657: css`
    height: 1.75rem;
    padding-inline: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  ua3b6e7b1: css`
    height: 1.75rem;
    padding-inline: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorError};
    &:hover {
      color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorError};
    }
  `,
  u40f5651d: css`
    display: inline-flex;
    width: 1.75rem;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:focus-visible {
      outline: none;
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  u02064bce: css`
    color: ${cssVar.colorTextTertiary};
    &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} NaN%,
        transparent
      );
    }
    &:hover {
      color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorBgContainer} NaN%,
        transparent
      );
    }
  `,
}))

interface DraftHintBannerProps {
  variant: 'list' | 'recovery' | 'remote-update'
  message: string
  actionLabel: string
  onAction: () => void
  onDelete?: () => void
  onDismiss?: () => void
  onSecondaryAction?: () => void
  secondaryActionLabel?: string
}

const variantConfig: Record<
  DraftHintBannerProps['variant'],
  {
    icon: LucideIcon
    cardClass: string
    iconClass: string
    messageClass: string
    actionVariant: 'primary' | 'secondary'
    dismissClass: string
  }
> = {
  list: {
    icon: History,
    cardClass: lobeStyles.u016f2eea,
    iconClass: lobeStyles.ud40b0a80,
    messageClass: lobeStyles.ucfc6e672,
    actionVariant: 'secondary',
    dismissClass: lobeStyles.u02064bce,
  },
  recovery: {
    icon: AlertCircle,
    cardClass: lobeStyles.uc4bced39,
    iconClass: lobeStyles.u126b835a,
    messageClass: lobeStyles.ufddad14f,
    actionVariant: 'primary',
    dismissClass: lobeStyles.u0b4bebd9,
  },
  'remote-update': {
    icon: CloudDownload,
    cardClass: lobeStyles.u016f2eea,
    iconClass: lobeStyles.ua82a1496,
    messageClass: lobeStyles.ucfc6e672,
    actionVariant: 'primary',
    dismissClass: lobeStyles.u02064bce,
  },
}

export function DraftHintBanner(props: DraftHintBannerProps) {
  const {
    icon: Icon,
    cardClass,
    iconClass,
    messageClass,
    actionVariant,
    dismissClass,
  } = variantConfig[props.variant]
  const { t } = useI18n()

  return (
    <div
      className={cn(lobeStyles.u5ad81ca6, cardClass)}
      role={props.variant === 'recovery' ? 'alert' : 'status'}
    >
      <Icon
        aria-hidden="true"
        className={cn(lobeStyles.uc39c8d01, iconClass)}
      />
      <span className={cn(lobeStyles.u9459aa18, messageClass)}>
        {props.message}
      </span>
      <div className={lobeStyles.ub93021ad}>
        <Button
          className={lobeStyles.uca068657}
          onClick={props.onAction}
          type="button"
          variant={actionVariant}
        >
          {props.actionLabel}
        </Button>
        {props.onSecondaryAction && props.secondaryActionLabel ? (
          <Button
            className={lobeStyles.uca068657}
            onClick={props.onSecondaryAction}
            type="button"
            variant="secondary"
          >
            {props.secondaryActionLabel}
          </Button>
        ) : null}
        {props.onDelete ? (
          <Button
            className={lobeStyles.ua3b6e7b1}
            onClick={props.onDelete}
            type="button"
            variant="ghost"
          >
            {t('write.recovery.deleteAction')}
          </Button>
        ) : null}
        {props.onDismiss ? (
          <button
            aria-label={t('write.draftHint.dismissAria')}
            className={cn(lobeStyles.u40f5651d, dismissClass)}
            onClick={props.onDismiss}
            type="button"
          >
            <X aria-hidden="true" className={lobeStyles.u783b0d9d} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
