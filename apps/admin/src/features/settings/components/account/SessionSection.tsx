import {
  Button,
  confirmModal,
  createStaticStyles,
  Flexbox,
  SkeletonText,
  Tag,
  Text,
  toast,
} from '@lobehub/ui'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { resetAllCollections } from '~/data/resource/collection'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { authClient, clearAuthBearerToken } from '~/utils/authjs/auth'

import { settingsAccountCopy } from '../../copy'
import type { AccountSession } from '../../types/settings'
import { listSessions } from '../../utils/account-sessions'
import { formatDateTime, getErrorMessage } from '../../utils/settings'
import { SettingRow, SettingsGroup } from '../SettingsPrimitives'

const VISIBLE_SESSIONS = 5

const styles = createStaticStyles(({ css }) => ({
  agent: css`
    overflow: hidden;
    display: block;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))

export function SessionSection() {
  const { locale, t } = useI18n()
  const copy = (key: Parameters<typeof settingsAccountCopy>[1]) =>
    settingsAccountCopy(locale, key)
  const [expanded, setExpanded] = useState(false)
  const sessionsQuery = useQuery({
    queryFn: () => listSessions(t),
    queryKey: adminQueryKeys.settings.sessions(),
  })

  const revokeMutation = useMutation({
    mutationFn: async (session: AccountSession) => {
      if (session.current) {
        const result = await authClient.signOut()
        if (result.error)
          throw new Error(
            result.error.message || t('settings.session.error.revokeFailed'),
          )
        clearAuthBearerToken()
        resetAllCollections()
      } else {
        const result = await authClient.revokeSession({ token: session.token })
        if (result.error)
          throw new Error(
            result.error.message || t('settings.session.error.kickFailed'),
          )
      }
    },
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.session.error.operationFailed')),
      ),
    onSuccess: async (_, session) => {
      toast.success(
        session.current ? copy('signedOut') : copy('sessionRevoked'),
      )
      if (session.current) window.location.reload()
      await sessionsQuery.refetch()
    },
  })

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.revokeOtherSessions()
      if (result.error)
        throw new Error(
          result.error.message || t('settings.session.error.kickFailed'),
        )
    },
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.session.error.kickFailed')),
      ),
    onSuccess: async () => {
      toast.success(copy('othersRevoked'))
      await sessionsQuery.refetch()
    },
  })

  const sessions = sessionsQuery.data ?? []
  const visible = expanded ? sessions : sessions.slice(0, VISIBLE_SESSIONS)
  const hidden = sessions.length - visible.length

  const confirmRevoke = (session: AccountSession) =>
    confirmModal({
      content: session.current
        ? copy('signOutConfirmBody')
        : copy('revokeConfirmBody'),
      okButtonProps: { danger: true },
      okText: session.current ? copy('signOut') : copy('revoke'),
      onOk: () => revokeMutation.mutateAsync(session),
      title: session.current
        ? copy('signOutConfirmTitle')
        : copy('revokeConfirmTitle'),
    })

  return (
    <SettingsGroup
      desc={copy('sessionsDesc')}
      extra={
        sessions.length > 1 ? (
          <Button
            loading={revokeOthersMutation.isPending}
            onClick={() =>
              confirmModal({
                content: copy('revokeOthersConfirmBody'),
                okButtonProps: { danger: true },
                okText: copy('revokeOthers'),
                onOk: () => revokeOthersMutation.mutateAsync(),
                title: copy('revokeOthersConfirmTitle'),
              })
            }
            size="small"
          >
            {copy('revokeOthers')}
          </Button>
        ) : null
      }
      title={t('settings.session.title')}
    >
      {sessionsQuery.isLoading ? (
        <SkeletonText rows={3} />
      ) : sessions.length === 0 ? (
        <Text type="secondary">{t('settings.session.empty')}</Text>
      ) : (
        <>
          {visible.map((session, index) => (
            <SettingRow
              desc={[
                session.ip,
                session.current
                  ? t('settings.session.activeAt', {
                      time: formatDateTime(session.lastActiveAt),
                    })
                  : t('settings.session.loginAt', {
                      time: formatDateTime(session.lastActiveAt),
                    }),
              ]
                .filter(Boolean)
                .join(' · ')}
              divider={index > 0}
              key={session.token}
              label={
                <Flexbox align="center" as="span" gap={8} horizontal>
                  <span className={styles.agent} title={session.ua}>
                    {session.ua || copy('unknownDevice')}
                  </span>
                  {session.current ? (
                    <Tag color="success" size="small">
                      {copy('current')}
                    </Tag>
                  ) : null}
                </Flexbox>
              }
              width="auto"
            >
              <Button
                disabled={revokeMutation.isPending}
                onClick={() => confirmRevoke(session)}
                size="small"
              >
                {session.current ? copy('signOut') : copy('revoke')}
              </Button>
            </SettingRow>
          ))}
          {sessions.length > VISIBLE_SESSIONS ? (
            <Button
              block
              onClick={() => setExpanded((current) => !current)}
              type="text"
            >
              {expanded
                ? t('settings.session.action.viewMoreCollapse')
                : t('settings.session.action.viewMore', { count: hidden })}
            </Button>
          ) : null}
        </>
      )}
    </SettingsGroup>
  )
}
