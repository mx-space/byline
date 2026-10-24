import { createStaticStyles } from '@lobehub/ui'
import { AlertTriangle } from 'lucide-react'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ud3af697d: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorErrorBg};
    background-color: ${cssVar.colorErrorBg};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      border-color: color-mix(in srgb, ${cssVar.colorError} 50%, transparent);
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 30%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorErrorBg};
    }
  `,
  u599a2e5c: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  uf5005e80: css`
    min-width: 16rem;
    flex: 1 1 0%;
    font-size: 0.75rem;
    line-height: 1.125rem;
  `,
  uba2fb302: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.25rem;
  `,
  uca068657: css`
    height: 1.75rem;
    padding-inline: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
}))

interface DraftConflictBannerProps {
  conflictCount: number
  onKeepLocal: () => void
  onUseRemote: () => void
}

export function DraftConflictBanner(props: DraftConflictBannerProps) {
  const { t } = useI18n()

  return (
    <div className={lobeStyles.ud3af697d} role="alert">
      <AlertTriangle aria-hidden="true" className={lobeStyles.u599a2e5c} />
      <span className={lobeStyles.uf5005e80}>
        {t('write.conflict.message', {
          count: props.conflictCount,
        })}
      </span>
      <div className={lobeStyles.uba2fb302}>
        <Button
          className={lobeStyles.uca068657}
          onClick={props.onUseRemote}
          type="button"
          variant="secondary"
        >
          {t('write.conflict.useRemote')}
        </Button>
        <Button
          className={lobeStyles.uca068657}
          onClick={props.onKeepLocal}
          type="button"
        >
          {t('write.conflict.keepLocal')}
        </Button>
      </div>
    </div>
  )
}
