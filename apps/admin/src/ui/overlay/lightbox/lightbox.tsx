import {
  createStaticStyles,
  ModalBackdrop,
  ModalClose,
  ModalPopup,
  ModalPortal,
  ModalRoot,
  ModalTitle,
} from '@lobehub/ui'
import type { ReactNode } from 'react'

import { PortalLayerScope, useFloatingZ } from '~/ui/feedback/portal-layer'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  udc1b8b86: css`
    min-width: 0px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorTextLightSolid};
  `,
  u2daa8e5e: css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `,
  u08dfbca0: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
  `,
  u96ca232e: css`
    display: flex;
    min-height: 0px;
    flex: 1 1 0%;
    align-items: center;
    justify-content: center;
    background-color: ${cssVar.colorBgMask};
    padding: 0.75rem;
  `,
  ud4cfe961: css`
    position: fixed;
    inset: 0px;
    background-color: color-mix(in srgb, ${cssVar.colorText} 70%, transparent);
  `,
  ue7b00686: css`
    outline: none;
    box-shadow: ${cssVar.boxShadow};
    position: fixed;
    inset: 1rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(
      in srgb,
      ${cssVar.colorBgContainer} 10%,
      transparent
    );
    background-color: ${cssVar.colorText};
    @media (min-width: 640px) {
      inset: 2rem;
    }
  `,
  uf5ac9d33: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: color-mix(
      in srgb,
      ${cssVar.colorBgContainer} 10%,
      transparent
    );
    padding-inline: 1rem;
    padding-block: 0.75rem;
  `,
  u8b102642: css`
    display: inline-flex;
    height: 2rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(
      in srgb,
      ${cssVar.colorBgContainer} 15%,
      transparent
    );
    padding-inline: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorFillSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorBgContainer} 10%,
        transparent
      );
    }
  `,
}))

interface LightboxProps {
  actions?: ReactNode
  children: ReactNode
  className?: string
  onOpenChange: (open: boolean) => void
  open: boolean
  title?: ReactNode
}

/**
 * Dark fullscreen Dialog scaffolding for media preview.
 * Body region uses pure black for image/video framing; header is dark glass.
 */
export function Lightbox(props: LightboxProps) {
  const { depth, z } = useFloatingZ('dialog')

  return (
    <ModalRoot onOpenChange={props.onOpenChange} open={props.open}>
      <ModalPortal>
        <ModalBackdrop
          className={lobeStyles.ud4cfe961}
          style={{ zIndex: z - 1 }}
        />
        <ModalPopup
          className={cn(lobeStyles.ue7b00686, props.className)}
          popupStyle={{ zIndex: z }}
        >
          <PortalLayerScope depth={depth}>
            {props.title || props.actions ? (
              <div className={lobeStyles.uf5ac9d33}>
                {props.title ? (
                  <ModalTitle className={lobeStyles.udc1b8b86}>
                    {props.title}
                  </ModalTitle>
                ) : (
                  <ModalTitle className={lobeStyles.u2daa8e5e}>
                    Preview
                  </ModalTitle>
                )}
                {props.actions ? (
                  <div className={lobeStyles.u08dfbca0}>{props.actions}</div>
                ) : null}
              </div>
            ) : null}
            <div className={lobeStyles.u96ca232e}>{props.children}</div>
          </PortalLayerScope>
        </ModalPopup>
      </ModalPortal>
    </ModalRoot>
  )
}

export const LightboxClose = ModalClose

const lightboxButtonClass = lobeStyles.u8b102642

export { lightboxButtonClass }
