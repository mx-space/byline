import { createStaticStyles } from '@lobehub/ui'
import { Loader2, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import { useI18n } from '~/i18n'
import { Drawer } from '~/ui/feedback/drawer'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'

import { CoverGenerationCandidates } from './CoverGenerationCandidates'
import { CoverPresetPicker } from './CoverPresetPicker'
import { CoverPromptEditor } from './CoverPromptEditor'
import type { useCoverGeneration } from './use-cover-generation'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u1928799c: css`
    width: min(90vw, 28rem);
  `,
  u2b5fa9a9: css`
    min-height: 0px;
    flex: 1 1 0%;
  `,
  u06ae061d: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem;
    }
    padding: 1rem;
  `,
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
  u6da6a3c3: css`
    width: 100%;
  `,
  u0bb529bd: css`
    width: 1rem;
    height: 1rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  uf58545da: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  u130717d3: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  u2f506536: css`
    text-decoration: underline;
    text-underline-offset: 2px;
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

type CoverGenerationDrawerProps = ReturnType<typeof useCoverGeneration>

export function CoverGenerationDrawer(props: CoverGenerationDrawerProps) {
  const { t } = useI18n()

  return (
    <Drawer
      icon={Sparkles}
      onClose={props.closeDrawer}
      open={props.open}
      title={t('write.coverGeneration.title')}
      widthClassName={lobeStyles.u1928799c}
    >
      <Scroll
        className={lobeStyles.u2b5fa9a9}
        innerClassName={lobeStyles.u06ae061d}
      >
        {props.models.length > 0 ? (
          <div className={lobeStyles.u5a250822}>
            <span className={lobeStyles.ucd6c15f2}>
              {t('write.coverGeneration.modelLabel')}
            </span>
            <SelectField
              aria-label={t('write.coverGeneration.modelLabel')}
              onValueChange={props.setSelectedModel}
              options={props.models.map((model) => ({
                label: model.name,
                value: model.id,
              }))}
              value={props.selectedModel}
            />
          </div>
        ) : null}

        <CoverPresetPicker
          mode={props.mode}
          presetId={props.presetId}
          presets={props.presets}
          presetsLoading={props.presetsLoading}
          setPresetId={props.setPresetId}
        />

        {props.mode === 'manual' ? (
          <CoverPromptEditor
            onUsePreset={props.onUsePreset}
            promptText={props.promptText}
            setPromptText={props.setPromptText}
          />
        ) : (
          <div className={lobeStyles.u5a250822}>
            <Button
              className={lobeStyles.u6da6a3c3}
              disabled={!props.canDraftPrompt || props.isDraftingPrompt}
              onClick={props.onViewEditPrompt}
              type="button"
              variant="secondary"
            >
              {props.isDraftingPrompt ? (
                <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
              ) : null}
              {props.isDraftingPrompt
                ? t('write.coverGeneration.draftingHint')
                : t('write.coverGeneration.viewEditPrompt')}
            </Button>
            {!props.canDraftPrompt ? (
              <p className={lobeStyles.uf58545da}>
                {t('write.coverGeneration.needTitleHint')}
              </p>
            ) : null}
            {props.writerProviderMissing ? (
              <p className={lobeStyles.u130717d3}>
                {t('write.coverGeneration.writerProviderMissingHint')}{' '}
                <Link className={lobeStyles.u2f506536} to="/setting/ai">
                  {t('write.coverGeneration.writerProviderMissingLink')}
                </Link>{' '}
                <button
                  className={lobeStyles.u2f506536}
                  onClick={props.onWriteManually}
                  type="button"
                >
                  {t('write.coverGeneration.writeManuallyLink')}
                </button>
              </p>
            ) : null}
          </div>
        )}

        <Button
          className={lobeStyles.u6da6a3c3}
          disabled={!props.canGenerate || props.isGenerating}
          onClick={props.onGenerate}
          type="button"
        >
          {props.isGenerating ? (
            <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
          ) : (
            <Sparkles aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          )}
          {props.isGenerating
            ? t('write.coverGeneration.generating')
            : t('write.coverGeneration.generate')}
        </Button>

        <div className={lobeStyles.u5a250822}>
          <span className={lobeStyles.ucd6c15f2}>
            {t('write.coverGeneration.candidatesTitle')}
          </span>
          <CoverGenerationCandidates
            candidates={props.candidates}
            currentCover={props.currentCover}
            onSelect={props.onSelectCandidate}
          />
        </div>
      </Scroll>
    </Drawer>
  )
}
