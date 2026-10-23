import { createStaticStyles } from '@lobehub/ui'

import { useI18n } from '~/i18n'
import type { ContentRevision } from '~/models/draft'

import { formatCharCount, summarizeRevisionChange } from './change-summary'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ud764cbe7: css`
    display: flex;
    min-width: 0px;
    align-items: baseline;
    gap: 0.375rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
  `,
  ud548d54f: css`
    flex-shrink: 0;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
    }
  `,
  u3593e6be: css`
    flex-shrink: 0;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  ub139ad23: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${cssVar.colorTextSecondary};
  `,
  u5bc98aa4: css`
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
}))

const MAX_FIELDS = 2

export function ChangeSummary(props: {
  base: ContentRevision
  head: ContentRevision
}) {
  const { t } = useI18n()
  const summary = summarizeRevisionChange(props.base, props.head)
  const shown = summary.fieldKeys.slice(0, MAX_FIELDS).map((key) => t(key))
  const rest = summary.fieldKeys.length - shown.length
  const fields =
    shown.length > 0
      ? t('write.versionTree.fieldsChanged', {
          fields: [
            shown.join('、'),
            rest > 0 ? t('write.versionTree.fieldsMore', { count: rest }) : '',
          ]
            .filter(Boolean)
            .join(''),
        })
      : summary.charDelta === 0
        ? t('write.versionTree.noChange')
        : t('write.versionTree.bodyOnly')

  return (
    <span className={lobeStyles.ud764cbe7}>
      {summary.charDelta === 0 ? null : (
        <span
          className={
            summary.charDelta > 0 ? lobeStyles.ud548d54f : lobeStyles.u3593e6be
          }
        >
          {t(
            summary.charDelta > 0
              ? 'write.versionTree.charsAdded'
              : 'write.versionTree.charsRemoved',
            { count: formatCharCount(Math.abs(summary.charDelta)) },
          )}
        </span>
      )}
      <span className={lobeStyles.ub139ad23}>{fields}</span>
    </span>
  )
}

export function TitleChangeLine(props: {
  base: ContentRevision
  head: ContentRevision
}) {
  const { t } = useI18n()
  if (props.base.title === props.head.title) return null

  return (
    <span className={lobeStyles.u5bc98aa4}>
      {t('write.versionTree.titleChangedTo', {
        title: props.head.title || t('write.editor.untitled'),
      })}
    </span>
  )
}
