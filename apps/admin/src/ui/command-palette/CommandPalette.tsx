import './command-palette.css'

import { createStaticStyles } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { CornerDownLeft, Search } from 'lucide-react'
import { useRef } from 'react'

import { useI18n } from '~/i18n'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/ui/command'
import { Modal } from '~/ui/feedback/modal'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u2783e2cd: css`
    width: min(640px, calc(100vw-32px));
  `,
  ub301630e: css`
    display: flex;
    flex-direction: column;
  `,
  u89f3d22b: css`
    display: flex;
    height: 3rem;
    align-items: center;
    gap: 0.75rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 1rem;
  `,
  u145dbbb5: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: ${cssVar.colorTextTertiary};
  `,
  uc8bcf43b: css`
    flex: 1 1 0%;
    background-color: transparent;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
    outline: none;
    &::placeholder {
      color: ${cssVar.colorTextTertiary};
    }
  `,
  u4c688253: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.375rem;
    padding-block: 0.125rem;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u9ad0d6bb: css`
    max-height: 50svh;
    overflow-y: auto;
    padding-inline: 0.25rem;
    padding-block: 0.25rem;
  `,
  ud1b1422f: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding-inline: 1.5rem;
    padding-block: 2.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u5613661b: css`
    width: 2rem;
    height: 2rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u5a5a0788: css`
    display: flex;
    cursor: pointer;
    align-items: center;
    gap: 0.75rem;
    border-radius: 8px;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
    outline: none;
    &[data-selected='true'] {
      background-color: ${cssVar.colorPrimaryBg};
    }
  `,
  uee611559: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: ${cssVar.colorTextSecondary};
  `,
  u3feada8e: css`
    display: inline-block;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  u004494e1: css`
    display: flex;
    min-width: 0px;
    flex: 1 1 0%;
    flex-direction: column;
  `,
  u4a42a346: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${cssVar.colorText};
  `,
  u57d3c591: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uf2799e78: css`
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    color: ${cssVar.colorTextTertiary};
    opacity: 0;
    transition: opacity 0.15s ease;
  `,
}))

export interface CommandPaletteItem {
  id: string
  name: string
  subtitle?: string
  keywords?: string[]
  icon?: LucideIcon
  perform: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  items: ReadonlyArray<CommandPaletteItem>
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Modal
      className={lobeStyles.u2783e2cd}
      initialFocus={inputRef}
      onClose={onClose}
      open={open}
      popupStyle={{ top: '15vh', translate: '-50% 0' }}
    >
      <Command
        className={lobeStyles.ub301630e}
        label={t('commandPalette.title')}
        loop
      >
        <div className={lobeStyles.u89f3d22b}>
          <Search aria-hidden="true" className={lobeStyles.u145dbbb5} />
          <CommandInput
            className={lobeStyles.uc8bcf43b}
            placeholder={t('commandPalette.placeholder')}
            ref={inputRef}
          />
          <kbd aria-hidden="true" className={lobeStyles.u4c688253}>
            ESC
          </kbd>
        </div>
        <CommandList className={lobeStyles.u9ad0d6bb}>
          <CommandEmpty className={lobeStyles.ud1b1422f}>
            <Search
              aria-hidden="true"
              className={lobeStyles.u5613661b}
              strokeWidth={1.5}
            />
            <span>{t('commandPalette.empty')}</span>
          </CommandEmpty>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                className={lobeStyles.u5a5a0788}
                key={item.id}
                keywords={item.keywords}
                onSelect={() => {
                  item.perform()
                  onClose()
                }}
                value={`${item.name} ${item.subtitle ?? ''}`}
              >
                {Icon ? (
                  <Icon aria-hidden="true" className={lobeStyles.uee611559} />
                ) : (
                  <span aria-hidden className={lobeStyles.u3feada8e} />
                )}
                <div className={lobeStyles.u004494e1}>
                  <span className={lobeStyles.u4a42a346}>{item.name}</span>
                  {item.subtitle ? (
                    <span className={lobeStyles.u57d3c591}>
                      {item.subtitle}
                    </span>
                  ) : null}
                </div>
                <CornerDownLeft
                  aria-hidden="true"
                  className={lobeStyles.uf2799e78}
                  data-cmd-palette-enter-hint
                />
              </CommandItem>
            )
          })}
        </CommandList>
      </Command>
    </Modal>
  )
}
