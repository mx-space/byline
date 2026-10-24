import { AutoComplete, createStaticStyles } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import { getTtsVoices, type TtsVoiceOption } from '~/api/ai'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  u0bb529bd: css`
    width: 16px;
    height: 16px;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite; /* lobe-design-ignore LOBE-MOTION-DURATION: a status spinner needs a full turn */
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u8aee2b07: css`
    max-height: 16rem;
  `,
  ueb6a3cef: css`
    padding: 0.25rem;
  `,
  u10c992af: css`
    margin-left: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u59d40084: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
}))

const VOICE_CATALOG_STALE_MS = 5 * 60 * 1000
const EMPTY_VOICES: TtsVoiceOption[] = []

export function TtsVoiceField(props: {
  model?: string
  onChange: (voice: string) => void
  providerId?: string
  value: string
}) {
  const { t } = useI18n()
  const providerId = props.providerId?.trim() ?? ''
  const model = props.model?.trim() ?? ''
  const ready = Boolean(providerId && model)
  const voicesQuery = useQuery({
    enabled: ready,
    queryFn: () => getTtsVoices(providerId, model),
    queryKey: adminQueryKeys.ai.ttsVoices(providerId, model),
    retry: false,
    staleTime: VOICE_CATALOG_STALE_MS,
  })
  const voices = voicesQuery.data?.voices ?? EMPTY_VOICES
  const voiceCatalog = useMemo(
    () => ({
      ids: voices.map((voice) => voice.id),
      byId: new Map(voices.map((voice) => [voice.id, voice])),
    }),
    [voices],
  )
  const filterVoice = useCallback(
    (itemValue: unknown, query: string) => {
      if (typeof itemValue !== 'string') return false
      const normalizedQuery = query.trim().toLocaleLowerCase()
      const voice = voiceCatalog.byId.get(itemValue)
      return [itemValue, voice?.name].some((value) =>
        value?.toLocaleLowerCase().includes(normalizedQuery),
      )
    },
    [voiceCatalog],
  )
  const error =
    voicesQuery.data?.error ||
    (voicesQuery.error instanceof Error ? voicesQuery.error.message : '')

  return (
    <div className={lobeStyles.stack}>
      <AutoComplete
        disabled={!ready}
        emptyText={t('settings.ai.voiceDiscovery.empty')}
        filter={(item, query) =>
          filterVoice(
            item && typeof item === 'object' && 'value' in item
              ? String(item.value)
              : '',
            query,
          )
        }
        value={props.value}
        onChange={props.onChange}
        options={voiceCatalog.ids.map((id) => {
          const voice = voiceCatalog.byId.get(id)
          return {
            label: (
              <span>
                <span>{voice?.name ?? id}</span>
                {voice?.name && voice.name !== id ? (
                  <span className={lobeStyles.u10c992af}>{id}</span>
                ) : null}
              </span>
            ),
            value: id,
          }
        })}
        placeholder={
          ready
            ? t('settings.ai.voiceDiscovery.inputPlaceholder')
            : t('settings.ai.voiceDiscovery.selectModel')
        }
        suffix={
          voicesQuery.isFetching ? (
            <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
          ) : undefined
        }
      />
      {ready ? (
        <span className={lobeStyles.u59d40084}>
          {error
            ? t('settings.ai.voiceDiscovery.error', { error })
            : voices.length > 0
              ? t('settings.ai.voiceDiscovery.found', {
                  count: voices.length,
                })
              : t('settings.ai.voiceDiscovery.manual')}
        </span>
      ) : null}
    </div>
  )
}
