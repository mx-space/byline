import { createStaticStyles } from '@lobehub/ui'
import { ExternalLink, MoreHorizontal, Pencil } from 'lucide-react'
import type {
  ComponentPropsWithoutRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  Ref,
} from 'react'
import { forwardRef } from 'react'
import { Link } from 'react-router'

import { useI18n } from '~/i18n'
import { ListRow } from '~/ui/list-actions'
import type { ContextMenuItem } from '~/ui/overlay/context-menu'
import { showContextMenu } from '~/ui/overlay/context-menu'
import { Badge } from '~/ui/primitives/badge'
import { Checkbox } from '~/ui/primitives/checkbox'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u59bc5be0: css`
    display: grid;
    cursor: default;
    column-gap: 0.75rem;
    row-gap: 0.375rem;
    padding-inline: 1rem;
    padding-block: 0.75rem;
  `,
  u8ea3a009: css`
    grid-template-columns: auto_minmax(0, 1fr) _auto;
  `,
  uf6f6d872: css`
    grid-template-columns: minmax(0, 1fr) _auto;
  `,
  u3382d9c2: css`
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
  u3d5a075f: css`
    &[data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &[data-popup-open] {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 60%,
        transparent
      );
    }
  `,
  u39e4b886: css`
    &[data-selected] {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &[data-selected] {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 60%,
        transparent
      );
    }
  `,
  ud9157ce1: css`
    &[data-selected]:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorFillSecondary} 60%,
        transparent
      );
    }
    :where(.dark, .dark *) &[data-selected]:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 80%,
        transparent
      );
    }
  `,
  u7bb7c7d8: css`
    &[data-selected][data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &[data-selected][data-popup-open] {
      background-color: ${cssVar.colorText};
    }
  `,
  u62e55649: css`
    &:focus-visible {
      outline-width: 2px;
    }
    &:focus-visible {
      outline-offset: -2px;
    }
    &:focus-visible {
      outline-color: ${cssVar.colorTextSecondary};
    }
    :where(.dark, .dark *) &:focus-visible {
      outline-color: ${cssVar.colorTextSecondary};
    }
  `,
  u15e1b1f4: css`
    margin-top: 0.125rem;
  `,
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  u6a00a25d: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
  `,
  u4763858a: css`
    outline: none;
    min-width: 0px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
    &:hover {
      color: ${cssVar.colorTextSecondary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 2px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 var(--color-primary-shallow) ${cssVar.colorPrimary};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u768a49f3: css`
    margin-top: 0.25rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.75rem;
    row-gap: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u0e6f3366: css`
    grid-row-start: 1;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    align-self: flex-start;
  `,
  u8044fff5: css`
    grid-column-start: 2;
  `,
  u21cd6452: css`
    display: flex;
    align-items: center;
    gap: 0.125rem;
    color: ${cssVar.colorFillSecondary};
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u4de3fad5: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
    font-variant-numeric: tabular-nums;
  `,
  u45c6a1de: css`
    outline: none;
    display: inline-flex;
    height: 1.75rem;
    width: 1.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    color: currentColor;
    text-decoration: none;
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
    :where(.dark, .dark *) &:hover {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u1e9dbf1b: css`
    .group:hover & {
      color: ${cssVar.colorTextSecondary};
    }
    .group[data-selected] & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  uc4c02d26: css`
    :where(.dark, .dark *) & {
      color: ${cssVar.colorText};
    }
    .group:hover :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
    .group[data-selected] :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
}))

export type ContentEntrySelectMode = 'single' | 'toggle' | 'range'

export interface ContentEntryListItemProps {
  checkboxLabel?: string
  className?: string
  cursor?: boolean
  /** Stable id of the underlying entity. */
  dataId?: string
  editTitle: string
  editTo: string
  externalHref: string
  /** Visual leading slot rendered inline with the title (icon, pin, etc.). */
  leading?: ReactNode
  menuItems: ContextMenuItem[] | (() => ContextMenuItem[])
  meta?: ReactNode
  onSelect?: (mode: ContentEntrySelectMode) => void
  onSelectedChange?: (checked: boolean) => void
  openTitle: string
  selected?: boolean
  status?: ReactNode
  title: ReactNode
  titleTo: string
  /**
   * Slot rendered under the action icons on the right rail (e.g. relative time).
   * Keeps the right column visually aligned as a single vertical axis.
   */
  trailingFooter?: ReactNode
}

/**
 * Two-line list item shared by `/posts` and `/notes`.
 *
 *   ☐  [leading]  Title text                 [status]   ✎  ↗  ⋯
 *       category · tags · 👁 N · ♡ N                       relative time
 *
 * Delegates row keyboard/selection/context-menu plumbing to `ListRow`. Owns the
 * checkbox column + title link + status badge + meta line + edit/external/more
 * action button trio.
 *
 * Note: `props.leading` is the *visual* leading slot rendered next to the title
 * (e.g. a pin icon). It is distinct from `ListRow.leading`, which holds the
 * selection-column checkbox.
 */
export function ContentEntryListItem(props: ContentEntryListItemProps) {
  const { t } = useI18n()
  const selectable = Boolean(props.checkboxLabel && props.onSelectedChange)
  const handleSelectedChange = props.onSelectedChange ?? (() => {})

  const onMoreClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const resolved =
      typeof props.menuItems === 'function'
        ? props.menuItems()
        : props.menuItems
    showContextMenu(resolved)
  }

  return (
    <ListRow
      as="article"
      className={cn(
        `${lobeStyles.u59bc5be0} group`,
        selectable ? lobeStyles.u8ea3a009 : lobeStyles.uf6f6d872,
        lobeStyles.u3382d9c2,
        lobeStyles.u3d5a075f,
        lobeStyles.u39e4b886,
        lobeStyles.ud9157ce1,
        lobeStyles.u7bb7c7d8,
        lobeStyles.u62e55649,
        props.className,
      )}
      cursor={props.cursor}
      dataId={props.dataId ?? ''}
      leading={
        selectable ? (
          <Checkbox
            aria-label={props.checkboxLabel}
            checked={props.selected ?? false}
            className={lobeStyles.u15e1b1f4}
            cursor={props.cursor}
            onCheckedChange={handleSelectedChange}
          />
        ) : null
      }
      menuItems={props.menuItems}
      onSelect={props.onSelect}
      selected={props.selected}
    >
      <div className={lobeStyles.u7e0b7cdf}>
        <div className={lobeStyles.u6a00a25d}>
          {props.leading}
          <Link className={lobeStyles.u4763858a} to={props.titleTo}>
            {props.title}
          </Link>
          {props.status}
        </div>
        {props.meta ? (
          <div className={lobeStyles.u768a49f3}>{props.meta}</div>
        ) : null}
      </div>

      <div
        className={cn(
          lobeStyles.u0e6f3366,
          selectable ? 'col-start-3' : lobeStyles.u8044fff5,
        )}
      >
        <div
          className={cn(
            lobeStyles.u21cd6452,
            `${lobeStyles.u1e9dbf1b} group-data-[popup-open]:text-neutral-600`,
            `${lobeStyles.uc4c02d26} dark:group-data-[popup-open]:text-neutral-300`,
          )}
        >
          <ActionLink title={props.editTitle} to={props.editTo}>
            <Pencil aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </ActionLink>
          <ActionLink
            href={props.externalHref}
            rel="noreferrer"
            target="_blank"
            title={props.openTitle}
          >
            <ExternalLink aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </ActionLink>
          <ActionButton
            onClick={onMoreClick}
            title={t('shared.contentListItem.moreActions')}
          >
            <MoreHorizontal
              aria-hidden="true"
              className={lobeStyles.uf7b5fa97}
            />
          </ActionButton>
        </div>
        {props.trailingFooter ? (
          <div className={lobeStyles.u4de3fad5}>{props.trailingFooter}</div>
        ) : null}
      </div>
    </ListRow>
  )
}

const actionSlotClassName = lobeStyles.u45c6a1de

type ActionLinkProps =
  | ({ href: string; to?: never } & Omit<
      ComponentPropsWithoutRef<'a'>,
      'className'
    >)
  | ({ href?: never; to: string } & Omit<
      ComponentPropsWithoutRef<typeof Link>,
      'className' | 'to'
    >)

function ActionLink(
  props: ActionLinkProps & { children: ReactNode; title: string },
) {
  const { children, title } = props
  if ('to' in props && props.to) {
    return (
      <Link
        aria-label={title}
        className={actionSlotClassName}
        onClick={(event) => event.stopPropagation()}
        title={title}
        to={props.to}
      >
        {children}
      </Link>
    )
  }
  const {
    children: _c,
    title: _t,
    to: _to,
    ...rest
  } = props as {
    children: ReactNode
    title: string
    to?: undefined
  } & ComponentPropsWithoutRef<'a'>
  return (
    <a
      aria-label={title}
      className={actionSlotClassName}
      onClick={(event) => event.stopPropagation()}
      title={title}
      {...rest}
    >
      {children}
    </a>
  )
}

interface ActionButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'className'
> {
  title: string
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton(
    { children, title, ...rest },
    ref: Ref<HTMLButtonElement>,
  ) {
    return (
      <button
        aria-label={title}
        className={actionSlotClassName}
        ref={ref}
        title={title}
        type="button"
        {...rest}
      >
        {children}
      </button>
    )
  },
)

export function ContentListStatusBadge(props: {
  active: boolean
  children: ReactNode
}) {
  return (
    <Badge size="sm" tone={props.active ? 'success' : 'neutral'} variant="soft">
      {props.children}
    </Badge>
  )
}
