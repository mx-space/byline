import { createStaticStyles } from '@lobehub/ui'
import { Pause, Play, RefreshCw, Square } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import type { AITtsSegment } from '~/api/ai'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

import { useTtsPlayback } from './use-tts-playback'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u8563c684: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u6ed543e2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.75rem;
    }
  `,
  u15950813: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.375rem;
  `,
  ud756d144: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
  uee129b1d: css`
    height: 1.75rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  uafbdd13a: css`
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  ud89972fe: css`
    position: relative;
  `,
  u495631b8: css`
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    top: 1rem;
    width: 1px;
    background-color: ${cssVar.colorBorderSecondary};
  `,
  u6f7e013d: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.5rem;
    }
  `,
  ufe9f6aa9: css`
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  `,
  u6d44aa81: css`
    position: relative;
    z-index: 10;
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    transition: all 0.15s ease;
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
  uf14e53be: css`
    background-color: ${cssVar.colorPrimary};
    color: ${cssVar.colorTextLightSolid};
    box-shadow: ${cssVar.boxShadowTertiary};
  `,
  u3e66ef7b: css`
    min-width: 0px;
    flex: 1 1 0%;
    border-radius: 12px;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  `,
  u59c936b3: css`
    background-color: ${cssVar.colorPrimaryBg};
  `,
  uf808c93b: css`
    &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorFillSecondary} 50%,
        transparent
      );
    }
  `,
  u8ac8e5e5: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorText};
  `,
  u1a949e93: css`
    background-color: ${cssVar.colorBgContainer};
    color: ${cssVar.colorTextSecondary};
    box-shadow: 0 0 0 1px ${cssVar.colorPrimary};
    box-shadow: 0 0 0 3px ${cssVar.colorBorderSecondary};
    &:hover {
      color: ${cssVar.colorText};
    }
    &:hover {
      box-shadow: 0 0 0 3px ${cssVar.colorBorder};
    }
  `,
}))

export function TtsSegmentPlayer(props: {
  segments: AITtsSegment[]
  onRegenerate?: () => void
  regenerateSubmitting?: boolean
}) {
  const { t } = useI18n()
  const urls = useMemo(
    () => props.segments.map((segment) => segment.url),
    [props.segments],
  )
  const playback = useTtsPlayback(urls)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (playback.playingIndex === null) return
    itemRefs.current[playback.playingIndex]?.scrollIntoView({
      block: 'nearest',
    })
  }, [playback.playingIndex])

  if (props.segments.length === 0) {
    return <p className={lobeStyles.u8563c684}>{t('ttsPlayer.empty')}</p>
  }

  return (
    <div className={lobeStyles.u6ed543e2}>
      <div className={lobeStyles.u15950813}>
        {playback.playingIndex !== null ? (
          <span className={lobeStyles.ud756d144}>
            {t('ttsPlayer.progress', {
              current: playback.playingIndex + 1,
              total: props.segments.length,
            })}
          </span>
        ) : null}
        {props.onRegenerate ? (
          <Button
            className={lobeStyles.uee129b1d}
            disabled={props.regenerateSubmitting}
            onClick={props.onRegenerate}
            type="button"
            variant="ghost"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                lobeStyles.u783b0d9d,
                props.regenerateSubmitting && lobeStyles.uafbdd13a,
              )}
            />
            {t('ai.action.regenerate')}
          </Button>
        ) : null}
        <Button
          className={lobeStyles.uee129b1d}
          onClick={playback.playAll}
          type="button"
          variant="ghost"
        >
          <Play aria-hidden="true" className={lobeStyles.u783b0d9d} />
          {t('ttsPlayer.playAll')}
        </Button>
        {playback.playingIndex !== null ? (
          <Button
            className={lobeStyles.uee129b1d}
            onClick={playback.stop}
            type="button"
            variant="ghost"
          >
            <Square aria-hidden="true" className={lobeStyles.u783b0d9d} />
            {t('ttsPlayer.stop')}
          </Button>
        ) : null}
      </div>

      <div className={lobeStyles.ud89972fe}>
        <div aria-hidden="true" className={lobeStyles.u495631b8} />
        <div className={lobeStyles.u6f7e013d}>
          {props.segments.map((segment, index) => {
            const active = playback.playingIndex === index
            const segmentPlaying = active && playback.isPlaying
            return (
              <div
                className={lobeStyles.ufe9f6aa9}
                key={`${segment.blockId}-${segment.chunkIndex}`}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
              >
                <button
                  aria-label={
                    segmentPlaying
                      ? t('ttsPlayer.pauseSegment')
                      : t('ttsPlayer.playSegment')
                  }
                  className={cn(
                    lobeStyles.u6d44aa81,
                    lobeStyles.u4b06353b,
                    active
                      ? lobeStyles.uf14e53be
                      : `${lobeStyles.u1a949e93} ring-inset`,
                  )}
                  onClick={() => playback.toggleSegment(index)}
                  type="button"
                >
                  {segmentPlaying ? (
                    <Pause
                      aria-hidden="true"
                      className={lobeStyles.u783b0d9d}
                    />
                  ) : (
                    <Play aria-hidden="true" className={lobeStyles.u783b0d9d} />
                  )}
                </button>
                <div
                  className={cn(
                    lobeStyles.u3e66ef7b,
                    active ? lobeStyles.u59c936b3 : lobeStyles.uf808c93b,
                  )}
                >
                  <p className={lobeStyles.u8ac8e5e5}>{segment.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
