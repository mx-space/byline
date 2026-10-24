import { createStaticStyles, cx, Icon, Tag, Tooltip } from '@lobehub/ui'
import { Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

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
    flex: 1;
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
  cover: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    width: 64px;
    height: 40px;
    border-radius: ${cssVar.borderRadiusXS};

    background: ${cssVar.colorFillTertiary};
  `,
  coverIcon: css`
    color: ${cssVar.colorTextQuaternary};
  `,
  coverImage: css`
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
  line: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  `,
  row: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    margin-inline: 8px;
    padding-block: 10px;
    padding-inline: 8px 12px;
    border-radius: ${cssVar.borderRadius};

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }

    &[aria-current='true'] {
      background: ${cssVar.colorFillSecondary};
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

function draftCoverSrc(draft: DraftModel) {
  const image = draft.headRevision.typeSpecificData?.image
  return typeof image === 'string' ? image.trim() : ''
}

function DraftCover(props: { src: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const show = props.src.length > 0 && failedSrc !== props.src
  return (
    <span aria-hidden className={styles.cover}>
      {show ? (
        <img
          alt=""
          className={styles.coverImage}
          decoding="async"
          loading="lazy"
          onError={() => setFailedSrc(props.src)}
          src={props.src}
        />
      ) : (
        <Icon className={styles.coverIcon} icon={ImageIcon} size="small" />
      )}
    </span>
  )
}

export function DraftRow(props: {
  actions: ReadonlyArray<ListAction<DraftModel>>
  authorNames: (ids: string[]) => string
  cursor?: boolean
  draft: DraftModel
  isDetailTarget: boolean
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
      menuItems={() => buildMenuItemsFromActions(props.actions, props.draft)}
      onSelect={props.onSelect}
      role="row"
    >
      <DraftCover src={draftCoverSrc(props.draft)} />
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
