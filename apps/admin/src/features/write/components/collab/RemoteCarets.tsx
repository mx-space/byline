import * as stylex from '@stylexjs/stylex'
import type { LexicalEditor, NodeKey } from 'lexical'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import type { CaretPoint, RemotePresence } from '../../crdt/collab-presence'
import { type PeersSource, usePeers } from '../../crdt/peers-store'

const styles = stylex.create({
  layer: {
    pointerEvents: 'none',
  },
  selection: {
    position: 'absolute',
    zIndex: 40,
    opacity: 0.2,
  },
  caret: {
    position: 'absolute',
    zIndex: 50,
    transitionProperty: 'left, top',
    transitionDuration: '100ms',
    transitionTimingFunction: 'ease-out',
  },
  bar: {
    width: 2,
    height: '100%',
    borderRadius: 9999,
  },
  label: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 2,
    paddingBlock: 1,
    paddingInline: 4,
    borderRadius: 2,
    color: '#fff',
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
  },
  box: (box: Box) => ({
    height: box.height,
    left: box.left,
    top: box.top,
    width: box.width,
  }),
  at: (left: number, top: number, height: number) => ({
    height,
    left,
    top,
  }),
  tint: (color: string) => ({
    backgroundColor: color,
  }),
})

type Resolve = (point: CaretPoint) => { key: NodeKey; offset: number } | null

interface Box {
  height: number
  left: number
  top: number
  width: number
}

interface DrawnPeer {
  caret: Box
  color: string
  key: string
  name: string
  selection: Box[]
}

const domPoint = (
  editor: LexicalEditor,
  point: { key: NodeKey; offset: number },
): { node: Node; offset: number } | null => {
  const element = editor.getElementByKey(point.key)
  if (!element) return null
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const text = walker.nextNode() as Text | null
  if (!text) return { node: element, offset: 0 }
  return { node: text, offset: Math.min(point.offset, text.length) }
}

const relative = (rect: DOMRect, origin: DOMRect, frame: HTMLElement): Box => ({
  height: rect.height,
  left: rect.left - origin.left + frame.scrollLeft,
  top: rect.top - origin.top + frame.scrollTop,
  width: rect.width,
})

const measure = (
  editor: LexicalEditor,
  frame: HTMLElement,
  peer: RemotePresence,
  resolve: Resolve,
): DrawnPeer | null => {
  const focusPoint = peer.focus && resolve(peer.focus)
  const focus = focusPoint && domPoint(editor, focusPoint)
  if (!focus) return null
  const origin = frame.getBoundingClientRect()
  const range = document.createRange()
  range.setStart(focus.node, focus.offset)
  range.collapse(true)
  const caretRect =
    range.getClientRects()[0] ??
    (focus.node instanceof Element
      ? focus.node.getBoundingClientRect()
      : range.getBoundingClientRect())

  const selection: Box[] = []
  const anchorPoint = peer.anchor && resolve(peer.anchor)
  const anchor = anchorPoint && domPoint(editor, anchorPoint)
  if (anchor) {
    const span = document.createRange()
    span.setStart(anchor.node, anchor.offset)
    span.setEnd(focus.node, focus.offset)
    if (span.collapsed) {
      span.setStart(focus.node, focus.offset)
      span.setEnd(anchor.node, anchor.offset)
    }
    for (const rect of span.getClientRects()) {
      if (rect.width > 0) selection.push(relative(rect, origin, frame))
    }
  }

  return {
    caret: relative(caretRect, origin, frame),
    color: peer.color,
    key: peer.key,
    name: peer.user.name,
    selection,
  }
}

export function RemoteCarets(props: {
  editor: LexicalEditor | null
  peers: PeersSource
  resolveCaret: Resolve
}) {
  const { editor, resolveCaret } = props
  const peers = usePeers(props.peers)
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  const [drawn, setDrawn] = useState<DrawnPeer[]>([])

  useEffect(() => {
    if (!editor) return
    return editor.registerRootListener((rootElement) => {
      const parent = rootElement?.parentElement ?? null
      if (parent && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative'
      }
      setFrame(parent)
    })
  }, [editor])

  useEffect(() => {
    if (!editor || !frame) {
      setDrawn([])
      return
    }
    const update = () =>
      setDrawn(
        peers
          .map((peer) => measure(editor, frame, peer, resolveCaret))
          .filter((peer): peer is DrawnPeer => peer !== null),
      )
    update()
    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    const offUpdate = editor.registerUpdateListener(schedule)
    const resize = new ResizeObserver(schedule)
    resize.observe(frame)
    return () => {
      cancelAnimationFrame(raf)
      offUpdate()
      resize.disconnect()
    }
  }, [editor, frame, peers, resolveCaret])

  if (!frame || !drawn.length) return null

  return createPortal(
    <>
      {drawn.map((peer) => (
        <div aria-hidden key={peer.key} {...stylex.props(styles.layer)}>
          {peer.selection.map((box, index) => (
            <div
              key={index}
              {...stylex.props(
                styles.selection,
                styles.box(box),
                styles.tint(peer.color),
              )}
            />
          ))}
          <div
            {...stylex.props(
              styles.caret,
              styles.at(
                peer.caret.left,
                peer.caret.top,
                peer.caret.height || 18,
              ),
            )}
          >
            <div {...stylex.props(styles.bar, styles.tint(peer.color))} />
            <span
              data-remote-caret={peer.key}
              {...stylex.props(styles.label, styles.tint(peer.color))}
            >
              {peer.name}
            </span>
          </div>
        </div>
      ))}
    </>,
    frame,
  )
}
