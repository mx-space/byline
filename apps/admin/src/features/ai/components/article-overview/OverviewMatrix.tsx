import { createStaticStyles, cx, Icon, Tooltip } from '@lobehub/ui'
import { Check, CircleAlert, LoaderCircle, Plus } from 'lucide-react'

import type {
  ActiveGeneration,
  AiOverviewCapability,
  ArticleCoverage,
} from '~/api/ai-overview'

import { useAiCopy } from '../../copy'
import {
  CAPABILITY_LABEL,
  CAPABILITY_PATH,
} from '../../overview/capability-label'
import type { AssetRow } from './asset-rows'
import { firstAnchorIds } from './asset-rows'
import { CAPABILITY_META } from './capability-meta'
import { type CellState, resolveCell } from './coverage-cells'

const ROW_ORDER: AiOverviewCapability[] = [
  'summary',
  'insights',
  'translation',
  'tts',
]

const KIND = {
  insights: 'kindInsights',
  summary: 'kindSummary',
  translation: 'kindTranslation',
  tts: 'kindTts',
} as const

const styles = createStaticStyles(({ css, cssVar }) => ({
  cell: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorTextQuaternary};

    background: transparent;
  `,
  done: css`
    cursor: pointer;
    border-color: transparent;
    color: ${cssVar.colorSuccess};
    background: ${cssVar.colorSuccessBg};

    &:hover {
      color: ${cssVar.colorSuccess};
      background: ${cssVar.colorSuccessBgHover};
    }
  `,
  failed: css`
    cursor: pointer;
    border-color: transparent;
    color: ${cssVar.colorError};
    background: ${cssVar.colorErrorBg};

    &:hover {
      background: ${cssVar.colorErrorBgHover};
    }
  `,
  grid: css`
    display: grid;
    grid-auto-rows: 32px;
    grid-template-columns: max-content;
    column-gap: 4px;
    align-items: center;
    justify-items: center;

    width: max-content;
    min-width: 100%;
  `,
  head: css`
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
    text-align: center;
  `,
  label: css`
    display: flex;
    gap: 8px;
    align-items: center;
    justify-self: start;

    padding-inline-end: 16px;

    font-size: ${cssVar.fontSize};
    color: ${cssVar.colorText};
    white-space: nowrap;
  `,
  plus: css`
    cursor: pointer;
    border-style: dashed;
    border-color: ${cssVar.colorBorder};

    &:hover {
      color: ${cssVar.colorText};
      border-color: ${cssVar.colorTextTertiary};
    }
  `,
  scroll: css`
    overflow: auto;
  `,
  source: css`
    width: 8px;
    height: 8px;
    border: 1px solid ${cssVar.colorTextQuaternary};
    border-radius: 50%;
  `,
  stale: css`
    cursor: pointer;
    border-color: transparent;
    color: ${cssVar.colorWarning};
    background: ${cssVar.colorWarningBg};

    &:hover {
      background: ${cssVar.colorWarningBgHover};
    }
  `,
}))

export function OverviewMatrix(props: {
  activeTasks: ActiveGeneration[]
  assets: AssetRow[]
  busy: boolean
  capability?: AiOverviewCapability
  coverage: ArticleCoverage
  langs: string[]
  lockedLangs: string[]
  onGenerate: (
    capability: AiOverviewCapability,
    lang: string,
    force: boolean,
  ) => void
  onOpen: (path: string) => void
  refId: string
}) {
  const copy = useAiCopy()
  const anchors = firstAnchorIds(props.assets)
  const stale = new Set(
    props.assets.filter((row) => row.stale).map((row) => row.anchorKey),
  )
  const rows = props.capability
    ? ROW_ORDER.filter((capability) => capability === props.capability)
    : ROW_ORDER
  const showLabel = rows.length > 1

  return (
    <div className={styles.scroll}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `${showLabel ? 'max-content ' : ''}repeat(${props.langs.length}, 40px)`,
        }}
      >
        {showLabel ? <span /> : null}
        {props.langs.map((lang) => (
          <span className={styles.head} key={lang}>
            {lang}
          </span>
        ))}
        {rows.map((capability) => (
          <MatrixRow
            anchors={anchors}
            busy={props.busy}
            capability={capability}
            coverage={props.coverage}
            key={capability}
            label={copy(CAPABILITY_LABEL[capability])}
            langs={props.langs}
            locked={capability === 'translation' ? props.lockedLangs : []}
            onGenerate={props.onGenerate}
            onOpen={props.onOpen}
            refId={props.refId}
            showLabel={showLabel}
            stale={stale}
            tasks={props.activeTasks}
          />
        ))}
      </div>
    </div>
  )
}

function MatrixRow(props: {
  anchors: Map<string, string>
  busy: boolean
  capability: AiOverviewCapability
  coverage: ArticleCoverage
  label: string
  langs: string[]
  locked: string[]
  onGenerate: (
    capability: AiOverviewCapability,
    lang: string,
    force: boolean,
  ) => void
  onOpen: (path: string) => void
  refId: string
  showLabel: boolean
  stale: Set<string>
  tasks: ActiveGeneration[]
}) {
  return (
    <>
      {props.showLabel ? (
        <span className={styles.label}>
          <Icon icon={CAPABILITY_META[props.capability].icon} size="small" />
          {props.label}
        </span>
      ) : null}
      {props.langs.map((lang) => (
        <MatrixCell
          anchors={props.anchors}
          busy={props.busy}
          capability={props.capability}
          key={lang}
          lang={lang}
          locked={props.locked.includes(lang)}
          onGenerate={props.onGenerate}
          onOpen={props.onOpen}
          refId={props.refId}
          stale={props.stale.has(`${props.capability}:${lang}`)}
          state={resolveCell(
            props.coverage,
            props.capability,
            lang,
            props.tasks,
          )}
        />
      ))}
    </>
  )
}

function MatrixCell(props: {
  anchors: Map<string, string>
  busy: boolean
  capability: AiOverviewCapability
  lang: string
  locked: boolean
  onGenerate: (
    capability: AiOverviewCapability,
    lang: string,
    force: boolean,
  ) => void
  onOpen: (path: string) => void
  refId: string
  stale: boolean
  state: CellState
}) {
  const copy = useAiCopy()
  const kind = copy(KIND[props.capability])

  if (props.state === 'source') {
    return (
      <Tooltip title={copy('sourceLang', { lang: props.lang })}>
        <span className={styles.cell}>
          <span className={styles.source} />
        </span>
      </Tooltip>
    )
  }

  if (props.state === 'na') return <span className={styles.cell} />

  if (props.state === 'pending') {
    const label = `${props.lang} · ${copy('generating')}`
    return (
      <Tooltip title={label}>
        <span aria-label={label} className={styles.cell} role="img">
          <Icon icon={LoaderCircle} size="small" spin />
        </span>
      </Tooltip>
    )
  }

  const openId = props.anchors.get(`${props.capability}:${props.lang}`)
  const ready = props.state === 'has' && openId
  const failed = props.state === 'failed'
  const label = ready
    ? [
        copy('view'),
        props.lang,
        props.stale ? copy('stale') : null,
        props.locked ? copy('locked') : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : failed
      ? `${copy('retry')} ${kind} · ${props.lang}`
      : `${copy('generateKind', { kind })} · ${props.lang}`

  return (
    <Tooltip title={label}>
      <button
        aria-label={label}
        className={cx(
          styles.cell,
          ready && (props.stale ? styles.stale : styles.done),
          !ready && (failed ? styles.failed : styles.plus),
        )}
        disabled={props.busy}
        onClick={() => {
          if (ready && openId) {
            props.onOpen(
              `${CAPABILITY_PATH[props.capability]}/${props.refId}?item=${openId}`,
            )
            return
          }
          props.onGenerate(props.capability, props.lang, failed)
        }}
        type="button"
      >
        <Icon icon={ready ? Check : failed ? CircleAlert : Plus} size="small" />
      </button>
    </Tooltip>
  )
}
