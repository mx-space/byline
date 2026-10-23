import { createStaticStyles } from '@lobehub/ui'
import { AudioLines, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import { TtsSegmentPlayer } from '~/features/_shared/components/tts/TtsSegmentPlayer'
import { useI18n } from '~/i18n'
import { Drawer } from '~/ui/feedback/drawer'
import { EmptyState } from '~/ui/patterns/EmptyState'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import type { useTtsGeneration } from './use-tts-generation'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ube28d39b: css`
    width: min(90vw, 32rem);
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
  u6ed543e2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.75rem;
    }
  `,
  u07cf7244: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 0.75rem;
    row-gap: 0.5rem;
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.75rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u152c1189: css`
    display: flex;
    gap: 0.5rem;
  `,
  u36e579c0: css`
    flex: 1 1 0%;
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
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u0e55306e: css`
    color: ${cssVar.colorTextTertiary};
  `,
  u61324a98: css`
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  ud956d652: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.5rem;
    }
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    padding: 0.75rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  ubd9c32d0: css`
    border-color: ${cssVar.colorErrorBg};
    background-color: ${cssVar.colorErrorBg};
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 40%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  ud1afa777: css`
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    color: ${cssVar.colorTextSecondary};
  `,
  ud27e9536: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  u3032cae0: css`
    font-variant-numeric: tabular-nums;
  `,
  uab3196fb: css`
    height: 0.375rem;
    overflow: hidden;
    border-radius: 999px;
    background-color: ${cssVar.colorBgContainer};
  `,
  u47e0f650: css`
    height: 100%;
    border-radius: 999px;
    background-color: ${cssVar.colorPrimary};
    transition-property: width;
  `,
}))

type TtsGenerationDrawerProps = ReturnType<typeof useTtsGeneration>

export function TtsGenerationDrawer(props: TtsGenerationDrawerProps) {
  const { t } = useI18n()

  return (
    <Drawer
      icon={AudioLines}
      onClose={props.closeDrawer}
      open={props.open}
      title={t('write.ttsGeneration.title')}
      widthClassName={lobeStyles.ube28d39b}
    >
      <Scroll
        className={lobeStyles.u2b5fa9a9}
        innerClassName={lobeStyles.u06ae061d}
      >
        {props.rows.length > 0 ? (
          <div className={lobeStyles.u6978b7c6}>
            {props.rows.map((row) => {
              const active = row.lang === props.activeLang
              return (
                <button
                  className={cn(
                    lobeStyles.u71989f49,
                    lobeStyles.u4b06353b,
                    active ? lobeStyles.u122af085 : lobeStyles.ua805ecfc,
                  )}
                  key={row.lang}
                  onClick={() => props.setActiveLang(row.lang)}
                  type="button"
                >
                  {row.lang}
                </button>
              )
            })}
          </div>
        ) : null}

        {props.isLoading ? (
          <p className={lobeStyles.u59d40084}>
            {t('write.ttsGeneration.status.loading')}
          </p>
        ) : props.activeRow ? (
          <div className={lobeStyles.u6ed543e2}>
            <div className={lobeStyles.u07cf7244}>
              <ConfigItem
                label={t('write.ttsGeneration.modelLabel')}
                value={props.activeRow.model}
              />
              <ConfigItem
                label={t('write.ttsGeneration.voiceLabel')}
                value={props.activeRow.voice}
              />
              <ConfigItem
                label={t('write.ttsGeneration.speedLabel')}
                value={String(props.activeRow.speed)}
              />
              <ConfigItem
                label={t('write.ttsGeneration.blockCountLabel')}
                value={t('write.ttsGeneration.blockCount', {
                  count: props.activeRow.blockOrder.length,
                })}
              />
            </div>
            <p className={lobeStyles.u59d40084}>
              {t('write.ttsGeneration.charCount', {
                count: props.activeRow.charCount,
              })}
            </p>
            <TtsSegmentPlayer segments={props.activeRow.segments} />
          </div>
        ) : (
          <EmptyState
            description={t('write.ttsGeneration.empty.description')}
            icon={AudioLines}
            title={t('write.ttsGeneration.empty.title')}
          />
        )}

        {props.runStatus !== 'idle' ? (
          <RunStatusPanel
            progress={props.progress}
            progressMessage={props.progressMessage}
            runError={props.runError}
            runStatus={props.runStatus}
          />
        ) : null}

        <div className={lobeStyles.u152c1189}>
          <Button
            className={lobeStyles.u36e579c0}
            disabled={props.isRunning}
            onClick={props.generate}
            type="button"
          >
            {props.isRunning ? (
              <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
            ) : (
              <Sparkles aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            )}
            {t('write.ttsGeneration.generate')}
          </Button>
          <Button
            className={lobeStyles.u36e579c0}
            disabled={props.isRunning}
            onClick={props.regenerate}
            type="button"
            variant="secondary"
          >
            {props.isRunning ? (
              <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
            ) : (
              <RefreshCw aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            )}
            {t('write.ttsGeneration.regenerate')}
          </Button>
        </div>
        <p className={lobeStyles.u59d40084}>
          {t('write.ttsGeneration.regenerateHint')}
        </p>
      </Scroll>
    </Drawer>
  )
}

function ConfigItem(props: { label: string; value: string }) {
  return (
    <div>
      <div className={lobeStyles.u0e55306e}>{props.label}</div>
      <div className={lobeStyles.u61324a98}>{props.value}</div>
    </div>
  )
}

function RunStatusPanel(props: {
  progress: null | number
  progressMessage?: string
  runError?: string
  runStatus: 'failed' | 'running' | 'succeeded'
}) {
  const { t } = useI18n()
  const percent = Math.max(0, Math.min(100, props.progress ?? 0))

  return (
    <div
      className={cn(
        lobeStyles.ud956d652,
        props.runStatus === 'failed'
          ? lobeStyles.ubd9c32d0
          : lobeStyles.ud1afa777,
      )}
    >
      <div className={lobeStyles.ud27e9536}>
        <span>
          {props.runStatus === 'running'
            ? t('write.ttsGeneration.status.generating')
            : props.runStatus === 'succeeded'
              ? t('write.ttsGeneration.status.upToDate')
              : t('write.ttsGeneration.status.failed')}
        </span>
        {props.runStatus === 'running' && props.progress !== null ? (
          <span className={lobeStyles.u3032cae0}>{Math.round(percent)}%</span>
        ) : null}
      </div>
      {props.runStatus === 'running' ? (
        <div className={lobeStyles.uab3196fb}>
          <div
            className={lobeStyles.u47e0f650}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
      {props.runStatus === 'running' && props.progressMessage ? (
        <p>{props.progressMessage}</p>
      ) : null}
      {props.runStatus === 'failed' && props.runError ? (
        <p>{props.runError}</p>
      ) : null}
    </div>
  )
}
