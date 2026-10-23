import { Button } from '@lobehub/ui'
import { Pause, Play } from 'lucide-react'
import { useMemo } from 'react'

import type { AITtsRow } from '~/api/ai'
import { useTtsPlayback } from '~/features/_shared/components/tts/use-tts-playback'

import { useAiCopy } from '../copy'
import { aiStyles } from '../shell/styles'

export function TtsListenBody(props: {
  item: AITtsRow
  playPrimary?: boolean
}) {
  const copy = useAiCopy()
  const urls = useMemo(
    () => props.item.segments.map((segment) => segment.url),
    [props.item.segments],
  )
  const playback = useTtsPlayback(urls)

  if (!props.item.segments.length) {
    return <p className={aiStyles.meta}>{copy('ttsNoAudio')}</p>
  }

  return (
    <div className={aiStyles.stack}>
      <p className={aiStyles.meta}>
        {copy('voiceMeta', {
          model: props.item.model,
          speed: props.item.speed,
          voice: props.item.voice,
        })}
      </p>
      <div className={aiStyles.actions}>
        <Button
          htmlType="button"
          icon={Play}
          onClick={playback.playAll}
          type={props.playPrimary === false ? 'default' : 'primary'}
        >
          {copy('playAll')}
        </Button>
        {playback.playingIndex !== null ? (
          <Button htmlType="button" icon={Pause} onClick={playback.stop}>
            {copy('stopPlayback')}
          </Button>
        ) : null}
      </div>
      <div>
        {props.item.segments.map((segment, index) => {
          const playing = playback.playingIndex === index
          return (
            <div
              className={`${aiStyles.segment} ${playing ? aiStyles.segmentPlaying : ''}`}
              key={`${segment.blockId}-${segment.chunkIndex}`}
            >
              <Button
                aria-label={copy('playSegment')}
                htmlType="button"
                icon={playing ? Pause : Play}
                onClick={() => playback.toggleSegment(index)}
              />
              <p className={aiStyles.prose}>
                {segment.text || copy('emptyValue')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
