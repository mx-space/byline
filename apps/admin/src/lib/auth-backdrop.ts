import { createStaticStyles } from '@lobehub/ui'
import type { CSSProperties } from 'react'

import { bgUrl } from '~/constants/env'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ud65dd912: css`
    position: relative;
    min-height: 100dvh;
    overflow: hidden;
    background-color: ${cssVar.colorBgContainer};
    padding: 1rem;
    color: ${cssVar.colorText};
  `,
  u871deadf: css`
    width: 100%;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding: 1.5rem;
    box-shadow: ${cssVar.boxShadowTertiary};
  `,
  u1f6009b1: css`
    display: flex;
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 12px;
    background-color: ${cssVar.colorPrimaryBg};
    color: ${cssVar.colorPrimary};
  `,
  u76a54174: css`
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  u383496c9: css`
    font-size: 0.875rem;
    line-height: 1.375rem;
    color: ${cssVar.colorTextSecondary};
  `,
}))

export const authBackdropClassName = lobeStyles.ud65dd912

export const authBackdropStyle: CSSProperties = {
  backgroundImage: bgUrl
    ? `linear-gradient(rgba(247, 251, 255, 0.86), rgba(255, 255, 255, 0.92)), url(${bgUrl})`
    : 'linear-gradient(180deg, #e9f5fe 0%, #f7fbff 60%, #ffffff 100%)',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
}

export const authCardClassName = lobeStyles.u871deadf

export const authIconTileClassName = lobeStyles.u1f6009b1

export const authTitleClassName = lobeStyles.u76a54174

export const authDescriptionClassName = lobeStyles.u383496c9
