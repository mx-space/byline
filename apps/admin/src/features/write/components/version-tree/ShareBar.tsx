import { createStaticStyles, toast } from '@lobehub/ui'
import { Copy, Ellipsis, Link2, Loader2 } from 'lucide-react'

import { WEB_URL } from '~/constants/env'
import { useI18n } from '~/i18n'
import type { DraftShare } from '~/models/draft'
import { DropdownMenu } from '~/ui/overlay/dropdown-menu'
import { Button } from '~/ui/primitives/button'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ud7a8c834: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
  `,
  u65056704: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u6ecb3128: css`
    height: 1.75rem;
    flex-shrink: 0;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
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
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  u37be67be: css`
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorPrimaryBg};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
  `,
  u6cfc7e6a: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  u44c3b3cd: css`
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    color: ${cssVar.colorPrimary};
  `,
  u799b9084: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorText};
  `,
  u33d2fb84: css`
    width: 1.75rem;
    height: 1.75rem;
    flex-shrink: 0;
    padding: 0px;
  `,
  ud56b74b1: css`
    display: inline-flex;
    width: 1.75rem;
    height: 1.75rem;
    flex-shrink: 0;
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
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u73f8c158: css`
    width: 1rem;
    height: 1rem;
    color: ${cssVar.colorTextTertiary};
  `,
  uadfa235e: css`
    flex-shrink: 0;
    border-radius: 999px;
    background-color: color-mix(
      in srgb,
      ${cssVar.colorSuccess} 10%,
      transparent
    );
    padding-inline: 0.5rem;
    padding-block: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
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
}))

export const shareUrlOf = (token: string) => `${WEB_URL}/preview/${token}`

export function ShareBar(props: {
  canFollowCurrentDraft: boolean
  onCreate: () => void
  onFollowCurrentDraft: () => void
  onRevoke: () => void
  pending: boolean
  share: DraftShare | null
}) {
  const { t } = useI18n()

  if (!props.share) {
    return (
      <div className={lobeStyles.ud7a8c834}>
        <span className={lobeStyles.u65056704}>
          {t('write.share.description')}
        </span>
        <Button
          className={lobeStyles.u6ecb3128}
          disabled={props.pending}
          onClick={props.onCreate}
          type="button"
          variant="ghost"
        >
          {props.pending ? (
            <Loader2 aria-hidden="true" className={lobeStyles.uf9dfa057} />
          ) : (
            <Link2 aria-hidden="true" className={lobeStyles.u783b0d9d} />
          )}
          {t('write.share.create')}
        </Button>
      </div>
    )
  }

  const url = shareUrlOf(props.share.token)
  const following = props.share.mode === 'follow'

  return (
    <div className={lobeStyles.u37be67be}>
      <div className={lobeStyles.u6cfc7e6a}>
        <Link2 aria-hidden="true" className={lobeStyles.u44c3b3cd} />
        <span className={lobeStyles.u799b9084}>{url}</span>
        <Button
          aria-label={t('write.share.copy')}
          className={lobeStyles.u33d2fb84}
          onClick={() => {
            void navigator.clipboard.writeText(url)
            toast.success(t('write.share.copied'))
          }}
          type="button"
          variant="ghost"
        >
          <Copy aria-hidden="true" className={lobeStyles.u783b0d9d} />
        </Button>
        <DropdownMenu>
          <DropdownMenu.Trigger
            aria-label={t('write.share.moreActions')}
            className={lobeStyles.ud56b74b1}
            disabled={props.pending}
            type="button"
          >
            {props.pending ? (
              <Loader2 aria-hidden="true" className={lobeStyles.uf9dfa057} />
            ) : (
              <Ellipsis aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            )}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item
              disabled={!props.canFollowCurrentDraft || following}
              onClick={props.onFollowCurrentDraft}
            >
              <Link2 aria-hidden="true" className={lobeStyles.u73f8c158} />
              {t('write.share.followCurrent')}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item danger onClick={props.onRevoke}>
              {t('write.share.revoke')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      <div className={lobeStyles.u6cfc7e6a}>
        <span
          className={following ? lobeStyles.uadfa235e : lobeStyles.ud91a43b0}
        >
          {following
            ? t('write.share.modeFollow')
            : t('write.share.modePinned')}
        </span>
        <span className={lobeStyles.u65056704}>
          {following
            ? t('write.share.modeFollowHint')
            : t('write.share.modePinnedHint')}
        </span>
      </div>
    </div>
  )
}
