import { createStaticStyles } from '@lobehub/ui'
import {
  ArrowLeftRight,
  Ellipsis,
  History,
  Link2,
  Loader2,
  PencilLine,
  Send,
  Trash2,
} from 'lucide-react'

import { useI18n } from '~/i18n'
import type { DraftModel } from '~/models/draft'
import { DropdownMenu } from '~/ui/overlay/dropdown-menu'
import { Button } from '~/ui/primitives/button'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uee129b1d: css`
    height: 1.75rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  u2d172465: css`
    display: inline-flex;
    width: 1.75rem;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
    &[data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
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
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u73f8c158: css`
    width: 1rem;
    height: 1rem;
    color: ${cssVar.colorTextTertiary};
  `,
}))

export interface DraftActionHandlers {
  onCompare: () => void
  onContinue: () => void
  onDelete: () => void
  onHistory: () => void
  onPublish: () => void
  onShare: () => void
}

export function DraftActions(props: {
  deleting: boolean
  draft: DraftModel
  handlers: DraftActionHandlers
  labelled: boolean
}) {
  const { t } = useI18n()
  const { handlers } = props

  return (
    <>
      <Button
        aria-label={
          props.labelled ? undefined : t('write.versionTree.continue')
        }
        className={lobeStyles.uee129b1d}
        onClick={handlers.onContinue}
        type="button"
        variant="ghost"
      >
        <PencilLine aria-hidden="true" className={lobeStyles.u783b0d9d} />
        {props.labelled ? t('write.versionTree.continue') : null}
      </Button>
      <Button
        aria-label={props.labelled ? undefined : t('write.branch.compare')}
        className={lobeStyles.uee129b1d}
        onClick={handlers.onCompare}
        type="button"
        variant="ghost"
      >
        <ArrowLeftRight aria-hidden="true" className={lobeStyles.u783b0d9d} />
        {props.labelled ? t('write.branch.compare') : null}
      </Button>
      <DropdownMenu>
        <DropdownMenu.Trigger
          aria-label={t('write.versionTree.moreActions')}
          className={lobeStyles.u2d172465}
          disabled={props.deleting}
          type="button"
        >
          {props.deleting ? (
            <Loader2 aria-hidden="true" className={lobeStyles.uf9dfa057} />
          ) : (
            <Ellipsis aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          )}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onClick={handlers.onHistory}>
            <History aria-hidden="true" className={lobeStyles.u73f8c158} />
            {t('write.branch.history')}
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={handlers.onShare}>
            <Link2 aria-hidden="true" className={lobeStyles.u73f8c158} />
            {t('write.share.shareDraft')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={props.draft.relationToPublished === 'same'}
            onClick={handlers.onPublish}
          >
            <Send aria-hidden="true" className={lobeStyles.u73f8c158} />
            {t('write.branch.publish')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item danger onClick={handlers.onDelete}>
            <Trash2 aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            {t('common.delete')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </>
  )
}
