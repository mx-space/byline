import { createStaticStyles } from '@lobehub/ui'
import { AlertCircle, Bot, Clock, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

import type {
  PublishAiResource,
  PublishAiResourceRequest,
  PublishTaskPayload,
} from '~/api/publish-jobs'
import type { AIConfig } from '~/features/settings/types/settings'
import { useI18n } from '~/i18n'
import type { TranslationKey } from '~/i18n/types'
import { Modal, ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { SegmentedControl } from '~/ui/primitives/segmented-control'
import { Button as LobeButton } from '~/ui/site-button'
import { cn } from '~/utils/cn'

import {
  choicesFromRequests,
  emptyPublishAiChoices,
  type PublishAiChoice,
  type PublishAiChoices,
  publishAiResourceLabels,
  publishAiResourceOrder,
  toPublishAiRequests,
} from './publish-ai-choices'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uaaebda38: css`
    height: min(88svh, 42rem);
    width: min(calc(100vw-2rem), 38rem);
    @media (max-width: 639px) {
      height: 100svh;
    }
    @media (max-width: 639px) {
      width: 100vw;
    }
    @media (max-width: 639px) {
      border-radius: 0;
    }
  `,
  ubc16ba49: css`
    min-height: 0px;
    flex: 1 1 0%;
    overflow-y: auto;
    padding: 1rem;
    @media (min-width: 640px) {
      padding: 1.25rem;
    }
  `,
  ue25ab85b: css`
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, ${cssVar.colorError} 25%, transparent);
    background-color: color-mix(in srgb, ${cssVar.colorError} 8%, transparent);
    padding: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  ufd7f88e1: css`
    margin-top: 0.125rem;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  u0772a9f6: css`
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, ${cssVar.colorWarning} 30%, transparent);
    background-color: color-mix(
      in srgb,
      ${cssVar.colorWarning} 10%,
      transparent
    );
    padding: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarningBg};
    }
  `,
  u2dd4fdfa: css`
    margin-bottom: 1rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ua7dc705b: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uc39c8d01: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  ufb77735e: css`
    margin-top: 1.25rem;
  `,
  ufa2251b6: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u628e6665: css`
    margin-top: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uf97905a9: css`
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    & > :not([hidden]) ~ :not([hidden]) {
      border-top-width: 1px;
      border-top-style: solid;
    }
    border-color: ${cssVar.colorBorderSecondary};
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
  `,
  ube21437a: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.75rem;
    row-gap: 0.5rem;
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
  `,
  ud3f853dd: css`
    pointer-events: none;
    opacity: 0.55;
  `,
  u3b4c716c: css`
    min-width: 0px;
    flex: 1 1 0%;
  `,
  ud36a4cfd: css`
    display: block;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  ueeb1d557: css`
    margin-top: 0.125rem;
    display: block;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ucb0b7b94: css`
    margin-top: 0.75rem;
    display: grid;
    gap: 0.5rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, ${cssVar.colorWarning} 30%, transparent);
    background-color: color-mix(
      in srgb,
      ${cssVar.colorWarning} 8%,
      transparent
    );
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u7a2110d1: css`
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: ${cssVar.colorText};
  `,
  uaa6562af: css`
    margin-top: 0.125rem;
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  `,
  u39950462: css`
    margin-top: 0.75rem;
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 0.75rem;
    row-gap: 0.25rem;
    border-radius: 12px;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  ud40b0a80: css`
    color: ${cssVar.colorTextSecondary};
  `,
  uc55d4b8a: css`
    min-width: 0px;
    color: ${cssVar.colorText};
  `,
}))

export function PublishConfirmationDialog(props: {
  aiConfig?: AIConfig
  diverged: boolean
  lockedTranslationLangs?: string[]
  failureMessage?: string | null
  onClose: () => void
  onConfirm: (
    resources: PublishAiResourceRequest[],
    options: { regenerateLockedTranslations: boolean },
  ) => void
  onReviewDiff?: () => void
  otherBranchCount: number
  open: boolean
  operation: PublishTaskPayload['operation']
  pending: boolean
  rememberedResources?: PublishAiResourceRequest[] | null
  savedAt?: string
  validationError: string | null
}) {
  const { t } = useI18n()
  const [choices, setChoices] = useState<PublishAiChoices>(
    emptyPublishAiChoices,
  )

  const [regenerateLocked, setRegenerateLocked] = useState(false)

  useEffect(() => {
    if (!props.open) return
    setChoices(choicesFromRequests(props.rememberedResources))
    setRegenerateLocked(false)
  }, [props.open, props.rememberedResources])

  const isAvailable = (resource: PublishAiResource) =>
    !getUnavailableKey(resource, props.aiConfig)
  const requests = toPublishAiRequests(choices, isAvailable)
  const lockedLangs = props.lockedTranslationLangs ?? []
  const translationSelected = requests.some(
    (request) => request.resource === 'translation',
  )
  const confirm = () =>
    props.onConfirm(requests, {
      regenerateLockedTranslations:
        translationSelected && lockedLangs.length > 0 && regenerateLocked,
    })
  const choiceOptions: { label: string; value: PublishAiChoice }[] = [
    { label: t('write.publishAi.modeNone'), value: 'none' },
    { label: t('write.publishAi.modeSync'), value: 'sync' },
    { label: t('write.publishAi.modeAsync'), value: 'async' },
  ]
  const namesFor = (mode: 'sync' | 'async') =>
    requests
      .filter((request) => request.mode === mode)
      .map((request) => t(publishAiResourceLabels[request.resource]))

  const actionKey: TranslationKey =
    props.operation === 'online-update'
      ? 'write.publishProcess.updateOnline'
      : props.operation === 'republish'
        ? 'write.publishProcess.republish'
        : 'write.header.publish'
  const descriptionKey: TranslationKey =
    props.operation === 'online-update'
      ? 'write.publishConfirm.onlineDescription'
      : props.operation === 'republish'
        ? 'write.publishConfirm.republishDescription'
        : 'write.publishConfirm.firstDescription'

  return (
    <Modal
      className={lobeStyles.uaaebda38}
      onClose={props.onClose}
      open={props.open}
    >
      <ModalHeader
        icon={Bot}
        showClose={!props.pending}
        subtitle={t(descriptionKey)}
        title={t(actionKey)}
      />
      <div className={lobeStyles.ubc16ba49}>
        {props.failureMessage ? (
          <div className={lobeStyles.ue25ab85b} role="alert">
            <AlertCircle aria-hidden="true" className={lobeStyles.ufd7f88e1} />
            <span>{props.failureMessage}</span>
          </div>
        ) : null}
        {props.validationError ? (
          <div className={lobeStyles.ue25ab85b}>
            <AlertCircle aria-hidden="true" className={lobeStyles.ufd7f88e1} />
            <span>{props.validationError}</span>
          </div>
        ) : null}

        {props.diverged ? (
          <div className={lobeStyles.u0772a9f6}>
            <AlertCircle aria-hidden="true" className={lobeStyles.ufd7f88e1} />
            <span>
              {t('write.publishConfirm.diverged', {
                count: props.otherBranchCount,
              })}
            </span>
          </div>
        ) : props.otherBranchCount > 0 ? (
          <div className={lobeStyles.u2dd4fdfa}>
            {t('write.publishConfirm.otherBranchesPreserved', {
              count: props.otherBranchCount,
            })}
          </div>
        ) : null}

        <div className={lobeStyles.ua7dc705b}>
          <Clock aria-hidden="true" className={lobeStyles.uc39c8d01} />
          <span>
            {props.savedAt
              ? t('write.publishConfirm.savedAt', { time: props.savedAt })
              : t('write.publishConfirm.willSave')}
          </span>
        </div>

        <section className={lobeStyles.ufb77735e}>
          <h3 className={lobeStyles.ufa2251b6}>
            {t('write.publishConfirm.aiTitle')}
          </h3>
          <p className={lobeStyles.u628e6665}>
            {t('write.publishConfirm.aiDescription')}
          </p>
          <div className={lobeStyles.uf97905a9}>
            {publishAiResourceOrder.map((resource) => {
              const unavailable = getUnavailableKey(resource, props.aiConfig)
              return (
                <div
                  className={cn(
                    lobeStyles.ube21437a,
                    unavailable && lobeStyles.ud3f853dd,
                  )}
                  key={resource}
                >
                  <span className={lobeStyles.u3b4c716c}>
                    <span className={lobeStyles.ud36a4cfd}>
                      {t(publishAiResourceLabels[resource])}
                    </span>
                    {unavailable ? (
                      <span className={lobeStyles.ueeb1d557}>
                        {t(unavailable)}
                      </span>
                    ) : null}
                  </span>
                  <SegmentedControl
                    aria-label={t(publishAiResourceLabels[resource])}
                    onValueChange={(value) =>
                      setChoices((current) => ({
                        ...current,
                        [resource]: value,
                      }))
                    }
                    options={choiceOptions}
                    value={choices[resource]}
                  />
                </div>
              )
            })}
          </div>
          {translationSelected && lockedLangs.length > 0 ? (
            <div className={lobeStyles.ucb0b7b94}>
              <p className={lobeStyles.u7a2110d1}>
                <Lock aria-hidden="true" className={lobeStyles.uaa6562af} />
                <span>
                  {t('write.publishAi.lockedTranslations', {
                    langs: lockedLangs.join(', '),
                  })}
                </span>
              </p>
              <Checkbox
                checked={regenerateLocked}
                label={t('write.publishAi.regenerateLocked')}
                onCheckedChange={setRegenerateLocked}
              />
            </div>
          ) : null}
          <dl className={lobeStyles.u39950462}>
            <dt className={lobeStyles.ud40b0a80}>
              {t('write.publishAi.summaryWait')}
            </dt>
            <dd className={lobeStyles.uc55d4b8a}>
              {namesFor('sync').join('、') ||
                t('write.publishAi.summaryWaitNone')}
            </dd>
            <dt className={lobeStyles.ud40b0a80}>
              {t('write.publishAi.summaryLater')}
            </dt>
            <dd className={lobeStyles.uc55d4b8a}>
              {namesFor('async').join('、') ||
                t('write.publishAi.summaryLaterNone')}
            </dd>
          </dl>
        </section>
      </div>
      <ModalFooter>
        {props.diverged && props.onReviewDiff ? (
          <Button
            onClick={props.onReviewDiff}
            type="button"
            variant="secondary"
          >
            {t('write.recovery.compareAction')}
          </Button>
        ) : null}
        <Button
          disabled={props.pending}
          onClick={props.onClose}
          type="button"
          variant="ghost"
        >
          {t('common.cancel')}
        </Button>
        <LobeButton
          disabled={Boolean(props.validationError) || props.pending}
          htmlType="button"
          loading={props.pending}
          onClick={confirm}
          type="primary"
        >
          {t(actionKey)}
        </LobeButton>
      </ModalFooter>
    </Modal>
  )
}

function getUnavailableKey(
  resource: PublishAiResource,
  config: AIConfig | undefined,
): TranslationKey | undefined {
  if (!config) return 'write.publishAi.unavailable'
  if (resource === 'summary' && !config.enableSummary) {
    return 'write.publishAi.unavailable'
  }
  if (resource === 'insights' && !config.enableInsights) {
    return 'write.publishAi.unavailable'
  }
  if (resource === 'translation') {
    if (!config.enableTranslation) return 'write.publishAi.unavailable'
    if (!config.translationTargetLanguages?.length) {
      return 'write.publishAi.translationRequiresLanguages'
    }
  }
  if (resource === 'tts' && !config.tts?.enable) {
    return 'write.publishAi.unavailable'
  }
  return undefined
}
