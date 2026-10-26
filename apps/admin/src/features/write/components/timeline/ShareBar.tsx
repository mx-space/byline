import { DropdownMenu, toast } from '@lobehub/ui'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { Copy, Ellipsis, Link2, Loader2 } from 'lucide-react'

import { WEB_URL } from '~/constants/env'
import { useI18n } from '~/i18n'
import type { DraftShare } from '~/models/draft'
import { Button } from '~/ui/site-button'

const spin = stylex.keyframes({
  to: { transform: 'rotate(360deg)' },
})

const styles = stylex.create({
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 12,
    paddingInline: 0,
    borderBlockEndWidth: 1,
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: cssVar.colorBorderSecondary,
  },
  hint: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: cssVar.fontSizeSM,
    lineHeight: cssVar.lineHeightSM,
    color: cssVar.colorTextSecondary,
  },
  spinner: {
    width: '0.875rem',
    height: '0.875rem',
    animationName: spin,
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  share: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: cssVar.colorBorderSecondary,
    backgroundColor: cssVar.colorPrimaryBg,
    paddingBlock: 12,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  linkIcon: {
    width: '0.875rem',
    height: '0.875rem',
    flexShrink: 0,
    color: cssVar.colorPrimary,
  },
  url: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: cssVar.fontFamilyCode,
    fontSize: '0.625rem',
    lineHeight: '0.875rem',
    color: cssVar.colorText,
  },
  trigger: {
    display: 'inline-flex',
    width: '1.75rem',
    height: '1.75rem',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    color: {
      default: cssVar.colorTextSecondary,
      ':hover': cssVar.colorText,
    },
    backgroundColor: {
      default: null,
      ':hover': cssVar.colorFillSecondary,
      ':is([data-popup-open])': cssVar.colorFillSecondary,
    },
    boxShadow: {
      default: null,
      ':focus-visible': `0 0 0 3px color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent)`,
    },
    transitionProperty: 'color, background-color, border-color',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
  },
  ellipsis: {
    width: '1rem',
    height: '1rem',
  },
  mode: {
    flexShrink: 0,
    borderRadius: 999,
    paddingInline: '0.5rem',
    paddingBlock: '0.125rem',
    fontSize: '0.625rem',
    lineHeight: '0.875rem',
    fontWeight: 500,
  },
  following: {
    backgroundColor: `color-mix(in srgb, ${cssVar.colorSuccess} 10%, transparent)`,
    color: cssVar.colorSuccess,
  },
  pinned: {
    backgroundColor: `color-mix(in srgb, ${cssVar.colorWarning} 10%, transparent)`,
    color: cssVar.colorWarning,
  },
})

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
      <div {...stylex.props(styles.empty)}>
        <span {...stylex.props(styles.hint)}>
          {t('write.share.description')}
        </span>
        <Button
          disabled={props.pending}
          icon={Link2}
          onClick={props.onCreate}
          type="text"
        >
          {t('write.share.create')}
        </Button>
      </div>
    )
  }

  const url = shareUrlOf(props.share.token)
  const following = props.share.mode === 'follow'

  return (
    <div {...stylex.props(styles.share)}>
      <div {...stylex.props(styles.row)}>
        <Link2 aria-hidden="true" {...stylex.props(styles.linkIcon)} />
        <span {...stylex.props(styles.url)}>{url}</span>
        <Button
          aria-label={t('write.share.copy')}
          icon={Copy}
          onClick={() => {
            void navigator.clipboard.writeText(url)
            toast.success(t('write.share.copied'))
          }}
          size="small"
          title={t('write.share.copy')}
          type="text"
        />
        <DropdownMenu
          items={[
            {
              disabled: !props.canFollowCurrentDraft || following,
              icon: Link2,
              key: 'follow',
              label: t('write.share.followCurrent'),
              onClick: props.onFollowCurrentDraft,
            },
            { key: 'sep', type: 'divider' },
            {
              danger: true,
              key: 'revoke',
              label: t('write.share.revoke'),
              onClick: props.onRevoke,
            },
          ]}
          placement="bottomRight"
          triggerProps={{
            'aria-label': t('write.share.moreActions'),
            className: stylex.props(styles.trigger).className,
            disabled: props.pending,
          }}
        >
          {props.pending ? (
            <Loader2 aria-hidden="true" {...stylex.props(styles.spinner)} />
          ) : (
            <Ellipsis aria-hidden="true" {...stylex.props(styles.ellipsis)} />
          )}
        </DropdownMenu>
      </div>
      <div {...stylex.props(styles.row)}>
        <span
          {...stylex.props(
            styles.mode,
            following ? styles.following : styles.pinned,
          )}
        >
          {following
            ? t('write.share.modeFollow')
            : t('write.share.modePinned')}
        </span>
        <span {...stylex.props(styles.hint)}>
          {following
            ? t('write.share.modeFollowHint')
            : t('write.share.modePinnedHint')}
        </span>
      </div>
    </div>
  )
}
