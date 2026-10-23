import type { ToolCallGroupItem } from '@haklex/rich-agent-core'
import { ColorSchemeProvider } from '@haklex/rich-editor/static'
import { DynamicHostRenderer } from '@haklex/rich-ext-dynamic'
import { createStaticStyles, toast } from '@lobehub/ui'
import { useEffect, useState } from 'react'

import { useI18n } from '~/i18n'
import { useThemeMode } from '~/theme'
import { Modal, ModalHeader } from '~/ui/feedback/modal'
import { Button } from '~/ui/primitives/button'
import type { DynamicDraft } from '~/vendor/rich-editor/utils/dynamic-tools'
import {
  readDynamicDraft,
  readDynamicReceipt,
} from '~/vendor/rich-editor/utils/dynamic-tools'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u8a292509: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  `,
  u86fb216c: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.5rem;
    }
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.75rem;
  `,
  ufa2251b6: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u846e6b39: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u1cb24f07: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorError};
  `,
  uf8d0139d: css`
    width: min(960px, calc(100vw-2rem));
    max-width: none;
  `,
  u4074ef4d: css`
    max-height: 75vh;
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem;
    }
    overflow: auto;
    padding: 1rem;
  `,
  u34516836: css`
    cursor: pointer;
  `,
  u29562ef2: css`
    margin-top: 0.5rem;
    max-height: 16rem;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.75rem;
  `,
  u611864a2: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorError};
  `,
}))

function ComponentPreview({ draft }: { draft: DynamicDraft }) {
  const { isDark } = useThemeMode()
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = URL.createObjectURL(
      new Blob([draft.source], { type: 'text/javascript' }),
    )
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [draft.source])
  return url ? (
    <ColorSchemeProvider colorScheme={isDark ? 'dark' : 'light'}>
      <DynamicHostRenderer
        url={url}
        componentProps={draft.props}
        initialHeight={draft.initialHeight}
      />
    </ColorSchemeProvider>
  ) : null
}

export function DynamicComponentCard({
  item,
  disabled,
  onPublish,
}: {
  item: ToolCallGroupItem
  disabled: boolean
  onPublish: (item: ToolCallGroupItem) => Promise<void>
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const draft = readDynamicDraft(item)
  if (!draft) return null
  const { inserted } = readDynamicReceipt(item)

  const publish = async () => {
    setPublishing(true)
    setError('')
    try {
      await onPublish(item)
      setOpen(false)
      toast.success(
        t(
          draft.target
            ? 'write.agent.dynamic.updated'
            : 'write.agent.dynamic.inserted',
        ),
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setPublishing(false)
    }
  }

  const actions = (
    <div className={lobeStyles.u8a292509}>
      {!open ? (
        <Button type="button" variant="subtle" onClick={() => setOpen(true)}>
          {t('write.agent.dynamic.preview')}
        </Button>
      ) : null}
      <Button
        type="button"
        disabled={disabled || publishing || inserted}
        onClick={() => void publish()}
      >
        {inserted
          ? t(
              draft.target
                ? 'write.agent.dynamic.updated'
                : 'write.agent.dynamic.inserted',
            )
          : publishing
            ? t('write.agent.dynamic.uploading')
            : t(
                draft.target
                  ? 'write.agent.dynamic.replace'
                  : 'write.agent.dynamic.publish',
              )}
      </Button>
    </div>
  )

  return (
    <>
      <div className={lobeStyles.u86fb216c}>
        <div className={lobeStyles.ufa2251b6}>{draft.name}</div>
        <p className={lobeStyles.u846e6b39}>
          {t(
            draft.target
              ? 'write.agent.dynamic.versionHint'
              : 'write.agent.dynamic.hint',
          )}
        </p>
        {actions}
        {error ? (
          <p role="alert" className={lobeStyles.u1cb24f07}>
            {error}
          </p>
        ) : null}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className={lobeStyles.uf8d0139d}
      >
        <ModalHeader title={draft.name} />
        <div className={lobeStyles.u4074ef4d}>
          {open ? <ComponentPreview draft={draft} /> : null}
          <details className={lobeStyles.u846e6b39}>
            <summary className={lobeStyles.u34516836}>
              {t('write.agent.dynamic.source')}
            </summary>
            <pre className={lobeStyles.u29562ef2}>{draft.source}</pre>
          </details>
          {actions}
          {error ? (
            <p role="alert" className={lobeStyles.u611864a2}>
              {error}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
