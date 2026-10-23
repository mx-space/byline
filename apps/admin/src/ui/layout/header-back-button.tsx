import { createStaticStyles } from '@lobehub/ui'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u13be78e6: css`
    &:focus-visible {
      outline: none;
    }
    margin-left: calc(0.375rem * -1);
    display: inline-flex;
    width: 2.25rem;
    height: 2.25rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: ${cssVar.colorTextSecondary};
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
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

export interface HeaderBackButtonProps {
  className?: string
  label?: string
  onClick?: () => void
  to?: string
}

export function HeaderBackButton(props: HeaderBackButtonProps) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const label = props.label ?? t('common.back')

  const handleClick = () => {
    if (props.onClick) {
      props.onClick()
      return
    }
    if (props.to) {
      navigate(props.to)
      return
    }
    navigate(-1)
  }

  return (
    <button
      aria-label={label}
      className={cn(lobeStyles.u13be78e6, props.className)}
      onClick={handleClick}
      title={label}
      type="button"
    >
      <ArrowLeft aria-hidden="true" className={lobeStyles.uf7b5fa97} />
    </button>
  )
}
