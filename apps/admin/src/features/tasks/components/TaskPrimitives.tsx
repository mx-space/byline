import { createStaticStyles, ScrollArea, Tag } from '@lobehub/ui'
import type { ReactNode } from 'react'

import type { AITaskStatus } from '~/api/tasks'

import { taskStatusColor } from '../hooks/use-task-labels'

const styles = createStaticStyles(({ css, cssVar }) => ({
  field: css`
    min-width: 0;
  `,
  fieldLabel: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
  `,
  fieldValue: css`
    color: ${cssVar.colorText};
    margin-block-start: 2px;
  `,
  code: css`
    background: ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadius};
    color: ${cssVar.colorText};
    display: inline-block;
    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    max-width: 100%;
    overflow: hidden;
    padding-block: 1px;
    padding-inline: 6px;
    text-overflow: ellipsis;
    vertical-align: baseline;
    white-space: nowrap;
  `,
  json: css`
    background: ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadius};
    max-height: 18rem;
  `,
  jsonBody: css`
    color: ${cssVar.colorText};
    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    line-height: 1.5;
    margin: 0;
    padding: 12px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  `,
}))

export function StatusBadge(props: {
  children: ReactNode
  status: AITaskStatus
}) {
  return (
    <Tag color={taskStatusColor[props.status]} size="small">
      {props.children}
    </Tag>
  )
}

const toneColor = {
  accent: 'blue',
  danger: 'error',
  info: 'blue',
  neutral: undefined,
  success: 'success',
  warning: 'warning',
} as const

export function SmallBadge(props: {
  children: ReactNode
  className?: string
  'data-testid'?: string
  pill?: boolean
  size?: 'md' | 'sm'
  title?: string
  tone?: keyof typeof toneColor
  variant?: 'bordered' | 'outline' | 'soft'
}) {
  return (
    <Tag
      className={props.className}
      color={toneColor[props.tone ?? 'neutral']}
      data-testid={props['data-testid']}
      shape={props.pill ? 'round' : 'normal'}
      size={props.size === 'sm' ? 'small' : 'middle'}
      title={props.title}
      variant={props.variant === 'outline' ? 'outlined' : 'filled'}
    >
      {props.children}
    </Tag>
  )
}

export function Field(props: { children: ReactNode; label: string }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{props.label}</div>
      <div className={styles.fieldValue}>{props.children}</div>
    </div>
  )
}

export function Code(props: { children: ReactNode }) {
  return <code className={styles.code}>{props.children}</code>
}

export function JsonBlock(props: { value: unknown }) {
  return (
    <ScrollArea className={styles.json} scrollFade="vertical">
      <pre className={styles.jsonBody}>
        {JSON.stringify(props.value, null, 2)}
      </pre>
    </ScrollArea>
  )
}
