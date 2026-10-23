import { createStaticStyles } from '@lobehub/ui'
import { Check } from 'lucide-react'

import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import type { CoverCandidate } from './use-cover-generation'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u8563c684: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextTertiary};
  `,
  uf9acff2d: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  `,
  u00127242: css`
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    background-color: ${cssVar.colorFillSecondary};
    outline: none;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  `,
  u4b06353b: css`
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
  u05e0b018: css`
    border-color: ${cssVar.colorPrimary};
  `,
  ua29407cd: css`
    border-color: ${cssVar.colorBorderSecondary};
    &:hover {
      border-color: ${cssVar.colorBorder};
    }
  `,
  u7feacbd9: css`
    aspect-ratio: 16/9;
    width: 100%;
    object-fit: cover;
  `,
  udb6334ec: css`
    box-shadow: ${cssVar.boxShadowTertiary};
    position: absolute;
    right: 0.375rem;
    top: 0.375rem;
    display: flex;
    width: 1.25rem;
    height: 1.25rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background-color: ${cssVar.colorPrimary};
    color: ${cssVar.colorTextLightSolid};
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
}))

export function CoverGenerationCandidates(props: {
  candidates: CoverCandidate[]
  currentCover: string
  onSelect: (url: string) => void
}) {
  const { t } = useI18n()

  if (props.candidates.length === 0) {
    return (
      <p className={lobeStyles.u8563c684}>
        {t('write.coverGeneration.candidates.empty')}
      </p>
    )
  }

  return (
    <div className={lobeStyles.uf9acff2d}>
      {props.candidates.map((candidate) => {
        const selected = candidate.url === props.currentCover
        return (
          <button
            aria-pressed={selected}
            className={cn(
              `${lobeStyles.u00127242} group`,
              lobeStyles.u4b06353b,
              selected ? lobeStyles.u05e0b018 : lobeStyles.ua29407cd,
            )}
            key={candidate.taskId}
            onClick={() => props.onSelect(candidate.url)}
            title={candidate.prompt}
            type="button"
          >
            <img
              alt={candidate.prompt}
              className={lobeStyles.u7feacbd9}
              src={candidate.url}
            />
            {selected ? (
              <span className={lobeStyles.udb6334ec}>
                <Check aria-hidden="true" className={lobeStyles.uef2d6f74} />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
