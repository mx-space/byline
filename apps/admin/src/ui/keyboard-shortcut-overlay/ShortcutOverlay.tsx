import { createStaticStyles } from '@lobehub/ui'
import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '~/utils/cn'

import type { ShortcutItem } from './KeyboardShortcutsProvider'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ub05aca15: css`
    position: fixed;
    inset: 0px;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  u744a16a1: css`
    position: relative;
    display: flex;
    max-height: 80svh;
    width: min(640px, calc(100vw-32px));
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    background-color: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadow};
  `,
  u820c037d: css`
    display: flex;
    height: 3.5rem;
    align-items: center;
    justify-content: space-between;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 1.5rem;
  `,
  ue26830a9: css`
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  u6086d88c: css`
    margin-right: calc(0.625rem * -1);
    display: inline-flex;
    width: 2.25rem;
    height: 2.25rem;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: ${cssVar.colorTextTertiary};
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
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u43ad983a: css`
    flex: 1 1 0%;
    overflow-y: auto;
    padding-inline: 1.5rem;
    padding-block: 1rem;
  `,
  u3411d7b6: css`
    padding-block: 1.5rem;
    text-align: center;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ub3542e05: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1.5rem;
    }
  `,
  u22955275: css`
    margin-bottom: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: ${cssVar.colorTextTertiary};
  `,
  u5a250822: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.375rem;
    }
  `,
  u15e356a1: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
  `,
  uc55d4b8a: css`
    min-width: 0px;
    color: ${cssVar.colorText};
  `,
  uc32f78b8: css`
    margin-left: auto;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.5rem;
    padding-block: 0.125rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u0a5e664a: css`
    position: absolute;
    inset: 0px;
    cursor: default;
    background-color: color-mix(in srgb, ${cssVar.colorText} 35%, transparent);
  `,
}))

interface RegistryEntry {
  id: number
  items: ReadonlyArray<ShortcutItem>
}

export interface ShortcutOverlayProps {
  open: boolean
  entries: ReadonlyArray<RegistryEntry>
  onClose: () => void
}

interface GroupedShortcuts {
  group: string
  items: ShortcutItem[]
}

function flattenEntries(
  entries: ReadonlyArray<RegistryEntry>,
): GroupedShortcuts[] {
  const order: string[] = []
  const map = new Map<string, ShortcutItem[]>()
  const seenKeys = new Set<string>()
  for (const entry of entries) {
    for (const item of entry.items) {
      if (seenKeys.has(item.key)) continue
      seenKeys.add(item.key)
      const list = map.get(item.group)
      if (list) {
        list.push(item)
      } else {
        order.push(item.group)
        map.set(item.group, [item])
      }
    }
  }
  return order.map((group) => ({ group, items: map.get(group) ?? [] }))
}

/**
 * Comments-agnostic overlay — knows only the {group, key, label, hint}
 * registry shape. Esc closes; the backdrop click closes; the X button
 * closes. Tokens come from DS v2 (`bg-surface-overlay`, `rounded-xl`,
 * `shadow-lg`).
 */
export function ShortcutOverlay(props: ShortcutOverlayProps) {
  const { open, entries, onClose } = props

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const groups = useMemo(() => flattenEntries(entries), [entries])

  if (typeof document === 'undefined') return null
  if (!open) return null

  return createPortal(
    <div
      aria-hidden={!open}
      className={lobeStyles.ub05aca15}
      data-testid="shortcut-overlay-root"
    >
      <button
        aria-label="Close shortcuts overlay"
        className={lobeStyles.u0a5e664a}
        data-testid="shortcut-overlay-backdrop"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="shortcut-overlay-title"
        aria-modal="true"
        className={cn(lobeStyles.u744a16a1)}
        data-testid="shortcut-overlay-card"
        role="dialog"
      >
        <div className={lobeStyles.u820c037d}>
          <h2 className={lobeStyles.ue26830a9} id="shortcut-overlay-title">
            Keyboard shortcuts
          </h2>
          <button
            aria-label="Close"
            className={lobeStyles.u6086d88c}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </button>
        </div>
        <div className={lobeStyles.u43ad983a}>
          {groups.length === 0 ? (
            <p className={lobeStyles.u3411d7b6}>
              No shortcuts registered for the current view.
            </p>
          ) : (
            <div className={lobeStyles.ub3542e05}>
              {groups.map(({ group, items }) => (
                <section key={group}>
                  <h3 className={lobeStyles.u22955275}>{group}</h3>
                  <ul className={lobeStyles.u5a250822}>
                    {items.map((item) => (
                      <li className={lobeStyles.u15e356a1} key={item.key}>
                        <span className={lobeStyles.uc55d4b8a}>
                          {item.hint ?? item.label}
                        </span>
                        <kbd className={lobeStyles.uc32f78b8}>{item.label}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
