import {
  ActionIcon,
  type ContextMenuItem,
  createStaticStyles,
  showContextMenu,
  Text,
  Tooltip,
} from '@lobehub/ui'
import { Copy } from 'lucide-react'

import type { FileItem } from '~/api/files'
import { useI18n } from '~/i18n'

import { useFileCopy } from '../copy'
import { formatUploadedAt } from '../utils/format'
import { FileThumb } from './FileThumb'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  card: css`
    cursor: pointer;

    position: relative;

    display: flex;
    flex-direction: column;
    gap: 8px;

    min-width: 0;
    padding: 8px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorBgContainer};

    transition:
      border-color 0.12s ease,
      background 0.12s ease;

    &:hover {
      background: ${cssVar.colorFillQuaternary};
    }

    &:hover [data-card-actions],
    &:focus-within [data-card-actions],
    &[data-cursor] [data-card-actions] {
      opacity: 1;
    }

    &[data-cursor] {
      border-color: ${cssVar.colorBorder};
    }

    &[aria-current='true'] {
      border-color: ${cssVar.colorPrimary};
      background: ${cssVar.colorPrimaryBg};
    }

    &:focus-visible {
      outline: 2px solid ${cssVar.colorPrimary};
      outline-offset: 2px;
    }
  `,
  cardActions: css`
    position: absolute;
    inset-block-start: 12px;
    inset-inline-end: 12px;

    border-radius: ${cssVar.borderRadius};

    opacity: 0;
    background: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadowTertiary};

    transition: opacity 0.12s ease;

    ${responsive.md} {
      display: none;
    }
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;

    ${responsive.md} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
  `,
  meta: css`
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  name: css`
    font-weight: 500;
  `,
  thumb: css`
    aspect-ratio: 4 / 3;
  `,
}))

export function FileGrid(props: {
  cursorId: null | string
  items: FileItem[]
  menuItems: (item: FileItem) => ContextMenuItem[]
  onCopy: (item: FileItem) => void
  onOpen: (item: FileItem) => void
  openName: null | string
}) {
  const copy = useFileCopy()
  const { format } = useI18n()

  return (
    <div className={styles.grid} role="list">
      {props.items.map((item) => (
        <div
          aria-current={props.openName === item.name ? 'true' : undefined}
          className={styles.card}
          data-cursor={props.cursorId === item.name ? '' : undefined}
          data-id={item.name}
          data-scope-item="row"
          key={item.name}
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest('button')
            )
              return
            props.onOpen(item)
          }}
          onContextMenu={(event) => {
            event.preventDefault()
            showContextMenu(props.menuItems(item))
          }}
          role="listitem"
          tabIndex={-1}
        >
          <FileThumb
            className={styles.thumb}
            fill
            name={item.name}
            url={item.url}
          />
          <div className={styles.cardActions} data-card-actions="">
            <ActionIcon
              aria-label={copy('copyLink')}
              icon={Copy}
              onClick={() => props.onCopy(item)}
              size="small"
              title={copy('copyLink')}
            />
          </div>
          <Text
            className={styles.name}
            ellipsis={{ tooltip: item.name, tooltipWhenOverflow: true }}
          >
            {item.name}
          </Text>
          <Tooltip title={formatUploadedAt(item.created)}>
            <span className={styles.meta}>
              {item.created ? format.relativeTime(item.created) : '--'}
            </span>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
