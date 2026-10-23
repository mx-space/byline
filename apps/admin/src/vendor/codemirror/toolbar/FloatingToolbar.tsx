import './floating-toolbar.css'

import type { EditorView } from '@codemirror/view'
import { createStaticStyles } from '@lobehub/ui'
import { Bold, Code, Italic, Link, Strikethrough } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { commands, isInlineFormatActive } from './markdown-commands'
import type { SelectionPosition } from './use-selection-position'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u90665ca6: css`
    font-style: italic;
  `,
  u5a78077d: css`
    display: flex;
    align-items: center;
  `,
  udaae1307: css`
    margin-inline: 0.25rem;
    height: 1.25rem;
    width: 1px;
    background-color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u02034fc7: css`
    display: flex;
    align-items: center;
    gap: 0.125rem;
  `,
  u0254c924: css`
    background-color: ${cssVar.colorInfoBg};
    color: ${cssVar.colorInfo};
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorInfo} 40%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorInfoBg};
    }
  `,
  u41dbc9b8: css`
    pointer-events: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-bottom: 0.5rem;
    translate: -50%;
    scale: 0.95;
    white-space: nowrap;
    border-radius: 12px;
    background-color: ${cssVar.colorText};
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextLightSolid};
    opacity: 0;
    box-shadow: ${cssVar.boxShadow};
    transition: all 0.15s ease;
    transition-duration: 150ms;
    .group:hover & {
      scale: 1;
    }
    .group:hover & {
      opacity: 1;
    }
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorText};
    }
  `,
  u6cfc7e6a: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  u8dab09a2: css`
    border-radius: 0.25rem;
    background-color: ${cssVar.colorText};
    padding-inline: 0.25rem;
    padding-block: 0.125rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  uddaccb92: css`
    position: absolute;
    left: 50%;
    top: 100%;
    translate: -50%;
    border-width: 1rem;
    border-color: transparent;
    border-top-color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      border-top-color: ${cssVar.colorFillSecondary};
    }
  `,
  u039e03a8: css`
    position: fixed;
    z-index: 50;
    display: flex;
    align-items: center;
    border-radius: 14px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(
      in srgb,
      ${cssVar.colorFillSecondary} 60%,
      transparent
    );
    background-color: color-mix(
      in srgb,
      ${cssVar.colorBgContainer} 95%,
      transparent
    );
    padding: 0.25rem;
    box-shadow: ${cssVar.boxShadow};
    box-shadow: 0 10px 15px -3px
      color-mix(in srgb, ${cssVar.colorText} 10%, transparent);
    backdrop-filter: blur(24px);
    backdrop-filter: saturate(1.5);
    :where(.dark, .dark *) & {
      border-color: color-mix(in srgb, ${cssVar.colorText} 60%, transparent);
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 95%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      box-shadow: 0 10px 15px -3px
        color-mix(in srgb, ${cssVar.colorText} 50%, transparent);
    }
  `,
}))

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

interface ToolbarButton {
  icon: IconComponent
  title: string
  shortcut: string
  action: (view: EditorView) => void
  isActive?: (view: EditorView) => boolean
}

interface ToolbarGroup {
  id: string
  buttons: ToolbarButton[]
}

const groups: ToolbarGroup[] = [
  {
    id: 'format',
    buttons: [
      {
        icon: Bold,
        title: '粗体',
        shortcut: '⌘B',
        action: commands.bold,
        isActive: (view) => isInlineFormatActive(view, 'bold'),
      },
      {
        icon: Italic,
        title: '斜体',
        shortcut: '⌘I',
        action: commands.italic,
        isActive: (view) => isInlineFormatActive(view, 'italic'),
      },
      {
        icon: Strikethrough,
        title: '删除线',
        shortcut: '⌘D',
        action: commands.strikethrough,
        isActive: (view) => isInlineFormatActive(view, 'strikethrough'),
      },
    ],
  },
  {
    id: 'insert',
    buttons: [
      {
        icon: Link,
        title: '链接',
        shortcut: '⌘K',
        action: commands.link,
      },
      {
        icon: Code,
        title: '代码',
        shortcut: '⌘E',
        action: commands.inlineCode,
        isActive: (view) => isInlineFormatActive(view, 'inlineCode'),
      },
    ],
  },
]

interface FloatingToolbarProps {
  editorView: EditorView | undefined
  visible: boolean
  position: SelectionPosition | null
}

export function FloatingToolbar({
  editorView,
  visible,
  position,
}: FloatingToolbarProps) {
  const [selectionVersion, setSelectionVersion] = useState(0)

  useEffect(() => {
    if (!editorView) return
    const bump = () => setSelectionVersion((v) => v + 1)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === 'Shift' ||
        e.key.startsWith('Arrow') ||
        e.ctrlKey ||
        e.metaKey
      ) {
        bump()
      }
    }
    editorView.dom.addEventListener('mouseup', bump)
    editorView.dom.addEventListener('mousedown', bump)
    editorView.dom.addEventListener('keyup', handleKeyUp)
    return () => {
      editorView.dom.removeEventListener('mouseup', bump)
      editorView.dom.removeEventListener('mousedown', bump)
      editorView.dom.removeEventListener('keyup', handleKeyUp)
    }
  }, [editorView])

  if (!visible || !position) return null
  if (typeof document === 'undefined') return null

  const executeCommand = (action: (view: EditorView) => void) => {
    if (!editorView) return
    action(editorView)
    editorView.focus()
    setSelectionVersion((v) => v + 1)
  }

  const overlay = (
    <div
      className={`${lobeStyles.u039e03a8} floating-toolbar`}
      style={{
        left: `${position.x}px`,
        top: position.above ? `${position.y - 52}px` : `${position.y + 8}px`,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.preventDefault()}
      data-selection-version={selectionVersion}
    >
      {groups.map((group, groupIndex) => (
        <div key={group.id} className={lobeStyles.u5a78077d}>
          {groupIndex > 0 && <div className={lobeStyles.udaae1307} />}
          <div className={lobeStyles.u02034fc7}>
            {group.buttons.map((button) => {
              const Icon = button.icon
              const active =
                editorView && button.isActive
                  ? button.isActive(editorView)
                  : false
              return (
                <button
                  key={button.title}
                  type="button"
                  aria-label={button.title}
                  onClick={() => executeCommand(button.action)}
                  className={`group relative flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-all duration-150 hover:bg-neutral-100 hover:text-neutral-900 active:scale-95 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${
                    active ? lobeStyles.u0254c924 : ''
                  }`}
                >
                  <Icon width={16} height={16} strokeWidth={2} />
                  <div className={lobeStyles.u41dbc9b8}>
                    <div className={lobeStyles.u6cfc7e6a}>
                      <span>{button.title}</span>
                      <kbd className={lobeStyles.u8dab09a2}>
                        {button.shortcut}
                      </kbd>
                    </div>
                    <div className={lobeStyles.uddaccb92} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return createPortal(overlay, document.body)
}
