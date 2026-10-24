import { createStaticStyles } from '@lobehub/ui'

export const styles = createStaticStyles(({ css, cssVar }) => ({
  caption: css`
    font-size: 11px;
    line-height: 14px;
    color: ${cssVar.colorTextTertiary};
    white-space: nowrap;
  `,
  logo: css`
    flex: none;
    line-height: 1;
  `,
}))
