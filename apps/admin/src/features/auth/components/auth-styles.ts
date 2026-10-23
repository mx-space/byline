import { createStaticStyles } from '@lobehub/ui'

export const authStyles = createStaticStyles(({ css, cssVar }) => ({
  afterFields: css`
    margin-top: 12px;
  `,
  afterForm: css`
    margin-top: 32px;
  `,
  form: css`
    width: 100%;
  `,
  link: css`
    align-self: flex-start;
    color: ${cssVar.colorPrimary};
    text-decoration: none;

    &:hover {
      color: ${cssVar.colorPrimaryHover};
    }

    &:focus-visible {
      text-decoration: underline;
    }
  `,
  method: css`
    min-height: 44px;
  `,
  notice: css`
    margin-bottom: 16px;
  `,
  methods: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 32px;
  `,
  submit: css`
    margin-top: 16px;
    min-height: 44px;
  `,
  wrap: css`
    overflow-wrap: anywhere;
  `,
}))
