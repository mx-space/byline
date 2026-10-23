import { createStaticStyles } from '@lobehub/ui'

export const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  actions: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;

    opacity: 0;

    transition: opacity 0.12s ease;

    ${responsive.md} {
      opacity: 1;
    }
  `,
  alerts: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  avatarStack: css`
    display: flex;
    flex: none;
    align-items: center;

    > * + * {
      margin-inline-start: -6px;
    }

    > * {
      border-radius: 50%;
      box-shadow: 0 0 0 2px ${cssVar.colorBgContainer};
    }
  `,
  byline: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  `,
  filters: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;
    gap: 8px;
    min-width: 0;
  `,
  pin: css`
    flex: none;
    color: ${cssVar.colorWarning};
  `,
  root: css`
    height: 100%;
    min-height: 0;
  `,
  row: css`
    cursor: pointer;

    &:hover [data-row-actions],
    &:focus-within [data-row-actions],
    &[data-cursor] [data-row-actions] {
      opacity: 1;
    }

    &[data-cursor] > td {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  search: css`
    flex: 1 1 16rem;
    min-width: 12rem;
    max-width: 24rem;
  `,
  selectionBar: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  `,
  slug: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  state: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 20rem;
    padding: 24px;
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
  titleLine: css`
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  `,
  titleText: css`
    overflow: hidden;

    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))
