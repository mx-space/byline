import { createStaticStyles } from '@lobehub/ui'

export const wizardStyles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  aside: css`
    width: 100%;
    padding: 24px 16px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};

    font-size: 12px;
    line-height: 18px;
    color: ${cssVar.colorTextSecondary};

    @media (min-width: 960px) {
      width: 240px;
      border-block-start: none;
      border-inline-start: 1px solid ${cssVar.colorBorderSecondary};
    }
  `,
  body: css`
    margin-top: 24px;
  `,
  break: css`
    overflow-wrap: anywhere;
  `,
  choices: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  column: css`
    display: flex;
    flex-direction: column;
    gap: 24px;

    width: 100%;
    max-width: 560px;
    min-width: 0;
    margin-inline: auto;
    padding: 24px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorBgContainer};

    &
      :has(
        > input:not([type='checkbox']):not([type='file']):not([type='hidden'])
      ) {
      border: 1px solid ${cssVar.colorBorder};
      border-radius: ${cssVar.borderRadius};
      background: ${cssVar.colorFillTertiary};
    }
  `,
  description: css`
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 22px;
    color: ${cssVar.colorTextSecondary};
  `,
  docs: css`
    font-size: 12px;
    line-height: 18px;
    color: ${cssVar.colorTextSecondary};
  `,
  feature: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  footer: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 24px;
  `,
  link: css`
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    color: ${cssVar.colorPrimary};
  `,
  page: css`
    display: flex;
    min-height: 100%;
    padding: 48px 16px 32px;
    color: ${cssVar.colorText};
    background: ${cssVar.colorBgLayout};
  `,
  board: css`
    display: flex;
    flex-wrap: wrap;

    width: 100%;
    max-width: 960px;
    min-height: 520px;
    margin-inline: auto;
    overflow: hidden;

    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorBgContainer};
    box-shadow: ${cssVar.boxShadowTertiary};
  `,
  railCol: css`
    display: flex;
    flex-direction: column;
    gap: 16px;

    width: 100%;
    padding: 24px 16px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    @media (min-width: 768px) {
      width: 220px;
      border-block-end: none;
      border-inline-end: 1px solid ${cssVar.colorBorderSecondary};
    }
  `,
  stage: css`
    display: flex;
    flex: 1 1 320px;
    flex-wrap: wrap;
    min-width: 0;

    & > main {
      display: flex;
      flex: 1 1 420px;
      min-width: 0;
    }
  `,
  card: css`
    display: flex;
    flex: 1 1 420px;
    flex-direction: column;

    min-width: 0;
    padding: 24px;

    & :has(> input:not([type='checkbox'], [type='file'], [type='hidden'])) {
      border: 1px solid ${cssVar.colorBorder};
      border-radius: ${cssVar.borderRadius};
      background: ${cssVar.colorFillTertiary};
    }
  `,
  progress: css`
    margin: 0;
    font-size: 12px;
    line-height: 18px;
    color: ${cssVar.colorTextSecondary};
  `,
  provider: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  `,
  providerName: css`
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  rail: css`
    display: flex;
    flex-direction: column;
    gap: 4px;

    margin: 0;
    padding: 0;

    list-style: none;
  `,
  railCurrent: css`
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  railItem: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;

    min-height: 32px;
    padding-inline: 8px;

    font-size: 12px;
    line-height: 18px;
    color: ${cssVar.colorTextSecondary};
  `,
  railSub: css`
    padding-inline-start: 16px;
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  summary: css`
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content;
    gap: 8px 12px;
    align-items: center;

    font-size: 14px;
    line-height: 22px;
  `,
  summaryValue: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  title: css`
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    color: ${cssVar.colorText};
  `,
}))
