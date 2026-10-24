import { createStaticStyles } from '@lobehub/ui'

export const styles = createStaticStyles(({ css, cssVar }) => ({
  body: css`
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;

    max-height: 60vh;
    padding: 12px;
  `,
  field: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  footer: css`
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;

    padding-block: 8px;
    padding-inline: 12px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  footerActions: css`
    display: flex;
    flex: none;
    gap: 8px;
  `,
  header: css`
    display: flex;
    gap: 8px;
    align-items: center;

    min-height: 44px;
    padding-block: 6px;
    padding-inline: 8px 12px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  hint: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
  `,
  label: css`
    font-size: ${cssVar.fontSize};
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  mono: css`
    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
  `,
  option: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    width: 100%;
    padding: 8px;
    border: none;
    border-radius: ${cssVar.borderRadius};

    font: inherit;
    text-align: start;

    background: transparent;

    transition: background-color 0.15s ease;

    &[aria-selected='true'] {
      background: ${cssVar.colorFillTertiary};
    }

    &:focus-visible {
      outline: 2px solid ${cssVar.colorPrimaryBorder};
      outline-offset: -2px;
    }
  `,
  optionCount: css`
    flex: none;
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextQuaternary};
  `,
  optionDescription: css`
    overflow: hidden;

    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  optionIcon: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border-radius: ${cssVar.borderRadiusSM};

    color: ${cssVar.colorTextSecondary};

    background: ${cssVar.colorFillTertiary};
  `,
  optionMain: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  optionName: css`
    overflow: hidden;

    font-size: ${cssVar.fontSize};
    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  options: css`
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;

    max-height: 288px;
    padding: 4px;
  `,
  panel: css`
    display: flex;
    flex-direction: column;
    width: min(92vw, 512px);
  `,
  placeholder: css`
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;

    border: 1px dashed ${cssVar.colorPrimaryBorder};
    border-radius: ${cssVar.borderRadius};

    font-size: ${cssVar.fontSize};
    color: ${cssVar.colorPrimaryText};

    background: ${cssVar.colorPrimaryBg};
  `,
  popover: css`
    padding: 0;

    --lobe-popover-viewport-inline-padding: 0;
  `,
  root: css`
    position: relative;
    margin-block: 20px;
  `,
  search: css`
    padding: 8px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  status: css`
    margin: 0;
    padding-block: 16px;
    padding-inline: 8px;

    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-align: center;
  `,
  title: css`
    overflow: hidden;
    flex: 0 1 auto;

    min-width: 0;

    font-size: ${cssVar.fontSize};
    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  trigger: css`
    position: absolute;
    z-index: 1;
    inset-block-start: 8px;
    inset-inline-end: 8px;

    background: ${cssVar.colorBgElevated};
    box-shadow: ${cssVar.boxShadowTertiary};

    transition: opacity 0.15s ease;
  `,
  triggerIdle: css`
    opacity: 0;

    *:hover > &,
    &:focus-visible {
      opacity: 1;
    }
  `,
}))
