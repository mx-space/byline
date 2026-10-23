import { createStaticStyles } from '@lobehub/ui'

import type { GraphRow } from './layout'
import { MAX_LANE } from './layout'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u62bc683e: css`
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 999px;
    background-color: ${cssVar.colorWarning};
    box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    box-shadow: 0 0 0 3px
      color-mix(in srgb, ${cssVar.colorWarning} 20%, transparent);
  `,
  u88b28b5a: css`
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 999px;
    background-color: ${cssVar.colorPrimary};
    box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    box-shadow: 0 0 0 3px
      color-mix(in srgb, ${cssVar.colorPrimary} 25%, transparent);
  `,
  u117e152e: css`
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 999px;
    border-width: 0.5rem;
    border-color: ${cssVar.colorPrimary};
    background-color: ${cssVar.colorBgLayout};
  `,
  u8084dc2e: css`
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    background-color: ${cssVar.colorSuccess};
    box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    box-shadow: 0 0 0 3px
      color-mix(in srgb, ${cssVar.colorSuccess} 25%, transparent);
  `,
  uc2780701: css`
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 999px;
    background-color: ${cssVar.colorTextTertiary};
  `,
  u925d9134: css`
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    border-width: 0.5rem;
    border-color: ${cssVar.colorBorder};
    background-color: ${cssVar.colorBgLayout};
  `,
  ud452ad70: css`
    position: relative;
    flex-shrink: 0;
  `,
  uefbb9c95: css`
    position: absolute;
    inset: 0px;
    width: 100%;
    height: 100%;
    color: ${cssVar.colorBorder};
  `,
}))

const LANE_WIDTH = 16
const LANE_INSET = 9
const MERGE_RADIUS = 8

export const laneX = (lane: number) =>
  LANE_INSET + Math.min(lane, MAX_LANE) * LANE_WIDTH

export const railWidth = (lanes: number) => laneX(lanes - 1) + LANE_INSET

export type RailTone =
  'conflict' | 'current' | 'draft' | 'online' | 'published' | 'revision'

const DOT_CLASS: Record<RailTone, string> = {
  conflict: lobeStyles.u62bc683e,
  current: lobeStyles.u88b28b5a,
  draft: lobeStyles.u117e152e,
  online: lobeStyles.u8084dc2e,
  published: lobeStyles.uc2780701,
  revision: lobeStyles.u925d9134,
}

const mergePath = (from: number, to: number, dotY: number) => {
  const radius = Math.min(MERGE_RADIUS, from - to, dotY)
  return `M ${from} 0 V ${dotY - radius} Q ${from} ${dotY} ${from - radius} ${dotY} H ${to}`
}

export function VersionRail(props: {
  dotY: number
  row: GraphRow
  tone: RailTone
}) {
  const { dotY, row } = props
  const x = laneX(row.lane) + 0.5

  return (
    <div aria-hidden="true" className={lobeStyles.ud452ad70}>
      <svg
        className={lobeStyles.uefbb9c95}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      >
        {row.lanesThrough.map((lane) => (
          <line
            key={lane}
            x1={laneX(lane) + 0.5}
            x2={laneX(lane) + 0.5}
            y1={0}
            y2="100%"
          />
        ))}

        {row.incoming ? <line x1={x} x2={x} y1={0} y2={dotY} /> : null}

        {row.continues ? <line x1={x} x2={x} y1={dotY} y2="100%" /> : null}

        {row.lanesMerging.map((lane) => (
          <path d={mergePath(laneX(lane) + 0.5, x, dotY)} key={lane} />
        ))}
      </svg>

      <span
        className={`absolute ${DOT_CLASS[props.tone]}`}
        style={{
          left: x,
          top: dotY,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
