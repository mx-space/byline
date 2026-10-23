import { createStaticStyles } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import type { ReactNode } from 'react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { useI18n } from '~/i18n'
import { PortalLayerScope, useFloatingZ } from '~/ui/feedback/portal-layer'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u99d72c7f: css`
    display: none;
  `,
  ub49312df: css`
    position: fixed;
    inset: 0px;
  `,
  u44ea555a: css`
    position: absolute;
    inset: 0px;
    background-color: ${cssVar.colorBgMask};
  `,
  u1eda740d: css`
    outline: none;
    position: absolute;
    inset-inline: 0px;
    bottom: 0px;
  `,
  u116fb498: css`
    box-shadow: ${cssVar.boxShadow};
    display: flex;
    height: 100%;
    width: 100%;
    flex-direction: column;
    background-color: ${cssVar.colorBgContainer};
    will-change: transform;
  `,
  u5e5a4e2d: css`
    display: flex;
    height: 2.25rem;
    flex-shrink: 0;
    cursor: grab;
    touch-action: none;
    align-items: center;
    justify-content: center;
    &:active {
      cursor: grabbing;
    }
  `,
  u615f067c: css`
    height: 0.375rem;
    width: 2.5rem;
    border-radius: 999px;
    background-color: ${cssVar.colorBorder};
  `,
  u2093353d: css`
    display: flex;
    height: 3rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
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
  u61629050: css`
    display: flex;
    min-height: 0px;
    flex: 1 1 0%;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
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

export type BottomSheetSnap = 'half' | 'full'
type SheetState = BottomSheetSnap | 'closed'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  icon?: LucideIcon
  headerActions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  bodyClassName?: string
  className?: string
  defaultSnap?: BottomSheetSnap
  snap?: BottomSheetSnap
  onSnapChange?: (snap: BottomSheetSnap) => void
}

// iOS-like critically-damped-ish spring. Validated in interactive prototype v2
// (see docs/superpowers/specs/2026-05-29-admin-bottom-sheet-ios-redesign-design.md §4.3).
const STIFFNESS = 400
const DAMPING = 40
const PROJECTION_SECONDS = 0.2
const CLOSE_FLING = 1500
const FULL_FLING = -1200
const RUBBER_UP = 0.06
const SAFE_TOP_MIN = 12
const BODY_DRAG_THRESHOLD = 6
const SETTLE_EPS_V = 0.5
const SETTLE_EPS_Y = 0.3
const DT_CLAMP = 0.032

export const SNAP_HEIGHT: Record<BottomSheetSnap, string> = {
  half: 'min(62dvh, calc(100dvh - 12px))',
  full: 'calc(100dvh - max(env(safe-area-inset-top), 12px))',
}

interface DetentMetrics {
  TY_FULL: number
  TY_HALF: number
  TY_CLOSED: number
}

export function resolveDetent(
  ty: number,
  vy: number,
  currentSnap: SheetState,
  m: DetentMetrics,
): SheetState {
  if (vy > CLOSE_FLING) return 'closed'
  if (vy < FULL_FLING && currentSnap !== 'closed') return 'full'

  const projected = ty + vy * PROJECTION_SECONDS
  const candidates: Array<[SheetState, number]> = [
    ['closed', m.TY_CLOSED],
    ['half', m.TY_HALF],
    ['full', m.TY_FULL],
  ]
  let best = candidates[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const c of candidates) {
    const d = Math.abs(projected - c[1])
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best[0]
}

function computeMetrics(viewportH: number): DetentMetrics {
  const safeTop = Math.max(SAFE_TOP_MIN, 12)
  const fullH = viewportH - safeTop
  const halfH = Math.min(viewportH * 0.62, viewportH - SAFE_TOP_MIN)
  return {
    TY_FULL: 0,
    TY_HALF: fullH - halfH,
    TY_CLOSED: fullH + 24,
  }
}

interface UseSheetEngineOpts {
  open: boolean
  activeSnap: BottomSheetSnap
  onClose: () => void
  onSnapResolved: (next: BottomSheetSnap) => void
}

function useSheetEngine(opts: UseSheetEngineOpts) {
  const [mounted, setMounted] = useState(false)
  const ty = useMotionValue(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  const stateRef = useRef({
    snap: 'closed' as SheetState,
    target: 0,
    vy: 0,
    metrics: computeMetrics(0),
    rafId: 0,
    lastT: 0,
    onSettled: undefined as (() => void) | undefined,
    dragOrigin: null as 'grabber' | 'body' | null,
    dragging: false,
    dragStartClientY: 0,
    dragStartTy: 0,
    lastPointerClientY: 0,
    lastPointerTime: 0,
  })
  const onCloseRef = useRef(opts.onClose)
  onCloseRef.current = opts.onClose
  const onSnapResolvedRef = useRef(opts.onSnapResolved)
  onSnapResolvedRef.current = opts.onSnapResolved

  useEffect(() => {
    if (opts.open) setMounted(true)
  }, [opts.open])

  useEffect(() => {
    if (!mounted) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mounted])

  useLayoutEffect(() => {
    if (!mounted) return
    const measure = () => {
      const st = stateRef.current
      st.metrics = computeMetrics(window.innerHeight)
      if (st.snap === 'half') st.target = st.metrics.TY_HALF
      else if (st.snap === 'full') st.target = st.metrics.TY_FULL
      else st.target = st.metrics.TY_CLOSED
      ty.set(ty.get())
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [mounted, ty])

  const runSpring = useCallback(() => {
    const st = stateRef.current
    cancelAnimationFrame(st.rafId)
    st.lastT = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(DT_CLAMP, (now - st.lastT) / 1000)
      st.lastT = now
      const cur = ty.get()
      const a = -STIFFNESS * (cur - st.target) - DAMPING * st.vy
      st.vy += a * dt
      const next = cur + st.vy * dt
      ty.set(next)
      if (
        Math.abs(st.vy) < SETTLE_EPS_V &&
        Math.abs(next - st.target) < SETTLE_EPS_Y
      ) {
        ty.set(st.target)
        st.vy = 0
        const cb = st.onSettled
        st.onSettled = undefined
        cb?.()
        return
      }
      st.rafId = requestAnimationFrame(tick)
    }
    st.rafId = requestAnimationFrame(tick)
  }, [ty])

  const setSnapTarget = useCallback(
    (next: SheetState) => {
      const st = stateRef.current
      st.snap = next
      const m = st.metrics
      if (next === 'closed') {
        st.target = m.TY_CLOSED
        st.onSettled = () => setMounted(false)
        runSpring()
        return
      }
      st.target = next === 'full' ? m.TY_FULL : m.TY_HALF
      st.onSettled = undefined
      runSpring()
    },
    [runSpring],
  )

  useEffect(() => {
    if (!mounted) return
    const st = stateRef.current
    if (!opts.open) {
      setSnapTarget('closed')
      return
    }
    if (st.snap === 'closed') {
      ty.set(st.metrics.TY_CLOSED)
      st.vy = 0
    }
    setSnapTarget(opts.activeSnap)
  }, [mounted, opts.open, opts.activeSnap, setSnapTarget, ty])

  const beginDrag = useCallback(
    (clientY: number) => {
      const st = stateRef.current
      cancelAnimationFrame(st.rafId)
      st.dragStartClientY = clientY
      st.dragStartTy = ty.get()
      st.lastPointerClientY = clientY
      st.lastPointerTime = performance.now()
      st.vy = 0
    },
    [ty],
  )

  const onGrabberPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (stateRef.current.snap === 'closed') return
      stateRef.current.dragOrigin = 'grabber'
      stateRef.current.dragging = true
      beginDrag(event.clientY)
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    },
    [beginDrag],
  )

  const onBodyPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const body = bodyRef.current
      if (!body || stateRef.current.snap === 'closed') return
      if (body.scrollTop > 0) return
      stateRef.current.dragOrigin = 'body'
      stateRef.current.dragging = false
      beginDrag(event.clientY)
    },
    [beginDrag],
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const st = stateRef.current
      if (!st.dragOrigin) return
      const dy = event.clientY - st.dragStartClientY
      if (!st.dragging && st.dragOrigin === 'body') {
        if (dy < BODY_DRAG_THRESHOLD) return
        const body = bodyRef.current
        if (!body || body.scrollTop > 0) {
          st.dragOrigin = null
          return
        }
        st.dragging = true
        if (event.currentTarget instanceof Element) {
          event.currentTarget.setPointerCapture(event.pointerId)
        }
      }
      const now = performance.now()
      const dt = (now - st.lastPointerTime) / 1000
      if (dt > 0) st.vy = (event.clientY - st.lastPointerClientY) / dt
      st.lastPointerClientY = event.clientY
      st.lastPointerTime = now
      ty.set(st.dragStartTy + dy)
      event.preventDefault()
    },
    [ty],
  )

  const endDrag = useCallback(() => {
    const st = stateRef.current
    if (!st.dragOrigin) return
    const wasDragging = st.dragging
    st.dragOrigin = null
    st.dragging = false
    if (!wasDragging) return
    const next = resolveDetent(ty.get(), st.vy, st.snap, st.metrics)
    if (next === 'closed') {
      onCloseRef.current()
    } else {
      onSnapResolvedRef.current(next)
      setSnapTarget(next)
    }
  }, [setSnapTarget, ty])

  const scrimOpacity = useTransform(ty, (cur) => {
    const m = stateRef.current.metrics
    const visual =
      cur < m.TY_FULL ? m.TY_FULL + (cur - m.TY_FULL) * RUBBER_UP : cur
    const range = m.TY_CLOSED - m.TY_FULL
    if (range <= 0) return 0
    const r = Math.min(1, Math.max(0, (visual - m.TY_FULL) / range))
    return 0.35 * (1 - r)
  })
  const cornerRadius = useTransform(ty, (cur) => {
    const m = stateRef.current.metrics
    const past = Math.max(0, cur - m.TY_FULL)
    const fullProx = Math.max(0, 1 - past / 60)
    return 24 - 8 * fullProx
  })
  const visualY = useTransform(ty, (cur) => {
    const m = stateRef.current.metrics
    return cur < m.TY_FULL ? m.TY_FULL + (cur - m.TY_FULL) * RUBBER_UP : cur
  })
  // At the half detent the sheet keeps its full height and is translated down,
  // so its lower edge sits off-screen. Pad the scroll body by the same offset
  // or the end of the content can never be scrolled into view.
  const offscreenPad = useTransform(
    visualY,
    (cur) =>
      `calc(env(safe-area-inset-bottom) + ${Math.max(0, Math.round(cur))}px)`,
  )

  return {
    mounted,
    bodyRef,
    offscreenPad,
    visualY,
    scrimOpacity,
    cornerRadius,
    setSnapTarget,
    onGrabberPointerDown,
    onBodyPointerDown,
    onPointerMove,
    endDrag,
  }
}

export function BottomSheet(props: BottomSheetProps) {
  const { t } = useI18n()
  const Icon = props.icon
  const titleId = useId()
  const { z, depth } = useFloatingZ('drawer')

  const isControlled = props.snap !== undefined
  const [internalSnap, setInternalSnap] = useState<BottomSheetSnap>(
    props.defaultSnap ?? 'half',
  )
  const activeSnap: BottomSheetSnap = props.snap ?? internalSnap

  const reportSnap = useCallback(
    (next: BottomSheetSnap) => {
      if (!isControlled) setInternalSnap(next)
      props.onSnapChange?.(next)
    },
    [isControlled, props],
  )

  const engine = useSheetEngine({
    open: props.open,
    activeSnap,
    onClose: props.onClose,
    onSnapResolved: reportSnap,
  })

  const toggleSnap = useCallback(() => {
    const next: BottomSheetSnap = activeSnap === 'half' ? 'full' : 'half'
    reportSnap(next)
    engine.setSnapTarget(next)
  }, [activeSnap, reportSnap, engine])

  if (typeof document === 'undefined') return null
  if (!engine.mounted) return null

  return createPortal(
    <PortalLayerScope depth={depth}>
      <div
        aria-hidden={false}
        className={lobeStyles.ub49312df}
        style={{ zIndex: z }}
      >
        <motion.div
          aria-hidden="true"
          className={lobeStyles.u44ea555a}
          data-testid="bottom-sheet-scrim"
          onClick={props.onClose}
          style={{ opacity: engine.scrimOpacity }}
        />
        <div
          aria-labelledby={props.title ? titleId : undefined}
          aria-modal="true"
          className={lobeStyles.u1eda740d}
          data-snap={activeSnap}
          role="dialog"
          style={{ height: SNAP_HEIGHT.full }}
        >
          <motion.div
            className={cn(lobeStyles.u116fb498, props.className)}
            style={{
              paddingBottom: engine.offscreenPad,
              y: engine.visualY,
              borderTopLeftRadius: engine.cornerRadius,
              borderTopRightRadius: engine.cornerRadius,
            }}
          >
            <button
              aria-label={
                activeSnap === 'half'
                  ? t('ui.bottomSheet.expand')
                  : t('ui.bottomSheet.collapse')
              }
              className={lobeStyles.u5e5a4e2d}
              onClick={toggleSnap}
              onPointerCancel={engine.endDrag}
              onPointerDown={engine.onGrabberPointerDown}
              onPointerMove={engine.onPointerMove}
              onPointerUp={engine.endDrag}
              type="button"
            >
              <div className={lobeStyles.u615f067c} />
            </button>
            {props.title != null || props.headerActions != null ? (
              <div className={lobeStyles.u2093353d}>
                <h2 className={lobeStyles.u2e014667} id={titleId}>
                  {Icon ? (
                    <Icon aria-hidden="true" className={lobeStyles.uc39c8d01} />
                  ) : null}
                  {props.title ? (
                    <span className={lobeStyles.uf283ea9b}>{props.title}</span>
                  ) : null}
                </h2>
                <div className={lobeStyles.u0a935cc3}>
                  {props.headerActions}
                </div>
              </div>
            ) : null}
            <motion.div
              className={cn(lobeStyles.u61629050, props.bodyClassName)}
              onPointerCancel={engine.endDrag}
              onPointerDown={engine.onBodyPointerDown}
              onPointerMove={engine.onPointerMove}
              onPointerUp={engine.endDrag}
              ref={engine.bodyRef}
            >
              {props.children}
            </motion.div>
            {props.footer ? (
              <div className={lobeStyles.u61cebfd1}>{props.footer}</div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </PortalLayerScope>,
    document.body,
  )
}
