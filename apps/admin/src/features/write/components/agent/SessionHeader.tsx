import { createStaticStyles } from '@lobehub/ui'
import {
  ChevronDown,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

import type { AgentSessionMeta } from '~/hooks/use-agent-session-manager'
import { useI18n } from '~/i18n'
import { confirmDialog } from '~/ui/feedback/confirm'
import { DropdownMenu } from '~/ui/overlay/dropdown-menu'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u355a147c: css`
    display: flex;
    height: 2.25rem;
    flex-shrink: 0;
    align-items: center;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.5rem;
  `,
  uf6d9673f: css`
    display: flex;
    flex: 1 1 0%;
    align-items: center;
    gap: 0.375rem;
    text-align: left;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorError};
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  u99616931: css`
    display: flex;
    height: 2.25rem;
    flex-shrink: 0;
    align-items: center;
    gap: 0.25rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.5rem;
  `,
  ud943fc3e: css`
    display: flex;
    min-width: 0px;
    flex: 1 1 0%;
    align-items: center;
  `,
  u535294c8: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  uf283ea9b: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  ufc18c167: css`
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
    opacity: 0.5;
  `,
  u33e87723: css`
    max-height: 16rem;
    width: 16rem;
    overflow-y: auto;
  `,
  u6a769bbc: css`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-block: 1.5rem;
  `,
  u90218af2: css`
    width: 1rem;
    height: 1rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
    color: ${cssVar.colorTextTertiary};
  `,
  u553fd8a2: css`
    flex-direction: column;
    align-items: flex-start;
    gap: 0.125rem;
  `,
  u0af62bfb: css`
    background-color: ${cssVar.colorFillSecondary};
  `,
  uaf233a89: css`
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u36955ba6: css`
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u02034fc7: css`
    display: flex;
    align-items: center;
    gap: 0.125rem;
  `,
  u908a12ba: css`
    display: flex;
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
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  ub1dd3762: css`
    display: flex;
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
      background-color: ${cssVar.colorErrorBg};
    }
    &:hover {
      color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 30%,
        transparent
      );
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorError};
    }
  `,
}))

interface SessionHeaderProps {
  sessions: AgentSessionMeta[]
  activeSessionId: string | null
  isLoading: boolean
  loadError: boolean
  onSwitch: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onRetryLoad: () => void
  onExport: () => void
}

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function pickSessionDate(session: AgentSessionMeta): Date | null {
  return parseDate(session.createdAt) ?? parseDate(session.updatedAt)
}

export function SessionHeader(props: SessionHeaderProps) {
  const {
    sessions,
    activeSessionId,
    isLoading,
    loadError,
    onSwitch,
    onCreate,
    onDelete,
    onRetryLoad,
    onExport,
  } = props
  const { t } = useI18n()

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const [open, setOpen] = useState(false)

  const relativeTime = (date: Date | null) => {
    if (!date) return t('write.agent.session.untitled')
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return t('write.agent.session.relativeJustNow')
    if (minutes < 60)
      return t('write.agent.session.relativeMinutes', { count: minutes })
    if (minutes < 1440)
      return t('write.agent.session.relativeHours', {
        count: Math.floor(minutes / 60),
      })
    return t('write.agent.session.relativeDays', {
      count: Math.floor(minutes / 1440),
    })
  }

  const sessionLabel = (session: AgentSessionMeta) =>
    session.title ??
    session.derivedTitle ??
    relativeTime(pickSessionDate(session))

  const activeTitle = activeSession
    ? sessionLabel(activeSession)
    : t('write.agent.session.untitled')

  const selectSession = (id: string) => {
    setOpen(false)
    if (id !== activeSessionId) onSwitch(id)
  }

  const handleDelete = async () => {
    if (!activeSessionId) return
    const ok = await confirmDialog({
      title: t('write.agent.session.deleteTitle'),
      destructive: true,
    })
    if (ok) onDelete(activeSessionId)
  }

  if (loadError) {
    return (
      <div className={lobeStyles.u355a147c}>
        <button
          className={lobeStyles.uf6d9673f}
          onClick={onRetryLoad}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={lobeStyles.uef2d6f74} />
          {t('write.agent.loadSessionsFailed')}
        </button>
      </div>
    )
  }

  const sorted = [...sessions].sort((a, b) => {
    const da = pickSessionDate(a)?.getTime() ?? 0
    const db = pickSessionDate(b)?.getTime() ?? 0
    return db - da
  })

  return (
    <div className={lobeStyles.u99616931}>
      <div className={lobeStyles.ud943fc3e}>
        <DropdownMenu onOpenChange={setOpen} open={open}>
          <DropdownMenu.Trigger className={lobeStyles.u535294c8} type="button">
            <span className={lobeStyles.uf283ea9b}>{activeTitle}</span>
            <ChevronDown aria-hidden="true" className={lobeStyles.ufc18c167} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className={lobeStyles.u33e87723}>
            {isLoading ? (
              <div className={lobeStyles.u6a769bbc}>
                <Loader2 aria-hidden="true" className={lobeStyles.u90218af2} />
              </div>
            ) : sorted.length === 0 ? (
              <DropdownMenu.Empty>
                {t('write.agent.session.empty')}
              </DropdownMenu.Empty>
            ) : (
              sorted.map((session) => {
                const subDate =
                  parseDate(session.updatedAt) ?? parseDate(session.createdAt)
                const hasTopTitle = Boolean(
                  session.title ?? session.derivedTitle,
                )
                const sub = hasTopTitle ? relativeTime(subDate) : null
                return (
                  <DropdownMenu.Item
                    aria-current={
                      session.id === activeSessionId ? 'true' : undefined
                    }
                    className={cn(
                      lobeStyles.u553fd8a2,
                      session.id === activeSessionId && lobeStyles.u0af62bfb,
                    )}
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                  >
                    <span className={lobeStyles.uaf233a89}>
                      {sessionLabel(session)}
                    </span>
                    {sub ? (
                      <span className={lobeStyles.u36955ba6}>{sub}</span>
                    ) : null}
                  </DropdownMenu.Item>
                )
              })
            )}
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      <div className={lobeStyles.u02034fc7}>
        <button
          className={lobeStyles.u908a12ba}
          onClick={onExport}
          title={t('write.agent.session.export')}
          type="button"
        >
          <Download aria-hidden="true" className={lobeStyles.u783b0d9d} />
        </button>
        <button
          className={lobeStyles.u908a12ba}
          onClick={onCreate}
          title={t('write.agent.session.newTitle')}
          type="button"
        >
          <Plus aria-hidden="true" className={lobeStyles.u783b0d9d} />
        </button>
        {activeSessionId ? (
          <button
            className={lobeStyles.ub1dd3762}
            onClick={handleDelete}
            title={t('write.agent.session.deleteTitle')}
            type="button"
          >
            <Trash2 aria-hidden="true" className={lobeStyles.u783b0d9d} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
