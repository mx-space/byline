import { createStaticStyles } from '@lobehub/ui'

import type { ImagePreset } from '~/api/ai-image'
import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import type { CoverGenerationMode } from './use-cover-generation'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u5a250822: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.375rem;
    }
  `,
  ucd6c15f2: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  u6978b7c6: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  `,
  u71989f49: css`
    border-radius: 999px;
    border-width: 1px;
    border-style: solid;
    padding-inline: 0.75rem;
    padding-block: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
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
  u8bc8d3b0: css`
    cursor: not-allowed;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    color: ${cssVar.colorTextTertiary};
  `,
  u122af085: css`
    border-color: ${cssVar.colorPrimary};
    background-color: ${cssVar.colorPrimaryBg};
    color: ${cssVar.colorPrimary};
  `,
  ua805ecfc: css`
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    color: ${cssVar.colorTextSecondary};
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  u59d40084: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
}))

interface CoverPresetPickerProps {
  mode: CoverGenerationMode
  presetId: string
  presets: ImagePreset[]
  presetsLoading: boolean
  setPresetId: (id: string) => void
}

export function CoverPresetPicker(props: CoverPresetPickerProps) {
  const { t } = useI18n()
  const inactive = props.mode === 'manual'

  return (
    <div className={lobeStyles.u5a250822}>
      <span className={lobeStyles.ucd6c15f2}>
        {t('write.coverGeneration.presetLabel')}
      </span>
      <div className={lobeStyles.u6978b7c6}>
        {props.presets.map((preset) => {
          const active = !inactive && preset.id === props.presetId
          return (
            <button
              className={cn(
                lobeStyles.u71989f49,
                lobeStyles.u4b06353b,
                inactive
                  ? lobeStyles.u8bc8d3b0
                  : active
                    ? lobeStyles.u122af085
                    : lobeStyles.ua805ecfc,
              )}
              disabled={inactive}
              key={preset.id}
              onClick={() => props.setPresetId(preset.id)}
              type="button"
            >
              {preset.label}
            </button>
          )
        })}
        {props.presets.length === 0 ? (
          <span className={lobeStyles.u59d40084}>
            {props.presetsLoading
              ? t('write.coverGeneration.presetsLoading')
              : t('write.coverGeneration.presetsEmpty')}
          </span>
        ) : null}
      </div>
      {inactive ? (
        <p className={lobeStyles.u59d40084}>
          {t('write.coverGeneration.leftPresetHint')}
        </p>
      ) : null}
    </div>
  )
}
