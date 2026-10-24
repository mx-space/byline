import { createStaticStyles } from '@lobehub/ui'

export const hubStyles = createStaticStyles(({ css, cssVar }) => ({
  alerts: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  cell: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;

    font-size: ${cssVar.fontSizeSM};
    white-space: nowrap;
  `,
  cellDone: css`
    color: ${cssVar.colorSuccess};
  `,
  cellFailed: css`
    color: ${cssVar.colorError};
  `,
  cellGap: css`
    color: ${cssVar.colorWarning};
  `,
  cellProgress: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  cellMuted: css`
    color: ${cssVar.colorTextTertiary};
  `,
  cellPending: css`
    color: ${cssVar.colorInfo};
  `,
  filters: css`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    min-width: 0;
  `,
  headerTitle: css`
    white-space: nowrap;
  `,
  row: css`
    cursor: pointer;
  `,
  rowActions: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
  `,
  search: css`
    flex: 1 1 16rem;
    min-width: 12rem;
    max-width: 24rem;
  `,
  select: css`
    flex: none;
    width: auto;
    min-width: 8rem;
  `,
  selectionBar: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  `,
  subline: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  time: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
    white-space: nowrap;
  `,
  titleCell: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  titleText: css`
    overflow: hidden;

    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  childPreview: css`
    display: block;
    overflow: hidden;

    padding-inline-start: 28px;

    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  childRow: css`
    > td {
      background: ${cssVar.colorFillQuaternary};
    }
  `,
  preview: css`
    overflow: hidden;

    max-width: 48ch;

    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))
