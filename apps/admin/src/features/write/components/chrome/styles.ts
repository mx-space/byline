import { createStaticStyles } from '@lobehub/ui'

const COLUMN = '740px'

export const writeChromeStyles = createStaticStyles(
  ({ css, cssVar, responsive }) => ({
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

      .rich-editor .rich-editor__content-wrapper {
        box-sizing: border-box;
        width: 100%;
        max-width: ${COLUMN};
        margin-inline: auto;
        padding-inline: 24px;

        ${responsive.md} {
          padding-inline: 16px;
        }
      }
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
    editor: css`
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;

      min-width: 0;
      min-height: 0;
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
    dateRow: css`
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 8px;
    `,
    fieldHint: css`
      font-size: ${cssVar.fontSize};
      line-height: ${cssVar.lineHeight};
      color: ${cssVar.colorTextTertiary};
    `,
    drill: css`
      cursor: pointer;

      display: flex;
      gap: 8px;
      align-items: center;

      width: 100%;
      min-height: 44px;
      padding-block: 12px;
      padding-inline: 0;
      border: 0;
      border-block-start: 1px solid ${cssVar.colorFillSecondary};

      font: inherit;
      font-size: ${cssVar.fontSize};
      color: ${cssVar.colorText};
      text-align: start;

      background: none;

      &:hover {
        color: ${cssVar.colorPrimary};
      }
    `,
    drillThumb: css`
      flex: none;

      width: 40px;
      height: 28px;
      border-radius: ${cssVar.borderRadiusSM};

      background-color: ${cssVar.colorFillTertiary};
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      box-shadow: inset 0 0 0 1px
        color-mix(in srgb, ${cssVar.colorText} 12%, transparent);
    `,
    drillValue: css`
      overflow: hidden;
      flex: none;
      max-width: 46%;
      color: ${cssVar.colorTextTertiary};
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    drillLabel: css`
      flex: 1;
      min-width: 0;
    `,
    labelRow: css`
      display: flex;
      gap: 12px;
      align-items: baseline;
      justify-content: space-between;
    `,
    sideLink: css`
      display: inline-flex;
      flex: none;
      gap: 4px;
      align-items: center;

      font-size: ${cssVar.fontSize};
      line-height: ${cssVar.lineHeight};
      color: ${cssVar.colorTextSecondary};

      &:hover {
        color: ${cssVar.colorPrimary};
      }
    `,
    pathRow: css`
      display: flex;
      gap: 4px;
      align-items: center;
      min-width: 0;
      min-height: 24px;
    `,
    path: css`
      overflow: hidden;
      flex: 1;
      min-width: 0;

      font-family: ${cssVar.fontFamilyCode};
      font-size: ${cssVar.fontSize};
      line-height: ${cssVar.lineHeight};
      color: ${cssVar.colorTextTertiary};
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    liveLink: css`
      display: flex;
      gap: 8px;
      align-items: center;

      min-width: 0;
      min-height: 32px;

      font-size: ${cssVar.fontSize};
      line-height: ${cssVar.lineHeight};
      color: ${cssVar.colorText};

      &:hover {
        color: ${cssVar.colorPrimary};
      }
    `,
    tagTrigger: css`
      align-items: flex-start;
      max-height: 88px;
      overflow: auto;

      & span:has(> [data-role='lobe-select-tag']) {
        display: flex;
        flex-flow: row wrap;
        gap: 4px;
        width: auto;
        max-width: 100%;
      }

      & [data-role='lobe-select-tag'] {
        flex: none;
        width: auto;
        max-width: 100%;

        font-size: ${cssVar.fontSize};
        line-height: 22px;
      }
    `,
    fieldLabel: css`
      font-size: ${cssVar.fontSize};
      font-weight: 500;
      line-height: ${cssVar.lineHeight};
      color: ${cssVar.colorTextSecondary};
    `,
    fieldRow: css`
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;

      min-height: 40px;
    `,
    meta: css`
      cursor: pointer;

      display: flex;
      flex-wrap: nowrap;
      gap: 8px;
      align-items: center;

      width: 100%;
      min-width: 0;
      margin-block-end: 12px;
      padding: 0;
      border: 0;

      font: inherit;
      font-size: ${cssVar.fontSize};
      line-height: ${cssVar.lineHeight};
      color: ${cssVar.colorTextTertiary};
      text-align: start;

      background: none;

      &:hover {
        color: ${cssVar.colorTextSecondary};
      }

      & > span {
        overflow: hidden;
        min-width: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
    metaPath: css`
      overflow: hidden;
      flex: 1 1 auto;
      min-width: 0;

      font-family: ${cssVar.fontFamilyCode};
      text-overflow: ellipsis;
      white-space: nowrap;
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

      box-sizing: border-box;
      height: 48px;
      padding-inline: 16px 8px;
      border-block-end: 1px solid ${cssVar.colorBorderSecondary};

      font-size: ${cssVar.fontSizeLG};
      font-weight: 600;
      line-height: ${cssVar.lineHeightLG};
    `,
    panelHeaderBack: css`
      cursor: pointer;

      display: flex;
      gap: 6px;
      align-items: center;

      min-width: 0;
      padding: 0;
      border: 0;

      font: inherit;
      color: inherit;

      background: none;
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

      width: 100%;
      min-width: 0;
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
      display: flex;
      flex: 1;
      flex-direction: column;

      min-height: 100%;
      padding-block: 8px 24px;
      padding-inline: 16px;
    `,
    dangerZone: css`
      display: flex;
      flex-flow: row wrap;
      gap: 8px;

      margin-top: auto;
      padding-top: 32px;
    `,
    dangerAction: css`
      flex: 1 1 8rem;
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
