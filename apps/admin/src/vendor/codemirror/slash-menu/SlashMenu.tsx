import './slash-menu.css'

import type { EditorView } from '@codemirror/view'
import { createStaticStyles } from '@lobehub/ui'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useSlashMenu } from './use-slash-menu'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ubd0e2e8d: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  uae3391d7: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u0a1f78ef: css`
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.375rem;
    padding-block: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  uc55a4f4a: css`
    flex: 1 1 0%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.375rem;
  `,
  u3e226819: css`
    padding-inline: 0.75rem;
    padding-block: 1.5rem;
    text-align: center;
  `,
  ua286c61d: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u8300b8f3: css`
    margin-top: 0.5rem;
    border-top-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding-top: 0.5rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  uabd5097f: css`
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  ue49ba568: css`
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  `,
  u75a3025c: css`
    background-color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u90173f99: css`
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 50%,
        transparent
      );
    }
  `,
  u60edb220: css`
    background-color: ${cssVar.colorBgContainer};
    box-shadow: ${cssVar.boxShadowTertiary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u88d9a590: css`
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u3b4c716c: css`
    min-width: 0px;
    flex: 1 1 0%;
  `,
  uf7a5d452: css`
    color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u6214eeac: css`
    color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u79b45350: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  uc23f5895: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border-top-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
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
  u41681120: css`
    display: flex;
    align-items: center;
    gap: 0.25rem;
  `,
  uef4b044f: css`
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.25rem;
    padding-block: 0.125rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u40518b16: css`
    position: fixed;
    z-index: 70;
    display: flex;
    max-height: 380px;
    min-width: 260px;
    max-width: 320px;
    flex-direction: column;
    overflow: hidden;
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
  u68ce3709: css`
    position: absolute;
    left: 0px;
    top: 50%;
    height: 1.25rem;
    width: 0.125rem;
    translate: 0 -50%;
    border-radius: 999px;
  `,
}))

interface SlashMenuProps {
  editorView: EditorView | undefined
}

export function SlashMenu({ editorView }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const {
    isOpen,
    position,
    query,
    groupedItems,
    flatItems,
    activeIndex,
    isKeyboardNav,
    setActiveIndex,
    setIsKeyboardNav,
    executeItem,
    closeMenu,
  } = useSlashMenu(editorView)

  useEffect(() => {
    const handler = (event: PointerEvent) => {
      if (!isOpen) return
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target)) return
      closeMenu()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [isOpen, closeMenu])

  useLayoutEffect(() => {
    if (!isOpen || flatItems.length === 0) return
    const activeItem = flatItems[activeIndex]
    if (!activeItem) return
    const el = itemRefs.current.get(activeItem.id)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex, isOpen, flatItems])

  if (!isOpen || !position) return null
  if (typeof document === 'undefined') return null

  const overlay = (
    <div
      ref={menuRef}
      className={`${lobeStyles.u40518b16} slash-menu`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={() => {
        if (isKeyboardNav) setIsKeyboardNav(false)
      }}
    >
      <div className={lobeStyles.ubd0e2e8d}>
        <span className={lobeStyles.uae3391d7}>命令</span>
        {query && <span className={lobeStyles.u0a1f78ef}>/{query}</span>}
      </div>

      <div className={lobeStyles.uc55a4f4a}>
        {flatItems.length === 0 && (
          <div className={lobeStyles.u3e226819}>
            <span className={lobeStyles.ua286c61d}>未找到匹配命令</span>
          </div>
        )}

        {groupedItems.map((group, groupIndex) => (
          <div
            key={group.id}
            className={groupIndex > 0 ? lobeStyles.u8300b8f3 : ''}
          >
            <div className={lobeStyles.uabd5097f}>{group.label}</div>
            <div className={lobeStyles.ue49ba568}>
              {group.items.map((item) => {
                const index = flatItems.findIndex((e) => e.id === item.id)
                const isActive = index === activeIndex
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el)
                    }}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => {
                      if (isKeyboardNav) return
                      if (index >= 0) setActiveIndex(index)
                    }}
                    className={`slash-menu-item relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-100 ${
                      isActive ? lobeStyles.u75a3025c : lobeStyles.u90173f99
                    }`}
                  >
                    {isActive && (
                      <div className={`${lobeStyles.u68ce3709} bg-primary`} />
                    )}
                    <div
                      className={`flex size-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        isActive ? lobeStyles.u60edb220 : lobeStyles.u75a3025c
                      }`}
                    >
                      {Icon && (
                        <Icon
                          width={16}
                          height={16}
                          strokeWidth={2}
                          className={
                            isActive ? 'text-primary' : lobeStyles.u88d9a590
                          }
                        />
                      )}
                    </div>
                    <div className={lobeStyles.u3b4c716c}>
                      <div
                        className={`truncate text-sm font-medium ${
                          isActive ? lobeStyles.uf7a5d452 : lobeStyles.u6214eeac
                        }`}
                      >
                        {item.label}
                      </div>
                      {item.description && (
                        <div className={lobeStyles.u79b45350}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={lobeStyles.uc23f5895}>
        <span className={lobeStyles.u41681120}>
          <kbd className={lobeStyles.uef4b044f}>↑↓</kbd>
          <span>导航</span>
        </span>
        <span className={lobeStyles.u41681120}>
          <kbd className={lobeStyles.uef4b044f}>↵</kbd>
          <span>选择</span>
        </span>
        <span className={lobeStyles.u41681120}>
          <kbd className={lobeStyles.uef4b044f}>Esc</kbd>
          <span>关闭</span>
        </span>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
