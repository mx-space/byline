import type { ToolCallGroupItem } from '@haklex/rich-agent-core'
import { createStaticStyles } from '@lobehub/ui'
import { Check, ChevronRight, Loader2, X } from 'lucide-react'
import { useState } from 'react'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

import { isReplayableToolItem } from './agent-operations'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uc8add4c1: css`
    display: flex;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  `,
  uc7edc5c0: css`
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 999px;
    background-color: ${cssVar.colorFillSecondary};
    opacity: 0.5;
  `,
  uf9dfa057: css`
    width: 0.875rem;
    height: 0.875rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  u03d9edcc: css`
    width: 0.875rem;
    height: 0.875rem;
    color: ${cssVar.colorSuccess};
  `,
  u8a360676: css`
    width: 0.875rem;
    height: 0.875rem;
    color: ${cssVar.colorError};
  `,
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  u560b44ca: css`
    margin-bottom: 0.125rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: ${cssVar.colorTextSecondary};
  `,
  u474a96b4: css`
    margin: 0px;
    max-height: 12rem;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    border-radius: 0.25rem;
    padding: 0.375rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  uaff4ee69: css`
    background-color: ${cssVar.colorErrorBg};
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 20%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  u07345add: css`
    background-color: ${cssVar.colorFillSecondary};
    color: ${cssVar.colorTextSecondary};
  `,
  u032458a7: css`
    display: flex;
    width: 100%;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
    padding-block: 0.25rem;
    text-align: left;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.375;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  `,
  u01d6268c: css`
    &:hover {
      color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u50ca6ba5: css`
    cursor: default;
  `,
  u920917e0: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${cssVar.fontFamilyCode};
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u7862275b: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${cssVar.colorTextSecondary};
  `,
  u36e579c0: css`
    flex: 1 1 0%;
  `,
  u7faad9fa: css`
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
    color: ${cssVar.colorTextSecondary};
    transition: transform 0.15s ease;
  `,
  u35be72eb: css`
    display: flex;
    min-width: 0px;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    padding-left: 1.5rem;
  `,
  u5174068b: css`
    display: flex;
    width: 100%;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
    padding-block: 0.25rem;
    text-align: left;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.375;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u5b06b7ef: css`
    flex-shrink: 0;
    font-family: ${cssVar.fontFamilyCode};
    color: ${cssVar.colorTextSecondary};
  `,
  uf5120a69: css`
    min-width: 0px;
    padding-left: 1rem;
  `,
  u706bfe77: css`
    margin-top: 0.375rem;
    height: 1.5rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
}))

type ItemStatus = ToolCallGroupItem['status']

function StatusIcon({ status }: { status: ItemStatus }) {
  return (
    <span className={lobeStyles.uc8add4c1}>
      {status === 'pending' ? <span className={lobeStyles.uc7edc5c0} /> : null}
      {status === 'running' ? (
        <Loader2 aria-hidden="true" className={lobeStyles.uf9dfa057} />
      ) : null}
      {status === 'completed' ? (
        <Check aria-hidden="true" className={lobeStyles.u03d9edcc} />
      ) : null}
      {status === 'error' ? (
        <X aria-hidden="true" className={lobeStyles.u8a360676} />
      ) : null}
    </span>
  )
}

function DetailBlock(props: { label: string; text: string; tone?: 'error' }) {
  return (
    <div className={lobeStyles.u7e0b7cdf}>
      <div className={lobeStyles.u560b44ca}>{props.label}</div>
      <pre
        className={cn(
          lobeStyles.u474a96b4,
          props.tone === 'error' ? lobeStyles.uaff4ee69 : lobeStyles.u07345add,
        )}
      >
        {props.text}
      </pre>
    </div>
  )
}

function ToolItemRow({ item }: { item: ToolCallGroupItem }) {
  const [open, setOpen] = useState(false)
  const hasDetail =
    Object.keys(item.params).length > 0 || Boolean(item.result || item.error)

  return (
    <div className={lobeStyles.u7e0b7cdf}>
      <button
        className={cn(
          lobeStyles.u032458a7,
          hasDetail ? lobeStyles.u01d6268c : lobeStyles.u50ca6ba5,
        )}
        disabled={!hasDetail}
        onClick={() => hasDetail && setOpen((value) => !value)}
        type="button"
      >
        <StatusIcon status={item.status} />
        <span className={lobeStyles.u920917e0}>{item.toolName}</span>
        {item.description ? (
          <span className={lobeStyles.u7862275b}>{item.description}</span>
        ) : (
          <span className={lobeStyles.u36e579c0} />
        )}
        {hasDetail ? (
          <ChevronRight
            aria-hidden="true"
            className={cn(lobeStyles.u7faad9fa, open && 'rotate-90')}
          />
        ) : null}
      </button>

      {open && hasDetail ? (
        <div className={lobeStyles.u35be72eb}>
          {Object.keys(item.params).length > 0 ? (
            <DetailBlock
              label="params"
              text={JSON.stringify(item.params, null, 2)}
            />
          ) : null}
          {item.result ? (
            <DetailBlock label="result" text={item.result} />
          ) : null}
          {item.error ? (
            <DetailBlock label="error" text={item.error} tone="error" />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function deriveGroupStatus(items: ToolCallGroupItem[]): ItemStatus {
  if (items.some((item) => item.status === 'error')) return 'error'
  if (items.some((item) => item.status === 'running')) return 'running'
  if (items.length > 0 && items.every((item) => item.status === 'completed'))
    return 'completed'
  return 'pending'
}

export function ToolCallGroupView(props: {
  items: ToolCallGroupItem[]
  reapplyDisabled?: boolean
  onReapply: (items: ToolCallGroupItem[]) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { items } = props
  const replayable = items.filter(isReplayableToolItem)
  const completed = items.filter((item) => item.status === 'completed').length
  const status = deriveGroupStatus(items)

  return (
    <div className={lobeStyles.u7e0b7cdf}>
      <button
        className={lobeStyles.u5174068b}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <StatusIcon status={status} />
        <span className={lobeStyles.u67bab313}>
          {t('write.agent.bubble.toolGroupCount', { count: items.length })}
        </span>
        <span className={lobeStyles.u5b06b7ef}>
          {completed}/{items.length}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={cn(lobeStyles.u7faad9fa, open && 'rotate-90')}
        />
      </button>

      {open ? (
        <div className={lobeStyles.uf5120a69}>
          {items.map((item) => (
            <ToolItemRow item={item} key={item.id} />
          ))}
        </div>
      ) : null}

      {replayable.length > 0 ? (
        <Button
          className={lobeStyles.u706bfe77}
          disabled={props.reapplyDisabled}
          onClick={() => props.onReapply(items)}
          type="button"
          variant="subtle"
        >
          {t('write.agent.button.reapply')}
          {t('write.agent.bubble.toolGroupReapply', {
            count: replayable.length,
          })}
        </Button>
      ) : null}
    </div>
  )
}
