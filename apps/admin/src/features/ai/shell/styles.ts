import { createStaticStyles } from '@lobehub/ui'

export const aiStyles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  `,
  drawerForm: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  editor: css`
    min-height: 240px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadius};
  `,
  field: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  filterControl: css`
    width: 180px;
  `,
  filters: css`
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 0 24px 12px;
  `,
  insightsRead: css`
    margin: 0;
    max-width: 68ch;
    font-size: ${cssVar.fontSize};
    line-height: 1.8;
    white-space: pre-wrap;
    color: ${cssVar.colorText};
  `,
  label: css`
    font-size: ${cssVar.fontSize};
    color: ${cssVar.colorTextSecondary};
  `,
  lockedStrip: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  `,
  meta: css`
    font-size: ${cssVar.fontSize};
    color: ${cssVar.colorTextSecondary};
  `,
  page: css`
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    background: ${cssVar.colorBgContainer};
  `,
  pageHead: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 24px;
  `,
  pager: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 24px 16px;
  `,
  prose: css`
    margin: 0;
    max-width: 68ch;
    font-size: ${cssVar.fontSize};
    line-height: 1.7;
    white-space: pre-wrap;
    color: ${cssVar.colorText};
  `,
  segment: css`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  segmentPlaying: css`
    background: ${cssVar.colorFillSecondary};
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  summaryRead: css`
    margin: 0;
    max-width: 36em;
    font-size: ${cssVar.fontSizeLG};
    line-height: 1.7;
    color: ${cssVar.colorText};
  `,
  tableWrap: css`
    min-height: 0;
    flex: 1;
    overflow: auto;
    padding: 0 24px 16px;
  `,
  title: css`
    margin: 0;
    font-size: ${cssVar.fontSizeHeading4};
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  translationTitle: css`
    margin: 0;
    max-width: 40em;
    font-size: ${cssVar.fontSizeHeading4};
    font-weight: 600;
    line-height: 1.4;
    color: ${cssVar.colorText};
  `,
}))
