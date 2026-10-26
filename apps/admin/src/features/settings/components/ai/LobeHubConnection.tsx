import { Button, Flexbox, Tag, toast } from '@lobehub/ui'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Cloud, Copy, ExternalLink } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { LobeHubDeviceLogin } from '~/api/ai'
import {
  cancelLobeHubLogin,
  disconnectLobeHub,
  getLobeHubAccount,
  pollLobeHubLogin,
  startLobeHubLogin,
} from '~/api/ai'
import { useI18n } from '~/i18n'
import { confirmDialog } from '~/ui/feedback/confirm'
import {
  Modal,
  ModalDescription,
  ModalFooter,
  ModalHeader,
} from '~/ui/feedback/modal'

import { getErrorMessage } from '../../utils/settings'

const styles = stylex.create({
  note: {
    color: cssVar.colorTextSecondary,
    fontSize: cssVar.fontSizeSM,
    marginBlock: 0,
  },
  label: { fontWeight: 500 },
  action: { alignSelf: 'flex-start' },
  code: {
    backgroundColor: cssVar.colorFillTertiary,
    borderRadius: cssVar.borderRadius,
    paddingBlock: 12,
    paddingInline: 16,
  },
  codeText: {
    fontSize: cssVar.fontSizeHeading3,
    overflowWrap: 'anywhere',
    minWidth: 0,
  },
  dialog: { width: 'min(92vw, 28rem)' },
  content: { paddingBlock: 24, paddingInline: 16 },
})

const ACCOUNT_KEY = ['ai', 'lobehub', 'account'] as const

export function LobeHubConnection(props: {
  onConnected: () => Promise<void> | void
  onDisconnected: () => void
  onStatusChange?: (connected: boolean) => void
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const account = useQuery({
    queryKey: ACCOUNT_KEY,
    queryFn: getLobeHubAccount,
    staleTime: 0,
  })
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [login, setLogin] = useState<LobeHubDeviceLogin | null>(null)
  const [terminal, setTerminal] = useState<'expired' | 'denied' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const generation = useRef(0)
  const flow = useRef<string | null>(null)
  const connected = account.data?.status === 'connected'
  const remaining = login
    ? Math.max(0, Math.ceil((Date.parse(login.expiresAt) - now) / 1000))
    : 0

  useEffect(() => {
    props.onStatusChange?.(connected)
  }, [connected, props.onStatusChange])
  useEffect(
    () => () => {
      generation.current++
      if (flow.current) void cancelLobeHubLogin(flow.current).catch(() => {})
    },
    [],
  )

  const onConnected = useEffectEvent(async () => {
    await queryClient.invalidateQueries({ queryKey: ACCOUNT_KEY })
    await props.onConnected()
  })

  useEffect(() => {
    if (!open || !login || terminal || error) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const clock = setInterval(() => setNow(Date.now()), 1000)
    async function poll() {
      if (cancelled) return
      if (Date.now() >= Date.parse(login!.expiresAt)) {
        setTerminal('expired')
        return
      }
      try {
        const result = await pollLobeHubLogin(login!.flowId)
        if (cancelled) return
        if (result.status === 'pending')
          timer = setTimeout(poll, result.intervalSeconds * 1000)
        else if (result.status === 'connected') {
          flow.current = null
          setOpen(false)
          setLogin(null)
          await onConnected()
        } else setTerminal(result.status)
      } catch (error) {
        if (!cancelled)
          setError(getErrorMessage(error, t('settings.ai.lobehub.error')))
      }
    }
    timer = setTimeout(poll, login.intervalSeconds * 1000)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearInterval(clock)
    }
  }, [open, login, terminal, error, t])

  function close() {
    generation.current++
    setOpen(false)
    setLogin(null)
    setStarting(false)
    if (flow.current) void cancelLobeHubLogin(flow.current).catch(() => {})
    flow.current = null
  }

  async function start() {
    const attempt = ++generation.current
    setOpen(true)
    setStarting(true)
    setError(null)
    setTerminal(null)
    setLogin(null)
    if (flow.current) void cancelLobeHubLogin(flow.current).catch(() => {})
    flow.current = null
    try {
      const login = await startLobeHubLogin()
      if (generation.current !== attempt) {
        void cancelLobeHubLogin(login.flowId).catch(() => {})
        return
      }
      flow.current = login.flowId
      setLogin(login)
      setNow(Date.now())
    } catch (error) {
      if (generation.current === attempt)
        setError(getErrorMessage(error, t('settings.ai.lobehub.error')))
    } finally {
      if (generation.current === attempt) setStarting(false)
    }
  }

  async function disconnect() {
    if (
      !(await confirmDialog({
        title: t('settings.ai.lobehub.disconnect'),
        description: t('settings.ai.lobehub.disconnectConfirm'),
        confirmText: t('settings.ai.lobehub.disconnect'),
        destructive: true,
      }))
    )
      return
    setDisconnecting(true)
    try {
      await disconnectLobeHub()
      queryClient.setQueryData(ACCOUNT_KEY, {
        status: 'disconnected',
        name: null,
        email: null,
      })
      props.onDisconnected()
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.ai.lobehub.error')))
    } finally {
      setDisconnecting(false)
    }
  }

  async function copyCode() {
    if (!login) return
    try {
      await navigator.clipboard.writeText(login.userCode)
      toast.success(t('settings.ai.lobehub.copied'))
    } catch {
      toast.error(t('settings.ai.lobehub.copyFailed'))
    }
  }

  return (
    <>
      <Flexbox gap={12}>
        <Flexbox horizontal align="center" justify="space-between" gap={12}>
          <span {...stylex.props(styles.label)}>
            {t('settings.ai.lobehub.account')}
          </span>
          <Tag>
            {t(
              connected
                ? 'settings.ai.lobehub.connected'
                : 'settings.ai.lobehub.disconnected',
            )}
          </Tag>
        </Flexbox>
        {account.isPending ? (
          <p role="status" {...stylex.props(styles.note)}>
            {t('settings.ai.lobehub.preparing')}
          </p>
        ) : account.isError ? (
          <div role="alert">
            <p>
              {getErrorMessage(account.error, t('settings.ai.lobehub.error'))}
            </p>
            <Button type="text" onClick={() => void account.refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : connected ? (
          <Flexbox gap={8}>
            <span>{account.data?.name || 'LobeHub'}</span>
            {account.data?.email ? (
              <p {...stylex.props(styles.note)}>{account.data.email}</p>
            ) : null}
            <Button
              className={stylex.props(styles.action).className}
              loading={disconnecting}
              onClick={() => void disconnect()}
              type="text"
            >
              {t('settings.ai.lobehub.disconnect')}
            </Button>
          </Flexbox>
        ) : (
          <>
            <p {...stylex.props(styles.note)}>
              {t(
                account.data?.status === 'refresh_required'
                  ? 'settings.ai.lobehub.refreshRequired'
                  : 'settings.ai.lobehub.description',
              )}
            </p>
            <Button
              className={stylex.props(styles.action).className}
              type="primary"
              onClick={() => void start()}
            >
              {t(
                account.data?.status === 'refresh_required'
                  ? 'settings.ai.lobehub.reconnect'
                  : 'settings.ai.lobehub.login',
              )}
            </Button>
          </>
        )}
        <Flexbox gap={4}>
          <p {...stylex.props(styles.note)}>
            {t('settings.ai.lobehub.safety')}
          </p>
          <p {...stylex.props(styles.note)}>{t('settings.ai.lobehub.saved')}</p>
        </Flexbox>
      </Flexbox>
      <Modal
        className={stylex.props(styles.dialog).className}
        onClose={close}
        open={open}
      >
        <ModalHeader icon={Cloud} title={t('settings.ai.lobehub.title')} />
        <Flexbox gap={24} className={stylex.props(styles.content).className}>
          <ModalDescription className={stylex.props(styles.note).className}>
            {t('settings.ai.lobehub.description')}
          </ModalDescription>
          {starting ? (
            <p role="status" {...stylex.props(styles.note)}>
              {t('settings.ai.lobehub.preparing')}
            </p>
          ) : error || terminal ? (
            <div role="alert">
              {error ||
                t(
                  terminal === 'expired'
                    ? 'settings.ai.lobehub.expired'
                    : 'settings.ai.lobehub.denied',
                )}
            </div>
          ) : login ? (
            <>
              <Flexbox gap={8}>
                <span>{t('settings.ai.lobehub.stepCode')}</span>
                <Flexbox
                  align="center"
                  gap={12}
                  horizontal
                  justify="space-between"
                  className={stylex.props(styles.code).className}
                >
                  <code {...stylex.props(styles.codeText)}>
                    {login.userCode}
                  </code>
                  <Button
                    aria-label={t('settings.ai.lobehub.copyCode')}
                    icon={<Copy aria-hidden="true" size={16} />}
                    onClick={() => void copyCode()}
                    size="small"
                    title={t('settings.ai.lobehub.copyCode')}
                    type="text"
                  />
                </Flexbox>
              </Flexbox>
              <Flexbox gap={8}>
                <span>{t('settings.ai.lobehub.stepAuthorize')}</span>
                <p {...stylex.props(styles.note)}>
                  {t('settings.ai.lobehub.authorizeHint')}
                </p>
              </Flexbox>
              <p aria-live="polite" {...stylex.props(styles.note)}>
                {t('settings.ai.lobehub.waiting', {
                  time: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`,
                })}
              </p>
            </>
          ) : null}
          <p {...stylex.props(styles.note)}>
            {t('settings.ai.lobehub.safety')}
          </p>
        </Flexbox>
        <ModalFooter>
          <Button onClick={close} type="text">
            {t('settings.ai.lobehub.cancel')}
          </Button>
          {error || terminal ? (
            <Button
              // lobe-design-ignore LOBE-MULTI-PRIMARY: login, retry and authorization are on mutually exclusive active surfaces
              type="primary"
              onClick={() => void start()}
            >
              {t('settings.ai.lobehub.retry')}
            </Button>
          ) : login ? (
            <Button
              href={login.verificationUriComplete || login.verificationUri}
              icon={<ExternalLink aria-hidden="true" size={16} />}
              rel="noreferrer"
              target="_blank"
              type="primary"
            >
              {t('settings.ai.lobehub.openPage')}
            </Button>
          ) : null}
        </ModalFooter>
      </Modal>
    </>
  )
}
