import { createStaticStyles } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { translationCoverageQuery } from '~/features/dashboard/queries'
import {
  aiOverviewArticlePath,
  postSeoChecks,
  postTranslationCheck,
  type SeoFieldCheck,
} from '~/features/dashboard/utils/desk'
import { formatLanguageLabel } from '~/lib/languages'
import type { DraftModel } from '~/models/draft'

import type { DraftCopyKey } from '../copy'
import { useDraftCopy } from '../copy'
import { FactList } from './DraftChanges'

const styles = createStaticStyles(({ css, cssVar }) => ({
  link: css`
    color: ${cssVar.colorLink};

    &:hover {
      color: ${cssVar.colorLinkHover};
    }
  `,
  muted: css`
    color: ${cssVar.colorTextTertiary};
  `,
  ok: css`
    color: ${cssVar.colorSuccess};
  `,
  warn: css`
    color: ${cssVar.colorWarning};
  `,
}))

function textSource(
  seo: string | null | undefined,
  fallback: string | null | undefined,
): 'post' | 'seo' | null {
  if (seo?.trim()) return 'seo'
  if (fallback?.trim()) return 'post'
  return null
}

export function DraftChecks(props: { draft: DraftModel }) {
  const { copy, locale } = useDraftCopy()
  const head = props.draft.headRevision
  const data = head.typeSpecificData ?? {}
  const refId = props.draft.document.refId
  const coverage = useQuery({
    ...translationCoverageQuery,
    enabled: Boolean(refId),
  })
  const checks = postSeoChecks({
    image: data.image,
    seo: data.seo,
    summary: data.summary,
    title: head.title,
  })
  const sources = {
    description: textSource(data.seo?.description, data.summary),
    image: textSource(data.seo?.image, data.image),
    title: textSource(data.seo?.title, head.title),
  }
  const translation = postTranslationCheck(
    coverage.data?.find((row) => row.article.id === refId)?.coverage
      .translation,
  )
  const missingNames = translation.missingLangs
    .map((lang) => formatLanguageLabel(lang, locale))
    .join(copy('authorJoin'))

  const translationValue = !refId
    ? copy('checkTranslationNew')
    : coverage.isPending
      ? copy('checkTranslationLoading')
      : translation.state === 'unset'
        ? copy('checkTranslationUnset')
        : translation.state === 'gap'
          ? copy('checkTranslationGap', {
              done: translation.done,
              langs: missingNames,
              total: translation.total,
            })
          : copy('checkTranslationDone', { total: translation.total })
  const translationTone =
    !refId || coverage.isPending || translation.state === 'unset'
      ? styles.muted
      : translation.state === 'gap'
        ? styles.warn
        : styles.ok

  return (
    <FactList
      rows={[
        ...checks.map((field) => ({
          key: field.key,
          label: copy(labelKey(field.key)),
          value: (
            <span className={toneClass(field)}>
              {seoValue(field, sources[field.key], copy)}
            </span>
          ),
        })),
        {
          key: 'translation',
          label: copy('checkLabelTranslation'),
          value: (
            <>
              <span className={translationTone}>{translationValue}</span>
              {refId ? (
                <Link className={styles.link} to={aiOverviewArticlePath(refId)}>
                  {copy('checkViewTranslation')}
                </Link>
              ) : null}
            </>
          ),
        },
      ]}
    />
  )
}

function labelKey(key: SeoFieldCheck['key']): DraftCopyKey {
  if (key === 'image') return 'checkLabelCover'
  if (key === 'title') return 'checkLabelTitle'
  return 'checkLabelDescription'
}

function toneClass(field: SeoFieldCheck) {
  if (field.state === 'ok') return styles.ok
  if (field.state === 'long') return styles.warn
  return styles.muted
}

function seoValue(
  field: SeoFieldCheck,
  source: 'post' | 'seo' | null,
  copy: ReturnType<typeof useDraftCopy>['copy'],
) {
  if (field.key === 'image') {
    return field.state === 'ok'
      ? copy('checkCoverOk', { source: copy(coverSourceKey(source)) })
      : copy('checkCoverMissing')
  }
  if (field.state === 'missing') {
    return copy(
      field.key === 'title' ? 'checkTitleMissing' : 'checkDescriptionMissing',
    )
  }
  const sourceLabel = copy(textSourceKey(field.key, source))
  return copy(field.state === 'long' ? 'checkLengthLong' : 'checkLengthOk', {
    limit: field.limit ?? 0,
    source: sourceLabel,
    used: field.used,
  })
}

function coverSourceKey(source: 'post' | 'seo' | null): DraftCopyKey {
  return source === 'seo' ? 'checkSourceSeoImage' : 'checkSourceCover'
}

function textSourceKey(
  key: 'description' | 'title',
  source: 'post' | 'seo' | null,
): DraftCopyKey {
  if (key === 'title') {
    return source === 'seo' ? 'checkSourceSeoTitle' : 'checkSourceTitle'
  }
  return source === 'seo' ? 'checkSourceSeoDescription' : 'checkSourceSummary'
}
