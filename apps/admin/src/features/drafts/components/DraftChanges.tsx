import { createStaticStyles, cx } from '@lobehub/ui'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import type { DraftModel, RevisionSnapshot } from '~/models/draft'

import type { DraftCopyKey } from '../copy'
import { useDraftCopy } from '../copy'
import type { DraftFieldKey } from '../utils/draft-decision'
import {
  draftFieldChanges,
  signedDelta,
  snapshotWordCount,
} from '../utils/draft-decision'
import { computeDiffStats } from '../utils/draft-diff'
import { useCategoryNames } from './use-category-names'
import { useDraftAuthors } from './use-draft-authors'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  arrow: css`
    flex: none;
    color: ${cssVar.colorTextQuaternary};
  `,
  delta: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
  from: css`
    color: ${cssVar.colorTextTertiary};
    text-decoration: line-through;
    text-decoration-color: ${cssVar.colorTextQuaternary};
  `,
  label: css`
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
  `,
  list: css`
    display: grid;
    grid-template-columns: 6rem minmax(0, 1fr);
    margin: 0;

    ${responsive.md} {
      grid-template-columns: 4.5rem minmax(0, 1fr);
    }
  `,
  none: css`
    margin: 0;
    padding-block: 12px;
    padding-inline: 16px;
    color: ${cssVar.colorTextSecondary};
  `,
  term: css`
    padding-block: 12px;
    padding-inline: 16px 8px;

    & + dd {
      padding-block: 12px;
      padding-inline: 8px 16px;
    }

    &:not(:first-of-type),
    &:not(:first-of-type) + dd {
      border-block-start: 1px solid ${cssVar.colorFillSecondary};
    }
  `,
  value: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: center;

    min-width: 0;
    margin: 0;

    font-size: ${cssVar.fontSize};
    color: ${cssVar.colorText};
    overflow-wrap: anywhere;
  `,
  words: css`
    font-variant-numeric: tabular-nums;
  `,
}))

const fieldLabel: Record<DraftFieldKey, DraftCopyKey> = {
  authors: 'fieldAuthors',
  category: 'fieldCategory',
  cover: 'fieldCover',
  slug: 'fieldSlug',
  summary: 'fieldSummary',
  tags: 'fieldTags',
  title: 'fieldTitle',
}

export function FactList(props: {
  rows: Array<{ key: string; label: string; value: ReactNode }>
}) {
  return (
    <dl className={styles.list}>
      {props.rows.map((row) => (
        <Row key={row.key} label={row.label} value={row.value} />
      ))}
    </dl>
  )
}

function Row(props: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className={cx(styles.term, styles.label)}>{props.label}</dt>
      <dd className={styles.value}>{props.value}</dd>
    </>
  )
}

function Change(props: { from: ReactNode; to: ReactNode }) {
  return (
    <>
      <span className={styles.from}>{props.from}</span>
      <ArrowRight aria-hidden className={styles.arrow} size={14} />
      <span>{props.to}</span>
    </>
  )
}

export function DraftChanges(props: {
  published: RevisionSnapshot
  head: RevisionSnapshot
}) {
  const { copy, format } = useDraftCopy()
  const authorNames = useDraftAuthors()
  const categoryName = useCategoryNames()
  const changes = draftFieldChanges(props.published, props.head, {
    authors: authorNames,
    category: categoryName,
    empty: copy('emptyValue'),
    listJoin: copy('authorJoin'),
  })
  const bodyStats = computeDiffStats(props.published, props.head)
  const wordsBefore = snapshotWordCount(props.published)
  const wordsAfter = snapshotWordCount(props.head)

  if (changes.length === 0 && bodyStats.isSame) {
    return <p className={styles.none}>{copy('changesNone')}</p>
  }

  const rows: Array<{ key: string; label: string; value: ReactNode }> =
    changes.map((change) => ({
      key: change.key,
      label: copy(fieldLabel[change.key]),
      value: <Change from={change.from} to={change.to} />,
    }))
  if (!bodyStats.isSame) {
    rows.push({
      key: 'body',
      label: copy('fieldBody'),
      value: (
        <>
          <Change
            from={copy('wordCount', { count: format.number(wordsBefore) })}
            to={
              <span className={styles.words}>
                {copy('wordCount', { count: format.number(wordsAfter) })}
              </span>
            }
          />
          {wordsAfter === wordsBefore ? null : (
            <span className={styles.delta}>
              {signedDelta(wordsAfter - wordsBefore)}
            </span>
          )}
        </>
      ),
    })
  }
  return <FactList rows={rows} />
}

export function DraftOverview(props: { draft: DraftModel }) {
  const { copy, format } = useDraftCopy()
  const categoryName = useCategoryNames()
  const head = props.draft.headRevision
  const data = head.typeSpecificData ?? {}
  const rows: Array<{ key: string; label: string; value: ReactNode }> = [
    {
      key: 'words',
      label: copy('fieldWords'),
      value: (
        <span className={styles.words}>
          {copy('wordCount', { count: format.number(snapshotWordCount(head)) })}
        </span>
      ),
    },
  ]
  if (data.categoryId) {
    rows.push({
      key: 'category',
      label: copy('fieldCategory'),
      value: categoryName(data.categoryId),
    })
  }
  if (data.slug?.trim()) {
    rows.push({
      key: 'slug',
      label: copy('fieldSlug'),
      value: data.slug.trim(),
    })
  }
  if (data.tags?.length) {
    rows.push({
      key: 'tags',
      label: copy('fieldTags'),
      value: data.tags.join(copy('authorJoin')),
    })
  }
  if (data.summary?.trim()) {
    rows.push({
      key: 'summary',
      label: copy('fieldSummary'),
      value: data.summary.trim(),
    })
  }
  return <FactList rows={rows} />
}
