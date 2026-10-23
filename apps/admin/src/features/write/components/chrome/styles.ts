import { createStaticStyles } from '@lobehub/ui'

const COLUMN = '720px'

export const writeChromeStyles = createStaticStyles(
  ({ css, cssVar, responsive }) => ({
    bar: css`
      display: flex;
      flex: none;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      min-block-size: 56px;
      padding-inline: 12px 16px;
      border-block-end: 1px solid ${cssVar.colorBorderSecondary};

      background: ${cssVar.colorBgContainer};

      ${responsive.md} {
        gap: 4px;
        padding-inline: 4px 8px;
      }
    `,
    barActions: css`
      display: flex;
      flex: none;
      align-items: center;
      gap: 4px;
    `,
    barDivider: css`
      width: 1px;
      height: 20px;
      margin-inline: 8px;
      background: ${cssVar.colorBorderSecondary};

      ${responsive.md} {
        display: none;
      }
    `,
    barIdentity: css`
      display: flex;
      flex: 1 1 auto;
      align-items: center;
      gap: 8px;
      min-width: 0;
    `,
    body: css`
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
    `,
    canvas: css`
      overflow: auto;
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;

      min-width: 0;

      background: ${cssVar.colorBgContainer};
    `,
    column: css`
      width: 100%;
      max-width: ${COLUMN};
      margin-inline: auto;
      padding-inline: 24px;

      ${responsive.md} {
        padding-inline: 16px;
      }
    `,
    drawerBody: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    `,
    editorContent: css`
      width: 100%;
      max-width: ${COLUMN};
      margin-inline: auto;
      padding-block: 4px 160px;
      padding-inline: 24px;

      ${responsive.md} {
        padding-inline: 16px;
      }
    `,
    editorFallback: css`
      display: flex;
      flex-direction: column;
      gap: 16px;

      width: 100%;
      max-width: ${COLUMN};
      min-height: 40vh;
      margin-inline: auto;
      padding: 24px;
    `,
    editorSurface: css`
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 60vh;
    `,
    field: css`
      display: flex;
      flex-direction: column;
      gap: 6px;
    `,
    fieldHint: css`
      font-size: ${cssVar.fontSizeSM};
      line-height: ${cssVar.lineHeightSM};
      color: ${cssVar.colorTextTertiary};
      word-break: break-all;
    `,
    fieldLabel: css`
      font-size: ${cssVar.fontSizeSM};
      font-weight: 500;
      line-height: ${cssVar.lineHeightSM};
      color: ${cssVar.colorTextSecondary};
    `,
    fieldRow: css`
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    `,
    meta: css`
      cursor: pointer;

      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;

      margin-block-end: 12px;
      padding: 0;
      border: 0;

      font: inherit;
      font-size: ${cssVar.fontSizeSM};
      color: ${cssVar.colorTextTertiary};
      text-align: start;

      background: none;

      &:hover {
        color: ${cssVar.colorTextSecondary};
      }
    `,
    metaPath: css`
      font-family: ${cssVar.fontFamilyCode};
    `,
    notices: css`
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 8px;
      padding-block-start: 16px;
    `,
    panel: css`
      flex: none;
      height: 100%;
      min-height: 0;
      min-width: 0;

      & > * {
        min-width: 0;
      }
    `,
    panelBody: css`
      display: flex;
      flex-direction: column;

      height: 100%;
      min-height: 0;
      min-width: 0;

      background: ${cssVar.colorBgContainer};
    `,
    panelHeader: css`
      display: flex;
      flex: none;
      align-items: center;
      justify-content: space-between;

      height: 48px;
      padding-inline: 16px 8px;
      border-block-end: 1px solid ${cssVar.colorBorderSecondary};

      font-weight: 600;
    `,
    panelScroll: css`
      flex: 1 1 auto;
      min-height: 0;
    `,
    root: css`
      display: flex;
      flex-direction: column;

      height: 100%;
      min-height: 0;

      background: ${cssVar.colorBgContainer};
    `,
    section: css`
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-block: 4px 12px;
    `,
    saveState: css`
      overflow: hidden;

      min-width: 0;

      font-size: ${cssVar.fontSizeSM};
      color: ${cssVar.colorTextTertiary};
      text-overflow: ellipsis;
      white-space: nowrap;

      &[data-tone='conflict'] {
        color: ${cssVar.colorError};
      }

      &[data-tone='unsaved'] {
        color: ${cssVar.colorWarning};
      }

      ${responsive.md} {
        display: none;
      }
    `,
    settings: css`
      padding-block: 8px 24px;
      padding-inline: 16px;
    `,
    tagOption: css`
      color: ${cssVar.colorTextTertiary};
    `,
    title: css`
      resize: none;

      width: 100%;
      margin-block: 48px 8px;
      padding: 0;
      border: 0;

      font-family: inherit;
      font-size: ${cssVar.fontSizeHeading1};
      font-weight: 700;
      line-height: ${cssVar.lineHeightHeading1};
      color: ${cssVar.colorText};

      background: transparent;

      &::placeholder {
        color: ${cssVar.colorTextQuaternary};
      }

      ${responsive.md} {
        margin-block-start: 24px;
        font-size: ${cssVar.fontSizeHeading2};
        line-height: ${cssVar.lineHeightHeading2};
      }
    `,
    toolbarSlot: css`
      flex: none;

      > [role='toolbar'] {
        justify-content: center;
      }
    `,
  }),
)
