import { Checkbox, createStaticStyles, cx, Tag, Tooltip } from '@lobehub/ui'

import type { DraftModel } from '~/models/draft'
import type { ListAction, ListRowSelectMode } from '~/ui/list-actions'
import { buildMenuItemsFromActions, ListRow } from '~/ui/list-actions'

import { useDraftCopy } from '../copy'
import {
  draftAuthorIds,
  draftHasConflict,
  draftSavedAt,
  draftTitle,
  relativeDraftTime,
} from '../utils/draft-decision'
import { DraftKindTag } from './DraftKindTag'

const styles = createStaticStyles(({ css, cssVar }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `,
  byline: css`
    overflow: hidden;
    min-width: 0;
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  check: css`
    display: flex;
    padding-block-start: 2px;
    opacity: 0;
    transition: opacity 0.15s ease;
  `,
  line: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  `,
  row: css`
    cursor: pointer;

    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    align-items: start;

    margin-inline: 8px;
    padding-block: 12px;
    padding-inline: 8px 12px;
    border-radius: ${cssVar.borderRadius};

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }

    &[aria-current='true'] {
      background: ${cssVar.colorFillSecondary};
    }

    &:hover [data-row-check],
    &:focus-within [data-row-check],
    &[data-selected] [data-row-check],
    [data-selecting] & [data-row-check] {
      opacity: 1;
    }
  `,
  time: css`
    flex: none;
    margin-inline-start: auto;
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  title: css`
    overflow: hidden;
    flex: 1;

    min-width: 0;
    margin: 0;

    font-size: ${cssVar.fontSize};
    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  untitled: css`
    color: ${cssVar.colorTextTertiary};
  `,
}))

export function DraftRow(props: {
  actions: ReadonlyArray<ListAction<DraftModel>>
  authorNames: (ids: string[]) => string
  checked: boolean
  cursor?: boolean
  draft: DraftModel
  isDetailTarget: boolean
  onCheck: () => void
  onSelect: (mode: ListRowSelectMode) => void
}) {
  const { copy, format } = useDraftCopy()
  const untitled = copy('untitled')
  const title = draftTitle(props.draft, untitled)
  const savedAt = draftSavedAt(props.draft)
  const authorIds = draftAuthorIds(props.draft)

  return (
    <ListRow
      ariaCurrent={props.isDetailTarget}
      as="article"
      className={styles.row}
      cursor={props.cursor}
      dataId={props.draft.id}
      leading={
        <span className={styles.check} data-row-check="">
          <Checkbox
            aria-label={copy('checkboxAria', { title })}
            checked={props.checked}
            onChange={() => props.onCheck()}
          />
        </span>
      }
      menuItems={() => buildMenuItemsFromActions(props.actions, props.draft)}
      onSelect={props.onSelect}
      role="row"
      selected={props.checked}
    >
      <div className={styles.body}>
        <div className={styles.line}>
          <h3
            className={cx(styles.title, title === untitled && styles.untitled)}
          >
            {title}
          </h3>
          <Tooltip title={format.dateTime(savedAt)}>
            <time className={styles.time} dateTime={savedAt}>
              {relativeDraftTime(
                savedAt,
                format.relativeTime,
                copy('emptyValue'),
              )}
            </time>
          </Tooltip>
        </div>
        <div className={styles.line}>
          <DraftKindTag draft={props.draft} size="small" />
          {draftHasConflict(props.draft) ? (
            <Tag color="error" size="small">
              {copy('conflict')}
            </Tag>
          ) : null}
          {authorIds.length > 0 ? (
            <span className={styles.byline}>
              {props.authorNames(authorIds)}
            </span>
          ) : null}
        </div>
      </div>
    </ListRow>
  )
}
