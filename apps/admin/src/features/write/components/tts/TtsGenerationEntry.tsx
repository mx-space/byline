import { createStaticStyles } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { AudioLines } from 'lucide-react'

import { getOption } from '~/api/options'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/primitives/button'

import { TtsGenerationDrawer } from './TtsGenerationDrawer'
import { useTtsGeneration } from './use-tts-generation'

const lobeStyles = createStaticStyles(({ css }) => ({
  u6da6a3c3: css`
    width: 100%;
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

export function TtsGenerationEntry(props: { refId?: string }) {
  const { t } = useI18n()

  const optionsQuery = useQuery({
    queryFn: () => getOption<{ tts?: { enable?: boolean } }>('ai'),
    queryKey: adminQueryKeys.ai.ttsOptions(),
    staleTime: 60_000,
  })
  const enabled = Boolean(optionsQuery.data?.tts?.enable)

  const generation = useTtsGeneration({ enabled, refId: props.refId })

  if (!enabled || !props.refId) return null

  return (
    <>
      <Button
        className={lobeStyles.u6da6a3c3}
        onClick={generation.openDrawer}
        type="button"
        variant="subtle"
      >
        <AudioLines aria-hidden="true" className={lobeStyles.uf7b5fa97} />
        {t('write.ttsGeneration.entry')}
      </Button>
      <TtsGenerationDrawer {...generation} />
    </>
  )
}
