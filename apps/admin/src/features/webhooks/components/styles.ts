import { createStaticStyles } from '@lobehub/ui'

export const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  dot: css`
    flex: none;

    width: 8px;
    height: 8px;
    border-radius: 50%;

    background: ${cssVar.colorFill};
  `,
  dotError: css`
    background: ${cssVar.colorError};
  `,
  dotSuccess: css`
    background: ${cssVar.colorSuccess};
  `,
  drawerBody: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,
  drawerSection: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  eventGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px 16px;
    padding-inline-start: 24px;
  `,
  eventGroup: css`
    display: flex;
    flex-direction: column;
    gap: 8px;

    padding-block: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  eventName: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  eventPicker: css`
    display: flex;
    flex-direction: column;

    padding-block: 4px 0;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadiusLG};
  `,
  eventPickerHead: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-block: 8px 12px;
  `,
  facts: css`
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 8px 16px;
    font-size: ${cssVar.fontSizeSM};

    dt {
      color: ${cssVar.colorTextTertiary};
    }

    dd {
      margin: 0;
      color: ${cssVar.colorText};
      word-break: break-all;
    }
  `,
  mono: css`
    font-family: ${cssVar.fontFamilyCode};
  `,
  row: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    min-height: 56px;
    padding-block: 8px;
    padding-inline: 16px 12px;
    border: none;

    text-align: start;

    background: transparent;

    &:hover {
      background: ${cssVar.colorFillQuaternary};
    }

    &:focus-visible {
      outline: 2px solid ${cssVar.colorPrimaryBorder};
      outline-offset: -2px;
    }
  `,
  rowCurrent: css`
    background: ${cssVar.colorFillTertiary};

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  rowHost: css`
    overflow: hidden;

    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  rowMain: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  rowMuted: css`
    opacity: 0.6;
  `,
  rowPath: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  rowSide: css`
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  `,
  rowTime: css`
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
    white-space: nowrap;
  `,
  saveBar: css`
    position: sticky;
    z-index: 1;
    inset-block-end: 0;

    display: flex;
    gap: 8px;
    align-items: center;

    margin-block: 8px -32px;
    padding-block: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorBgContainer};

    ${responsive.md} {
      margin-block-end: -24px;
    }
  `,
  saveBarText: css`
    flex: 1;
    color: ${cssVar.colorTextSecondary};
  `,
  scopeRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
  `,
  secretRow: css`
    display: flex;
    gap: 8px;
    align-items: center;

    ${responsive.md} {
      flex-wrap: wrap;
    }
  `,
  secretInput: css`
    flex: 1;
    min-width: 12rem;
    font-family: ${cssVar.fontFamilyCode};
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  `,
  tableRow: css`
    cursor: pointer;
  `,
  tableActions: css`
    display: flex;
    justify-content: flex-end;
  `,
  tabs: css`
    flex: none;
    padding-inline: 16px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    ${responsive.md} {
      padding-inline: 8px;
    }
  `,
  time: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
    white-space: nowrap;
  `,
  urlInput: css`
    font-family: ${cssVar.fontFamilyCode};
  `,
}))
