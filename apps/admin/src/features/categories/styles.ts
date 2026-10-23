import { createStaticStyles } from '@lobehub/ui'

export const categoryStyles = createStaticStyles(
  ({ css, cssVar, responsive }) => ({
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
    count: css`
      font-variant-numeric: tabular-nums;
      color: ${cssVar.colorText};
      text-decoration: none;

      &:hover {
        color: ${cssVar.colorPrimary};
        text-decoration: underline;
      }
    `,
    countZero: css`
      font-variant-numeric: tabular-nums;
      color: ${cssVar.colorTextTertiary};
    `,
    modalBody: css`
      display: flex;
      flex-direction: column;
      gap: 16px;
    `,
    modalFooter: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    `,
    name: css`
      overflow: hidden;

      font-weight: 500;
      color: ${cssVar.colorText};
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    nameCell: css`
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    `,
    posts: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      padding-block: 8px;
      padding-inline: 12px;
      border-radius: ${cssVar.borderRadius};

      background: ${cssVar.colorFillQuaternary};
    `,
    row: css`
      cursor: pointer;

      &:hover [data-row-actions],
      &:focus-within [data-row-actions] {
        opacity: 1;
      }
    `,
    search: css`
      flex: 1;
      min-width: 0;

      > * {
        width: 100%;
        max-width: 24rem;
      }
    `,
    slug: css`
      overflow: hidden;

      font-family: ${cssVar.fontFamilyCode};
      font-size: ${cssVar.fontSizeSM};
      color: ${cssVar.colorTextTertiary};
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    slugInput: css`
      font-family: ${cssVar.fontFamilyCode};
    `,
    time: css`
      font-variant-numeric: tabular-nums;
      color: ${cssVar.colorTextSecondary};
      white-space: nowrap;
    `,
  }),
)
