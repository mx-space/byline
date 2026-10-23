import { createStaticStyles } from '@lobehub/ui'
import { Link2 } from 'lucide-react'

import { useI18n } from '~/i18n'
import type { DraftModel, VersionTreeNode } from '~/models/draft'
import { cn } from '~/utils/cn'

import { ChangeSummary } from './ChangeSummary'
import type { DraftActionHandlers } from './DraftActions'
import { DraftActions } from './DraftActions'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u2fcf7dfc: css`
    display: inline-flex;
    width: 1.125rem;
    height: 1.125rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background-color: color-mix(
      in srgb,
      ${cssVar.colorSuccess} 10%,
      transparent
    );
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
    }
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  u2b4c7bfc: css`
    display: flex;
    min-height: 2.25rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 10px;
    padding-inline: 0.5rem;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:focus-within {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  u81f6cdce: css`
    pointer-events: none;
    opacity: 0.5;
  `,
  u085fd750: css`
    margin-block: 0.375rem;
    width: 0.125rem;
    flex-shrink: 0;
    align-self: stretch;
    border-radius: 999px;
    background-color: ${cssVar.colorWarning};
  `,
  u5351433b: css`
    display: flex;
    min-width: 0px;
    flex: 1 1 0%;
    align-items: center;
    gap: 0.375rem;
    padding-block: 0.375rem;
    text-align: left;
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
  ud91a43b0: css`
    flex-shrink: 0;
    border-radius: 999px;
    background-color: color-mix(
      in srgb,
      ${cssVar.colorWarning} 10%,
      transparent
    );
    padding-inline: 0.5rem;
    padding-block: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  u1d6ed899: css`
    display: flex;
    min-height: 2.25rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 10px;
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:focus-within {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  u5ca20d2d: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uae1b9f6e: css`
    flex-shrink: 0;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
    .group:focus-within & {
      display: none;
    }
    .group:hover & {
      display: none;
    }
    .group:has([data-popup-open]) & {
      display: none;
    }
  `,
  ubf4fc73f: css`
    display: none;
    flex-shrink: 0;
    align-items: center;
    gap: 0.125rem;
    .group:focus-within & {
      display: flex;
    }
    .group:hover & {
      display: flex;
    }
    .group:has([data-popup-open]) & {
      display: flex;
    }
    @media (pointer: coarse) {
      display: flex;
    }
  `,
  ub4707f16: css`
    flex-shrink: 0;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
    .group:focus-within & {
      display: none;
    }
    .group:hover & {
      display: none;
    }
  `,
  uf5c139e2: css`
    display: none;
    flex-shrink: 0;
    align-items: center;
    gap: 0.25rem;
    border-radius: 8px;
    padding-inline: 0.375rem;
    padding-block: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorPrimary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorPrimaryBg};
    }
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
    .group:focus-within & {
      display: flex;
    }
    .group:hover & {
      display: flex;
    }
    @media (pointer: coarse) {
      display: flex;
    }
  `,
}))

export function ShareMark() {
  const { t } = useI18n()

  return (
    <span className={lobeStyles.u2fcf7dfc} title={t('write.share.linkedHere')}>
      <Link2
        aria-label={t('write.share.linkedHere')}
        className={lobeStyles.uef2d6f74}
      />
    </span>
  )
}

export function DraftLine(props: {
  deleting: boolean
  draft: DraftModel
  handlers: DraftActionHandlers
  shared: boolean
}) {
  const { format, t } = useI18n()
  const diverged = props.draft.relationToPublished === 'diverged'

  return (
    <div
      className={cn(
        `${lobeStyles.u2b4c7bfc} group`,
        props.deleting && lobeStyles.u81f6cdce,
      )}
    >
      {diverged ? (
        <span aria-hidden="true" className={lobeStyles.u085fd750} />
      ) : null}
      {props.shared ? <ShareMark /> : null}
      <button
        className={lobeStyles.u5351433b}
        onClick={props.handlers.onCompare}
        type="button"
      >
        {diverged ? (
          <span className={lobeStyles.ud91a43b0}>
            {t('write.branch.relation.diverged')}
          </span>
        ) : null}
        <ChangeSummary
          base={props.draft.baseRevision}
          head={props.draft.headRevision}
        />
      </button>
      <span className={lobeStyles.uae1b9f6e}>
        {format.relativeTime(props.draft.updatedAt ?? props.draft.createdAt)}
      </span>
      <span className={lobeStyles.ubf4fc73f}>
        <DraftActions
          deleting={props.deleting}
          draft={props.draft}
          handlers={props.handlers}
          labelled={false}
        />
      </span>
    </div>
  )
}

export function RevisionLine(props: {
  node: VersionTreeNode
  onShare: () => void
  shared: boolean
}) {
  const { format, t } = useI18n()

  return (
    <div className={`${lobeStyles.u1d6ed899} group`}>
      {props.shared ? <ShareMark /> : null}
      <span className={lobeStyles.u5ca20d2d}>
        {props.node.revision.title || t('write.editor.untitled')}
      </span>
      <span className={lobeStyles.ub4707f16}>
        {props.node.publishedAt
          ? t('write.versionTree.publishedAt', {
              time: format.relativeTime(props.node.publishedAt),
            })
          : format.relativeTime(props.node.revision.createdAt)}
      </span>
      <button
        className={lobeStyles.uf5c139e2}
        onClick={props.onShare}
        type="button"
      >
        <Link2 aria-hidden="true" className={lobeStyles.uef2d6f74} />
        {t('write.share.shareRevision')}
      </button>
    </div>
  )
}
