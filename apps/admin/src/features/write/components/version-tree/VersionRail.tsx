import { createStaticStyles } from '@lobehub/ui'

import type { GraphRow } from './layout'
import { MAX_LANE } from './layout'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  dot: css`
    position: absolute;
    box-sizing: border-box;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${cssVar.colorBgContainer};
  `,
  u62bc683e: css`
    background: ${cssVar.colorWarning};
  `,
  u88b28b5a: css`
    background: ${cssVar.colorText};
  `,
  u117e152e: css`
    border: 2px solid ${cssVar.colorText};
  `,
  u8084dc2e: css`
    background: ${cssVar.colorSuccess};
  `,
  uc2780701: css`
    background: ${cssVar.colorTextTertiary};
  `,
  u925d9134: css`
    border: 2px solid ${cssVar.colorBorder};
  `,
  ud452ad70: css`
    position: relative;
    flex-shrink: 0;
  `,
  uefbb9c95: css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    color: ${cssVar.colorBorderSecondary};
  `,
}))

const LANE_WIDTH = 16
const LANE_INSET = 4
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
        className={`${lobeStyles.dot} ${DOT_CLASS[props.tone]}`}
        style={{
          left: x,
          top: dotY,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
