import { Button, Flexbox, Tag, Text } from '@lobehub/ui'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { type HTMLAttributes, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import type {
  LocaleMetaField,
  LocaleMetaRow,
  LocaleMetaSource,
} from '~/api/ai-overview'

import { type AiCopyKey, useAiCopy } from '../../copy'
import {
  LOCALE_META_ANCHOR,
  LOCALE_META_PREVIEW,
  localeMetaEditPath,
  visibleLocaleMeta,
} from './locale-meta'

const SOURCE_TAG: Record<
  LocaleMetaSource,
  { color?: string; label: AiCopyKey }
> = {
  ai: { color: 'purple', label: 'localeMetaAi' },
  empty: { label: 'localeMetaEmpty' },
  human: { color: 'blue', label: 'localeMetaHuman' },
  inherited: { label: 'localeMetaInherited' },
  locked: { color: 'gold', label: 'localeMetaLocked' },
}

const styles = stylex.create({
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: '4px',
    minWidth: 0,
  },
  text: {
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    margin: 0,
    color: cssVar.colorText,
    fontSize: cssVar.fontSizeSM,
    lineHeight: 1.5,
  },
  muted: {
    color: cssVar.colorTextSecondary,
  },
  clickable: {
    cursor: 'pointer',
  },
})

function FieldCell(props: { field: LocaleMetaField }) {
  const copy = useAiCopy()
  const tag = SOURCE_TAG[props.field.source]
  return (
    <div {...stylex.props(styles.cell)}>
      <Tag color={tag.color} size="small">
        {copy(tag.label)}
      </Tag>
      {props.field.text ? (
        <p
          {...stylex.props(
            styles.text,
            props.field.source === 'inherited' && styles.muted,
          )}
          title={props.field.text}
        >
          {props.field.text}
        </p>
      ) : null}
    </div>
  )
}

export function LocaleMetaSection(props: {
  onOpen: (path: string) => void
  postEditPath?: (id: string) => string
  refId: string
  rows: LocaleMetaRow[]
  translations: Array<{ id: string; lang: string }>
}) {
  const copy = useAiCopy()
  const [expanded, setExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === `#${LOCALE_META_ANCHOR}`) {
      rootRef.current?.scrollIntoView({ block: 'start' })
    }
  }, [hash])
  const visible = visibleLocaleMeta(props.rows, expanded)
  const pathOf = (row: LocaleMetaRow) =>
    localeMetaEditPath(row, props.refId, props.translations, props.postEditPath)

  const columns: ProColumns<LocaleMetaRow>[] = [
    {
      dataIndex: 'lang',
      render: (_, row) => (
        <Flexbox gap={2}>
          <Text strong>{row.lang}</Text>
          {row.isSource ? (
            <Text fontSize={12} type="secondary">
              {copy('localeMetaSourceLang')}
            </Text>
          ) : null}
        </Flexbox>
      ),
      title: copy('localeMetaLang'),
      width: 104,
    },
    {
      dataIndex: 'seoTitle',
      render: (_, row) => <FieldCell field={row.seoTitle} />,
      title: copy('localeMetaSeoTitle'),
    },
    {
      dataIndex: 'seoDescription',
      render: (_, row) => <FieldCell field={row.seoDescription} />,
      title: copy('localeMetaSeoDescription'),
    },
    {
      dataIndex: 'summary',
      render: (_, row) => <FieldCell field={row.summary} />,
      title: copy('localeMetaSummary'),
    },
  ]

  return (
    <Flexbox gap={12} id={LOCALE_META_ANCHOR} ref={rootRef}>
      <Flexbox gap={4}>
        <Text as="h2" fontSize={16} strong>
          {copy('localeMetaTitle')}
        </Text>
        <Text type="secondary">{copy('localeMetaDescription')}</Text>
      </Flexbox>
      <ProTable<LocaleMetaRow>
        columns={columns}
        dataSource={visible.rows}
        onRow={(row) => {
          const path = pathOf(row)
          return {
            ...(path ? stylex.props(styles.clickable) : {}),
            onClick: () => {
              if (path) props.onOpen(path)
            },
          } as HTMLAttributes<HTMLElement>
        }}
        options={false}
        pagination={false}
        rowKey="lang"
        scroll={{ x: 760 }}
        search={false}
        tableLayout="fixed"
        toolBarRender={false}
        variant="outlined"
      />
      {props.rows.length > LOCALE_META_PREVIEW ? (
        <Flexbox horizontal>
          <Button onClick={() => setExpanded((value) => !value)} type="text">
            {expanded
              ? copy('localeMetaShowLess')
              : copy('localeMetaShowMore', { count: visible.hidden })}
          </Button>
        </Flexbox>
      ) : null}
    </Flexbox>
  )
}
