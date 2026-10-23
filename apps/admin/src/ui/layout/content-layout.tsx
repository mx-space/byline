import { createStaticStyles, DraggablePanel } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import type { BottomSheetSnap } from '~/ui/feedback/bottom-sheet'
import { BottomSheet } from '~/ui/feedback/bottom-sheet'
import { Drawer } from '~/ui/feedback/drawer'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uc44c9ca6: css`
    display: flex;
    height: 100%;
    min-height: 0px;
    min-width: 0px;
    flex: 1 1 0%;
  `,
  u9c9ac8dc: css`
    min-height: 0px;
    min-width: 0px;
    overflow: hidden;
  `,
  u9f260e33: css`
    align-content: layout-main;
  `,
  main: css`
    flex: 1 1 auto;
    min-width: 0;
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
  panelContent: css`
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  `,
  ud6e6f7a3: css`
    align-content: layout-aside;
  `,
  u1098decd: css`
    position: relative;
    height: 100%;
  `,
  ud557c16f: css`
    display: flex;
    min-height: 0px;
    min-width: 0px;
    flex: 1 1 0%;
    flex-direction: column;
  `,
  ua65ebe05: css`
    position: relative;
    background-color: ${cssVar.colorBgContainer};
  `,
  ud143f23b: css`
    width: min(90vw, 30rem);
  `,
  u1a0b7be3: css`
    position: absolute;
    inset: 0px;
    display: flex;
    flex-direction: column;
  `,
  ud435703e: css`
    display: flex;
    height: 100%;
    min-height: 0px;
    flex-direction: column;
  `,
  u5615bd9f: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 1rem;
  `,
  u2e014667: css`
    display: inline-flex;
    min-width: 0px;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  uc39c8d01: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  uf283ea9b: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u0a935cc3: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.375rem;
  `,
  u3be339ed: css`
    display: inline-flex;
    width: 2.25rem;
    height: 2.25rem;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: ${cssVar.colorTextTertiary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u1190fc46: css`
    display: flex;
    min-height: 0px;
    flex: 1 1 0%;
    flex-direction: column;
  `,
  u61cebfd1: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    border-top-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 1rem;
    padding-block: 0.75rem;
  `,
}))

const PANEL_FADE = { duration: 0.22, ease: 'easeOut' as const }

function resolvePanelPx(
  value: number | string | undefined,
  containerWidth: number | null,
  fallback: number,
) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const pixels = /^(\d+(?:\.\d+)?)px$/.exec(trimmed)
    if (pixels) return Number(pixels[1])
    const percent = /^(\d+(?:\.\d+)?)%$/.exec(trimmed)
    if (percent && containerWidth && containerWidth > 0) {
      return Math.round((Number(percent[1]) / 100) * containerWidth)
    }
  }
  return fallback
}

interface ContentLayoutContextValue {
  asideEl: HTMLDivElement | null
}

const ContentLayoutContext = createContext<ContentLayoutContextValue | null>(
  null,
)

export function ContentLayout(props: {
  asideDefaultSize?: number | string
  asideMaxSize?: number | string
  asideMinSize?: number | string
  asideMobileSnap?: BottomSheetSnap
  asideMobileTitle?: ReactNode
  children: ReactNode
  className?: string
  compactAtWidth?: number
  mainClassName?: string
  mainMinSize?: number | string
  onCloseAside?: () => void
  onOpenAside?: () => void
  open: boolean
}) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const [asideEl, setAsideEl] = useState<HTMLDivElement | null>(null)
  const [layoutEl, setLayoutEl] = useState<HTMLDivElement | null>(null)
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null)

  const compactAtWidth = props.compactAtWidth
  const observeContainer = isDesktop && compactAtWidth !== undefined
  useLayoutEffect(() => {
    if (!observeContainer || !layoutEl) return

    const updateWidth = () => {
      const nextWidth = layoutEl.clientWidth
      setLayoutWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      )
    }
    updateWidth()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateWidth)
    observer.observe(layoutEl)
    return () => observer.disconnect()
  }, [layoutEl, observeContainer])

  const compact =
    observeContainer &&
    layoutWidth !== null &&
    compactAtWidth !== undefined &&
    layoutWidth < compactAtWidth

  const value = useMemo<ContentLayoutContextValue>(
    () => ({ asideEl }),
    [asideEl],
  )

  return (
    <ContentLayoutContext.Provider value={value}>
      {isDesktop && !compact ? (
        <DesktopContentLayout
          asideDefaultSize={props.asideDefaultSize}
          asideMaxSize={props.asideMaxSize}
          asideMinSize={props.asideMinSize}
          className={props.className}
          mainClassName={props.mainClassName}
          mainMinSize={props.mainMinSize}
          onCloseAside={() => {
            if (
              compactAtWidth !== undefined &&
              (layoutEl === null || layoutEl.clientWidth < compactAtWidth)
            ) {
              return
            }
            props.onCloseAside?.()
          }}
          onOpenAside={props.onOpenAside}
          open={props.open}
          setAsideEl={setAsideEl}
          setLayoutEl={setLayoutEl}
        >
          {props.children}
        </DesktopContentLayout>
      ) : isDesktop ? (
        <CompactContentLayout
          asideTitle={props.asideMobileTitle}
          className={props.className}
          mainClassName={props.mainClassName}
          onCloseAside={props.onCloseAside}
          open={props.open}
          setAsideEl={setAsideEl}
          setLayoutEl={setLayoutEl}
        >
          {props.children}
        </CompactContentLayout>
      ) : (
        <MobileContentLayout
          asideMobileSnap={props.asideMobileSnap}
          asideMobileTitle={props.asideMobileTitle}
          className={props.className}
          mainClassName={props.mainClassName}
          onCloseAside={props.onCloseAside}
          open={props.open}
          setAsideEl={setAsideEl}
          setLayoutEl={setLayoutEl}
        >
          {props.children}
        </MobileContentLayout>
      )}
    </ContentLayoutContext.Provider>
  )
}

function DesktopContentLayout(props: {
  asideDefaultSize?: number | string
  asideMaxSize?: number | string
  asideMinSize?: number | string
  children: ReactNode
  className?: string
  mainClassName?: string
  mainMinSize?: number | string
  onCloseAside?: () => void
  onOpenAside?: () => void
  open: boolean
  setAsideEl: (el: HTMLDivElement | null) => void
  setLayoutEl: (el: HTMLDivElement | null) => void
}) {
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const setLayoutEl = props.setLayoutEl
  const bindRoot = useCallback(
    (node: HTMLDivElement | null) => {
      setRootEl(node)
      setLayoutEl(node)
    },
    [setLayoutEl],
  )

  useLayoutEffect(() => {
    if (!rootEl) return
    const update = () => {
      const next = rootEl.clientWidth
      setContainerWidth((current) => (current === next ? current : next))
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(rootEl)
    return () => observer.disconnect()
  }, [rootEl])

  const minWidth = resolvePanelPx(props.asideMinSize, containerWidth, 280)
  const requestedMax = resolvePanelPx(
    props.asideMaxSize,
    containerWidth,
    containerWidth ? Math.round(containerWidth * 0.5) : 720,
  )
  const mainMin = resolvePanelPx(
    props.mainMinSize,
    containerWidth,
    containerWidth ? Math.round(containerWidth * 0.4) : 0,
  )
  const maxWidth = Math.max(
    minWidth,
    containerWidth
      ? Math.min(requestedMax, Math.max(minWidth, containerWidth - mainMin))
      : requestedMax,
  )
  const defaultWidth = Math.min(
    maxWidth,
    Math.max(
      minWidth,
      resolvePanelPx(props.asideDefaultSize, containerWidth, 450),
    ),
  )

  return (
    <div
      className={cn(lobeStyles.uc44c9ca6, props.className)}
      data-content-layout=""
      ref={bindRoot}
    >
      <div
        className={cn(
          lobeStyles.u9c9ac8dc,
          lobeStyles.main,
          props.mainClassName,
        )}
      >
        {props.children}
      </div>
      <DraggablePanel
        className={lobeStyles.panel}
        classNames={{ content: lobeStyles.panelContent }}
        collapseThreshold={Math.min(minWidth, 160)}
        defaultSize={{ width: defaultWidth }}
        expand={props.open}
        maxWidth={maxWidth}
        minWidth={minWidth}
        mode="fixed"
        onExpandChange={(expand) => {
          if (expand) props.onOpenAside?.()
          else props.onCloseAside?.()
        }}
        placement="right"
        showHandleWhenCollapsed
      >
        <div className={lobeStyles.u1098decd} ref={props.setAsideEl} />
      </DraggablePanel>
    </div>
  )
}

function CompactContentLayout(props: {
  asideTitle?: ReactNode
  children: ReactNode
  className?: string
  mainClassName?: string
  onCloseAside?: () => void
  open: boolean
  setAsideEl: (el: HTMLDivElement | null) => void
  setLayoutEl: (el: HTMLDivElement | null) => void
}) {
  return (
    <>
      <div
        className={cn(
          lobeStyles.ud557c16f,
          props.className,
          props.mainClassName,
        )}
        data-content-layout=""
        data-content-layout-mode="compact"
        ref={props.setLayoutEl}
      >
        {props.children}
      </div>
      <Drawer
        bodyClassName={lobeStyles.ua65ebe05}
        onClose={() => props.onCloseAside?.()}
        open={props.open}
        showHeader={false}
        title={props.asideTitle}
        widthClassName={lobeStyles.ud143f23b}
      >
        <div className={lobeStyles.u1098decd} ref={props.setAsideEl} />
      </Drawer>
    </>
  )
}

function MobileContentLayout(props: {
  asideMobileSnap?: BottomSheetSnap
  asideMobileTitle?: ReactNode
  children: ReactNode
  className?: string
  mainClassName?: string
  onCloseAside?: () => void
  open: boolean
  setAsideEl: (el: HTMLDivElement | null) => void
  setLayoutEl: (el: HTMLDivElement | null) => void
}) {
  const handleClose = () => {
    props.onCloseAside?.()
  }

  return (
    <>
      <div
        className={cn(
          lobeStyles.ud557c16f,
          props.className,
          props.mainClassName,
        )}
        data-content-layout=""
        data-content-layout-mode="mobile"
        ref={props.setLayoutEl}
      >
        {props.children}
      </div>
      <BottomSheet
        bodyClassName={lobeStyles.ua65ebe05}
        defaultSnap={props.asideMobileSnap ?? 'half'}
        onClose={handleClose}
        open={props.open}
        title={props.asideMobileTitle}
      >
        <div className={lobeStyles.u1098decd} ref={props.setAsideEl} />
      </BottomSheet>
    </>
  )
}

export function ContentLayoutSlot(props: {
  active: boolean
  children: ReactNode
  id: string
}) {
  const ctx = useContext(ContentLayoutContext)
  if (!ctx?.asideEl) return null

  return createPortal(
    <AnimatePresence>
      {props.active ? (
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className={lobeStyles.u1a0b7be3}
          exit={{ opacity: 0, x: -12 }}
          initial={{ opacity: 0, x: 16 }}
          key={props.id}
          transition={PANEL_FADE}
        >
          {props.children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    ctx.asideEl,
  )
}

export function AsidePanel(props: {
  bodyClassName?: string
  children: ReactNode
  footer?: ReactNode
  headerActions?: ReactNode
  icon?: LucideIcon
  onClose?: () => void
  title?: ReactNode
}) {
  const { t } = useI18n()
  const Icon = props.icon
  const hasHeader =
    props.title != null || props.headerActions != null || props.onClose != null

  return (
    <div className={lobeStyles.ud435703e}>
      {hasHeader ? (
        <div
          className={cn(lobeStyles.u5615bd9f, APP_SHELL_HEADER_HEIGHT_CLASS)}
        >
          <h2 className={lobeStyles.u2e014667}>
            {Icon ? (
              <Icon aria-hidden="true" className={lobeStyles.uc39c8d01} />
            ) : null}
            {props.title ? (
              <span className={lobeStyles.uf283ea9b}>{props.title}</span>
            ) : null}
          </h2>
          <div className={lobeStyles.u0a935cc3}>
            {props.headerActions}
            {props.onClose ? (
              <button
                aria-label={t('ui.modal.closeAria')}
                className={lobeStyles.u3be339ed}
                onClick={props.onClose}
                type="button"
              >
                <X aria-hidden="true" className={lobeStyles.uf7b5fa97} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={cn(lobeStyles.u1190fc46, props.bodyClassName)}>
        {props.children}
      </div>
      {props.footer ? (
        <div className={lobeStyles.u61cebfd1}>{props.footer}</div>
      ) : null}
    </div>
  )
}
