import {
  Button,
  createStaticStyles,
  cx,
  Descriptions,
  Flexbox,
  Icon,
  Skeleton,
  Snippet,
  Text,
  Tooltip,
} from '@lobehub/ui'
import { Ban, Clock3, Mail, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'

import type { UserDetail } from '~/api/users'
import { EmptyValue } from '~/ui/placeholders'

import { useUsersCopy } from '../copy'
import {
  formatAdminTime,
  getUserDisplayName,
  showValue,
  type UserStatus,
} from '../utils/users'
import { UserAvatar } from './UserAvatar'
import { UserStatusTag } from './UserStatusTag'

const styles = createStaticStyles(({ css, cssVar }) => ({
  actionList: css`
    gap: 8px;
  `,
  actionRow: css`
    justify-content: flex-start;

    width: 100%;
    height: auto;
    padding-block: 12px;
    padding-inline: 12px;
    border: 0;
    border-radius: ${cssVar.borderRadius};

    &&:hover:not(:disabled) {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  actionSpan: css`
    display: block;
    width: 100%;
  `,
  name: css`
    margin: 0;
    font-size: ${cssVar.fontSizeHeading2};
    font-weight: 600;
    line-height: 1.3;
  `,
  nameCompact: css`
    font-size: ${cssVar.fontSizeHeading3};
  `,
  subtitle: css`
    margin: 0;
  `,
  timeIcon: css`
    flex: none;
    color: ${cssVar.colorTextTertiary};
  `,
}))

export function UserIdentitySkeleton(props: { compact?: boolean }) {
  return (
    <Flexbox gap={16}>
      <Flexbox
        align={props.compact ? 'center' : 'flex-start'}
        gap={24}
        horizontal={props.compact}
      >
        <Skeleton.Avatar size={props.compact ? 64 : 120} />
        <Skeleton height={props.compact ? 20 : 24} width={180} />
      </Flexbox>
      <Skeleton height={32} width="100%" />
      <Skeleton.Text fontSize={14} rows={4} />
    </Flexbox>
  )
}

export function UserIdentityPanel(props: {
  busy?: boolean
  canManage: boolean
  compact?: boolean
  isSelf: boolean
  onDeactivate: () => void
  onEnable: () => void
  onInvite: () => void
  status: UserStatus
  user: UserDetail
}) {
  const copy = useUsersCopy()
  const { user, status } = props
  const name = getUserDisplayName(user)
  const subtitle =
    user.email?.trim() ||
    user.username?.trim() ||
    (status === 'profileOnly' ? copy('profileOnlyHint') : '')

  return (
    <Flexbox gap={16} width="100%">
      <Flexbox
        align={props.compact ? 'center' : 'flex-start'}
        gap={24}
        horizontal={props.compact}
        width="100%"
      >
        <UserAvatar
          avatar={user.avatar}
          name={name}
          size={props.compact ? 64 : 120}
        />
        <Flexbox gap={4} style={{ minWidth: 0 }}>
          <Flexbox align="center" gap={8} horizontal>
            <Text
              as="h2"
              className={cx(styles.name, props.compact && styles.nameCompact)}
              ellipsis={{ rows: 1, tooltipWhenOverflow: true }}
            >
              {name}
            </Text>
            <UserStatusTag status={status} />
          </Flexbox>
          {subtitle ? (
            <Text
              as="p"
              className={styles.subtitle}
              ellipsis={{ rows: 1, tooltipWhenOverflow: true }}
              type="secondary"
            >
              {subtitle}
            </Text>
          ) : null}
        </Flexbox>
      </Flexbox>
      <Snippet copyable language="txt" style={{ width: '100%' }}>
        {user.id}
      </Snippet>
      <Descriptions
        column={1}
        items={[
          {
            children: showValue(user.displayName),
            key: 'displayName',
            label: copy('displayName'),
          },
          {
            children: showValue(user.username),
            key: 'username',
            label: copy('username'),
          },
          {
            children: showValue(user.email),
            key: 'email',
            label: copy('email'),
          },
          {
            children: showValue(user.url),
            key: 'url',
            label: copy('url'),
          },
        ]}
      />
      {props.canManage ? (
        <Flexbox className={styles.actionList} gap={8}>
          {status === 'profileOnly' ? (
            <Button
              block
              className={styles.actionRow}
              disabled={props.busy}
              icon={Mail}
              onClick={props.onInvite}
              type="text"
            >
              {copy('inviteSignIn')}
            </Button>
          ) : null}
          {status === 'deactivated' ? (
            <Button
              block
              className={styles.actionRow}
              disabled={props.busy}
              icon={RotateCcw}
              loading={props.busy}
              onClick={props.onEnable}
              type="text"
            >
              {copy('enable')}
            </Button>
          ) : (
            <Tooltip title={props.isSelf ? copy('deactivateSelf') : undefined}>
              <span className={styles.actionSpan}>
                <Button
                  block
                  className={styles.actionRow}
                  danger
                  disabled={props.isSelf || props.busy}
                  icon={Ban}
                  onClick={props.onDeactivate}
                  type="text"
                >
                  {copy('deactivate')}
                </Button>
              </span>
            </Tooltip>
          )}
        </Flexbox>
      ) : null}
      <Flexbox gap={4}>
        <TimeLine
          label={copy('lastLogin')}
          value={
            user.lastLoginAt ? (
              formatAdminTime(user.lastLoginAt)
            ) : (
              <EmptyValue />
            )
          }
        />
        <TimeLine
          label={copy('createdAt')}
          value={formatAdminTime(user.createdAt)}
        />
        {user.deactivatedAt ? (
          <TimeLine
            label={copy('deactivatedAt')}
            value={formatAdminTime(user.deactivatedAt)}
          />
        ) : null}
      </Flexbox>
    </Flexbox>
  )
}

function TimeLine(props: { label: string; value: ReactNode }) {
  return (
    <Flexbox align="center" gap={8} horizontal>
      <Icon className={styles.timeIcon} icon={Clock3} size={14} />
      <Text type="secondary">{props.label}</Text>
      <Text>{props.value}</Text>
    </Flexbox>
  )
}
