import { createStaticStyles } from '@lobehub/ui'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import type { FormEventHandler, ReactNode } from 'react'

import { useI18n } from '~/i18n'
import { DropdownMenu } from '~/ui/overlay/dropdown-menu'
import { Checkbox } from '~/ui/primitives/checkbox'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u09bd60f1: css`
    display: flex;
    height: 2.5rem;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding-inline: 1rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  uf5b78765: css`
    position: relative;
    display: flex;
    height: 100%;
    min-width: 0px;
    flex: 1 1 0%;
    align-items: center;
    align-self: stretch;
  `,
  u2e005ac9: css`
    pointer-events: none;
    position: absolute;
    left: 0.5rem;
    top: 50%;
    width: 0.875rem;
    height: 0.875rem;
    translate: 0 -50%;
    color: ${cssVar.colorTextSecondary};
  `,
  uf615bb8e: css`
    outline: none;
    &:focus {
      outline: none;
    }
    height: 1.75rem;
    width: 100%;
    border-width: 0;
    background-color: transparent;
    padding-left: 2rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorText};
    &::placeholder {
      color: ${cssVar.colorTextSecondary};
    }
    &:focus {
      box-shadow: none;
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u24c1290b: css`
    padding-right: 1.5rem;
  `,
  u5431dbc4: css`
    padding-right: 0px;
  `,
  u26b8ef54: css`
    position: absolute;
    right: 0.75rem;
    top: 50%;
    display: inline-flex;
    width: 1rem;
    height: 1rem;
    translate: 0 -50%;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
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
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  u0a935cc3: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
  `,
  udaad07d1: css`
    height: 0.875rem;
    width: 1px;
    flex-shrink: 0;
    background-color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u76478a85: css`
    outline: none;
    display: inline-flex;
    height: 1.75rem;
    width: 1.75rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
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
    &:focus-visible {
      box-shadow: 0 0 0 2px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 var(--color-primary-shallow) ${cssVar.colorPrimary};
    }
    &:disabled {
      pointer-events: none;
    }
    &:disabled {
      opacity: 0.5;
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
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
  uafbdd13a: css`
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  u3c231d97: css`
    display: inline-flex;
    height: 1.75rem;
    flex-shrink: 0;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u53f0561d: css`
    display: inline-flex;
    height: 1.75rem;
    flex-shrink: 0;
    cursor: pointer;
    align-items: center;
    gap: 0.375rem;
    border-radius: 0.25rem;
    padding-right: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u3a9afc88: css`
    outline: none;
    display: inline-flex;
    height: 1.75rem;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorErrorBg};
    background-color: color-mix(
      in srgb,
      ${cssVar.colorErrorBg} 60%,
      transparent
    );
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorError};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorErrorBg};
    }
    &:focus-visible {
      box-shadow: 0 0 0 2px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 var(--color-primary-shallow) ${cssVar.colorPrimary};
    }
    &:disabled {
      pointer-events: none;
    }
    &:disabled {
      opacity: 0.5;
    }
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 30%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 50%,
        transparent
      );
    }
  `,
  u85d05420: css`
    display: inline-flex;
    height: 1.75rem;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
    border-radius: 8px;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
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
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
    &:disabled {
      cursor: not-allowed;
    }
    &:disabled {
      opacity: 0.6;
    }
    &[data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  u9265a502: css`
    width: 0.875rem;
    height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  uf283ea9b: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  ue47b6740: css`
    width: 0.75rem;
    height: 0.75rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u74b2435a: css`
    width: 12rem;
  `,
  u61324a98: css`
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  ud40b0a80: css`
    color: ${cssVar.colorTextSecondary};
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  ua82a1496: css`
    color: ${cssVar.colorPrimary};
  `,
  u83813220: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.25rem;
    padding: 0.25rem;
  `,
  uedba4dc5: css`
    display: inline-flex;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    font-size: 0.625rem;
    line-height: 0.875rem;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  `,
  u79b58e1f: css`
    border-color: ${cssVar.colorText};
    background-color: ${cssVar.colorText};
    color: ${cssVar.colorBgLayout};
  `,
  uebb8f33e: css`
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    color: ${cssVar.colorTextSecondary};
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
}))

interface ContentListToolbarSelection {
  allVisibleSelected: boolean
  bulkActionDisabled?: boolean
  bulkActionIcon?: ReactNode
  bulkActionLabel: string
  hasVisibleItems: boolean
  indeterminate: boolean
  onBulkAction: () => void
  onToggleAllVisible: (checked: boolean) => void
  selectAllLabel: string
  selectedCount: number
  selectedLabel: string
}

interface ContentListToolbarProps {
  className?: string
  extraActions?: ReactNode
  filters?: ReactNode
  hasSearch: boolean
  onClearSearch: () => void
  onSearch: FormEventHandler<HTMLFormElement>
  onSearchValueChange: (value: string) => void
  searchPlaceholder: string
  searchValue: string
  selection?: ContentListToolbarSelection
  sortMenu?: ReactNode
}

export function ContentListToolbar(props: ContentListToolbarProps) {
  const { t } = useI18n()
  const selection = props.selection
  const selectedCount = selection?.selectedCount ?? 0
  const hasSelection = selectedCount > 0

  return (
    <div className={cn(lobeStyles.u09bd60f1, props.className)}>
      {selection ? (
        <ContentListToolbarSelectionControls
          hasSelection={hasSelection}
          selection={selection}
        />
      ) : null}

      <form className={lobeStyles.uf5b78765} onSubmit={props.onSearch}>
        <Search aria-hidden="true" className={lobeStyles.u2e005ac9} />
        <input
          className={cn(
            lobeStyles.uf615bb8e,
            props.hasSearch ? lobeStyles.u24c1290b : lobeStyles.u5431dbc4,
          )}
          onChange={(event) => props.onSearchValueChange(event.target.value)}
          placeholder={props.searchPlaceholder}
          type="text"
          value={props.searchValue}
        />
        {props.hasSearch ? (
          <button
            aria-label={t('shared.contentListToolbar.clearSearch')}
            className={lobeStyles.u26b8ef54}
            onClick={props.onClearSearch}
            type="button"
          >
            <X aria-hidden="true" className={lobeStyles.uef2d6f74} />
          </button>
        ) : null}
      </form>

      {props.filters ? (
        <div className={lobeStyles.u0a935cc3}>{props.filters}</div>
      ) : null}

      {props.sortMenu}

      {props.extraActions ? (
        <>
          <span aria-hidden="true" className={lobeStyles.udaad07d1} />
          <div className={lobeStyles.u0a935cc3}>{props.extraActions}</div>
        </>
      ) : null}
    </div>
  )
}

export function ContentListRefreshButton(props: {
  isFetching: boolean
  label: string
  onRefresh: () => void
}) {
  return (
    <button
      aria-label={props.label}
      className={lobeStyles.u76478a85}
      disabled={props.isFetching}
      onClick={props.onRefresh}
      type="button"
    >
      <RefreshCw
        aria-hidden="true"
        className={cn(
          lobeStyles.u783b0d9d,
          props.isFetching && lobeStyles.uafbdd13a,
        )}
      />
    </button>
  )
}

function ContentListToolbarSelectionControls(props: {
  hasSelection: boolean
  selection: ContentListToolbarSelection
}) {
  const { hasSelection, selection } = props

  if (!hasSelection) {
    if (!selection.hasVisibleItems) return null
    return (
      <label
        aria-label={selection.selectAllLabel}
        className={lobeStyles.u3c231d97}
        title={selection.selectAllLabel}
      >
        <Checkbox
          aria-label={selection.selectAllLabel}
          checked={selection.allVisibleSelected}
          indeterminate={selection.indeterminate}
          onCheckedChange={selection.onToggleAllVisible}
        />
      </label>
    )
  }

  return (
    <>
      <label className={lobeStyles.u53f0561d}>
        <Checkbox
          aria-label={selection.selectAllLabel}
          checked={selection.allVisibleSelected}
          indeterminate={selection.indeterminate}
          onCheckedChange={selection.onToggleAllVisible}
        />
        <span>{selection.selectedLabel}</span>
      </label>
      <button
        className={lobeStyles.u3a9afc88}
        disabled={selection.bulkActionDisabled}
        onClick={selection.onBulkAction}
        type="button"
      >
        {selection.bulkActionIcon}
        <span>{selection.bulkActionLabel}</span>
      </button>
    </>
  )
}

interface SortMenuProps<TField extends string = string> {
  className?: string
  disabled?: boolean
  field: TField
  options: ReadonlyArray<{ label: ReactNode; value: TField }>
  order: 'asc' | 'desc'
  onChange: (next: { field: TField; order: 'asc' | 'desc' }) => void
}

export function SortMenu<TField extends string = string>(
  props: SortMenuProps<TField>,
) {
  const { t } = useI18n()
  const activeOption = props.options.find(
    (option) => option.value === props.field,
  )
  const OrderIcon = props.order === 'asc' ? ArrowUp : ArrowDown

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        aria-label={t('shared.sortMenu.label')}
        className={cn(lobeStyles.u85d05420, props.className)}
        disabled={props.disabled}
        type="button"
      >
        <ArrowUpDown aria-hidden="true" className={lobeStyles.u9265a502} />
        <span className={lobeStyles.uf283ea9b}>
          {activeOption?.label ?? t('shared.sortMenu.label')}
        </span>
        <OrderIcon aria-hidden="true" className={lobeStyles.ue47b6740} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className={lobeStyles.u74b2435a}>
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>
            {t('shared.sortMenu.field')}
          </DropdownMenu.GroupLabel>
          {props.options.map((option) => {
            const active = option.value === props.field
            return (
              <DropdownMenu.Item
                className={cn(
                  active ? lobeStyles.u61324a98 : lobeStyles.ud40b0a80,
                )}
                key={String(option.value)}
                onClick={() =>
                  props.onChange({ field: option.value, order: props.order })
                }
              >
                <span className={lobeStyles.u67bab313}>{option.label}</span>
                {active ? (
                  <span className={lobeStyles.ua82a1496} aria-hidden="true">
                    ●
                  </span>
                ) : null}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.GroupLabel>
            {t('shared.sortMenu.direction')}
          </DropdownMenu.GroupLabel>
          <div className={lobeStyles.u83813220}>
            <SortOrderButton
              active={props.order === 'desc'}
              icon={
                <ArrowDown
                  aria-hidden="true"
                  className={lobeStyles.u783b0d9d}
                />
              }
              label={t('shared.sortMenu.desc')}
              onClick={() =>
                props.onChange({ field: props.field, order: 'desc' })
              }
            />
            <SortOrderButton
              active={props.order === 'asc'}
              icon={
                <ArrowUp aria-hidden="true" className={lobeStyles.u783b0d9d} />
              }
              label={t('shared.sortMenu.asc')}
              onClick={() =>
                props.onChange({ field: props.field, order: 'asc' })
              }
            />
          </div>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

function SortOrderButton(props: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        lobeStyles.uedba4dc5,
        props.active ? lobeStyles.u79b58e1f : lobeStyles.uebb8f33e,
      )}
      onClick={props.onClick}
      type="button"
    >
      {props.icon}
      <span>{props.label}</span>
    </button>
  )
}
