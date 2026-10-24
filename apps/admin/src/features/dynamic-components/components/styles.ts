import { createStaticStyles } from '@lobehub/ui'

export const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,
  description: css`
    margin: 0;
    color: ${cssVar.colorTextSecondary};
    white-space: pre-wrap;
  `,
  editorBody: css`
    overflow: auto;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 20px;

    min-height: 0;
    padding: 20px;
  `,
  editorError: css`
    flex: none;
    padding-block: 0 12px;
    padding-inline: 20px;
  `,
  editorForm: css`
    display: flex;
    flex-direction: column;
    height: min(90svh, 48rem);
    min-height: 0;
  `,
  empty: css`
    height: 100%;
    padding: 24px;
  `,
  facts: css`
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 8px 16px;

    margin: 0;
    padding-block-start: 16px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};

    font-size: ${cssVar.fontSizeSM};

    dt {
      color: ${cssVar.colorTextTertiary};
    }

    dd {
      margin: 0;
      font-family: ${cssVar.fontFamilyCode};
      color: ${cssVar.colorText};
      word-break: break-all;
    }

    ${responsive.sm} {
      grid-template-columns: minmax(0, 1fr);
      gap: 4px;

      dd + dt {
        margin-block-start: 8px;
      }
    }
  `,
  field: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,
  fieldHint: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
  `,
  fieldLabel: css`
    font-size: ${cssVar.fontSize};
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  hiddenInput: css`
    display: none;
  `,
  hint: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
  `,
  liveError: css`
    flex: none;

    padding-block: 8px;
    padding-inline: 16px;
    border-block-start: 1px solid ${cssVar.colorErrorBorder};

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorError};

    background: ${cssVar.colorErrorBg};
  `,
  mono: css`
    font-family: ${cssVar.fontFamilyCode};
  `,
  monoInput: css`
    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
  `,
  previewFrame: css`
    padding: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorBgContainer};
  `,
  previewPanel: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
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
  rowHeight: css`
    flex: none;
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  rowMain: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  rowName: css`
    overflow: hidden;

    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  rowUrl: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  schemaCode: css`
    overflow: auto;
    max-height: 60vh;
  `,
  search: css`
    flex: 1 1 100%;
  `,
  sourceCode: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 32rem;
  `,
  sourceEditor: css`
    flex: 1;
    min-height: 0;
  `,
  sourceFooter: css`
    display: flex;
    flex: none;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;

    padding-block: 8px;
    padding-inline: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  sourceGrid: css`
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    min-height: 32rem;

    @container (max-width: 760px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  sourceLoading: css`
    height: 100%;
    min-height: 32rem;
  `,
  sourcePreview: css`
    display: flex;
    flex-direction: column;
    gap: 16px;

    padding: 16px;
    border-inline-start: 1px solid ${cssVar.colorBorderSecondary};

    background: ${cssVar.colorFillQuaternary};

    @container (max-width: 760px) {
      border-block-start: 1px solid ${cssVar.colorBorderSecondary};
      border-inline-start: none;
    }
  `,
  sourceRoot: css`
    container-type: inline-size;
    overflow: hidden;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
  `,
  tabs: css`
    flex: none;
    padding-inline: 16px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    ${responsive.md} {
      padding-inline: 8px;
    }
  `,
  uploadRow: css`
    display: flex;
    gap: 8px;
    align-items: center;
  `,
  uploadInput: css`
    flex: 1;
    min-width: 0;
  `,
}))
