import { createStaticStyles } from '@lobehub/ui'
import type { OnMount } from '@monaco-editor/react'
import Editor, { loader } from '@monaco-editor/react'
import { AlertCircle, CheckCircle2, Code2, Loader2, Save } from 'lucide-react'
import * as monaco from 'monaco-editor'
import { useEffect, useMemo, useRef } from 'react'

import { useI18n } from '~/i18n'
import { useThemeMode } from '~/theme'
import { cn } from '~/utils/cn'

import {
  ensureGithubThemesRegistered,
  GITHUB_DARK_THEME,
  GITHUB_LIGHT_THEME,
} from './code-editor-themes'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u96bb274c: css`
    display: flex;
    height: 2.5rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding-inline: 1rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u6a00a25d: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
  `,
  ub481f7c2: css`
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  `,
  uee2f1989: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    text-transform: uppercase;
  `,
  u17aabf0d: css`
    display: none;
    color: ${cssVar.colorTextSecondary};
    @media (min-width: 640px) {
      display: inline;
    }
  `,
  u09b2adf1: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.75rem;
  `,
  ue6a1f84f: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  `,
  u65ba79c0: css`
    width: 0.75rem;
    height: 0.75rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  uc90ada8d: css`
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
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
    :where(.dark, .dark *) &:hover {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  u2b5fa9a9: css`
    min-height: 0px;
    flex: 1 1 0%;
  `,
  ub2734cee: css`
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u4fabfdf6: css`
    display: flex;
    height: 100%;
    min-height: 0px;
    flex-direction: column;
    background-color: ${cssVar.colorBgContainer};
    color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
}))

loader.config({ monaco })

export interface CodeEditorProps {
  className?: string
  dirty?: boolean
  language: string
  onChange: (value: string) => void
  onSave?: () => void
  saving?: boolean
  title?: string
  value: string
}

export function CodeEditor({
  className,
  dirty,
  language,
  onChange,
  onSave,
  saving,
  title,
  value,
}: CodeEditorProps) {
  const { t } = useI18n()
  const { isDark } = useThemeMode()
  const lineCount = useMemo(
    () => (value ? value.split('\n').length : 1),
    [value],
  )

  useEffect(() => {
    ensureGithubThemesRegistered()
  }, [])

  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const resolvedTheme = isDark ? GITHUB_DARK_THEME : GITHUB_LIGHT_THEME

  const handleMount: OnMount = (editor, monacoInstance) => {
    if (!onSave) return

    // Monaco keeps the command registered at mount; route it through a ref so
    // it always reaches the current onSave instead of the first render's.
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      () => onSaveRef.current?.(),
    )
  }

  return (
    <div className={cn(lobeStyles.u4fabfdf6, className)}>
      <div className={lobeStyles.u96bb274c}>
        <div className={lobeStyles.u6a00a25d}>
          <Code2 aria-hidden="true" className={lobeStyles.ub481f7c2} />
          <span className={lobeStyles.uee2f1989}>{title ?? language}</span>
          {onSave ? (
            <span className={lobeStyles.u17aabf0d}>Cmd/Ctrl+S</span>
          ) : null}
        </div>
        <div className={lobeStyles.u09b2adf1}>
          <span>{lineCount} lines</span>
          {saving ? (
            <span className={lobeStyles.ue6a1f84f}>
              <Loader2 aria-hidden="true" className={lobeStyles.u65ba79c0} />
              Saving
            </span>
          ) : dirty === undefined ? null : dirty ? (
            <span className={lobeStyles.ue6a1f84f}>
              <AlertCircle
                aria-hidden="true"
                className={lobeStyles.uef2d6f74}
              />
              Modified
            </span>
          ) : (
            <span className={lobeStyles.ue6a1f84f}>
              <CheckCircle2
                aria-hidden="true"
                className={lobeStyles.uef2d6f74}
              />
              Saved
            </span>
          )}
          {onSave ? (
            <button
              aria-label={t('ui.codeEditor.saveAria')}
              className={lobeStyles.uc90ada8d}
              onClick={onSave}
              type="button"
            >
              <Save aria-hidden="true" className={lobeStyles.u783b0d9d} />
            </button>
          ) : null}
        </div>
      </div>
      <div className={lobeStyles.u2b5fa9a9}>
        <Editor
          height="100%"
          language={language}
          loading={
            <div className={lobeStyles.ub2734cee}>
              {t('ui.codeEditor.loadingMonaco')}
            </div>
          }
          onChange={(nextValue) => onChange(nextValue ?? '')}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            contextmenu: true,
            fontFamily:
              'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontSize: 12,
            lineHeight: 20,
            minimap: { enabled: false },
            padding: { bottom: 16, top: 16 },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
          }}
          theme={resolvedTheme}
          value={value}
        />
      </div>
    </div>
  )
}
