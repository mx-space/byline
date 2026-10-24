import { createStaticStyles } from '@lobehub/ui'

import { useI18n } from '~/i18n'
import { TextArea } from '~/ui/primitives/text-field'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u5a250822: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.375rem;
    }
  `,
  ud27e9536: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  ucd6c15f2: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  u9679fd27: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorPrimary};
    &:hover {
      text-decoration: underline;
    }
  `,
  uc3fb2b24: css`
    min-height: 8rem;
    line-height: 1.5rem;
  `,
}))

interface CoverPromptEditorProps {
  onUsePreset: () => void
  promptText: string
  setPromptText: (value: string) => void
}

export function CoverPromptEditor(props: CoverPromptEditorProps) {
  const { t } = useI18n()

  return (
    <div className={lobeStyles.u5a250822}>
      <div className={lobeStyles.ud27e9536}>
        <span className={lobeStyles.ucd6c15f2}>
          {t('write.coverGeneration.promptLabel')}
        </span>
        <button
          className={lobeStyles.u9679fd27}
          onClick={props.onUsePreset}
          type="button"
        >
          {t('write.coverGeneration.backToPreset')}
        </button>
      </div>
      <TextArea
        controlClassName={lobeStyles.uc3fb2b24}
        onChange={props.setPromptText}
        placeholder={t('write.coverGeneration.promptPlaceholder')}
        value={props.promptText}
      />
    </div>
  )
}
