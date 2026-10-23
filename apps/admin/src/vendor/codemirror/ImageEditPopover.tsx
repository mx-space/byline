import { createStaticStyles } from '@lobehub/ui'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

import { hideImagePopover, useImagePopoverState } from './image-popover-state'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u99d72c7f: css`
    display: none;
  `,
  u6ed543e2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.75rem;
    }
  `,
  uda7c36cd: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.25rem;
    }
  `,
  u3090c200: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ud27e9536: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  uff7dcd57: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorError};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      color: ${cssVar.colorError};
    }
  `,
  u6cfc7e6a: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
}))

interface PopoverData {
  alt: string
  url: string
  matchStart: number
  matchEnd: number
}

function readPopoverData(el: HTMLElement | null): PopoverData | null {
  if (!el) return null
  return {
    alt: el.dataset.alt || '',
    url: el.dataset.url || '',
    matchStart: Number(el.dataset.matchStart),
    matchEnd: Number(el.dataset.matchEnd),
  }
}

export function ImageEditPopover() {
  const { visible, targetEl, view } = useImagePopoverState()
  const [alt, setAlt] = useState('')
  const [url, setUrl] = useState('')
  const [style, setStyle] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  })
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const altInputRef = useRef<HTMLInputElement | null>(null)
  const dataRef = useRef<PopoverData | null>(null)

  dataRef.current = readPopoverData(targetEl)

  useEffect(() => {
    const data = dataRef.current
    if (visible && data) {
      setAlt(data.alt)
      setUrl(data.url)
      document.body.style.pointerEvents = 'none'
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        altInputRef.current?.focus()
      })
    } else {
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }
  }, [visible])

  useLayoutEffect(() => {
    if (!visible || !targetEl || !popoverRef.current) return
    const rect = targetEl.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = rect.left
    let top = rect.bottom + 8

    if (left + popoverRect.width > vw - 16) {
      left = vw - popoverRect.width - 16
    }
    if (left < 16) left = 16

    if (top + popoverRect.height > vh - 16) {
      top = rect.top - popoverRect.height - 8
    }

    setStyle({ left, top })
  }, [visible, targetEl])

  if (!visible || !targetEl) return null
  if (typeof document === 'undefined') return null

  const handleSave = () => {
    const data = dataRef.current
    if (!data || !view) return
    const newMarkdown = `![${alt}](${url})`
    view.dispatch({
      changes: {
        from: data.matchStart,
        to: data.matchEnd,
        insert: newMarkdown,
      },
    })
    hideImagePopover()
  }

  const handleCancel = () => hideImagePopover()

  const handleDelete = () => {
    const data = dataRef.current
    if (!data || !view) return
    const doc = view.state.doc
    const line = doc.lineAt(data.matchStart)
    const lineText = line.text.trim()
    const imageMarkdown = doc.sliceString(data.matchStart, data.matchEnd)
    const isOnlyContentOnLine = lineText === imageMarkdown.trim()
    if (isOnlyContentOnLine) {
      view.dispatch({
        changes: {
          from: line.from,
          to: Math.min(line.to + 1, doc.length),
          insert: '',
        },
      })
    } else {
      view.dispatch({
        changes: { from: data.matchStart, to: data.matchEnd, insert: '' },
      })
    }
    hideImagePopover()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const overlay = (
    <>
      <div className="cm-image-edit-overlay" onClick={handleCancel} />
      <div
        ref={popoverRef}
        className="cm-image-edit-popover"
        style={{ left: `${style.left}px`, top: `${style.top}px` }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={lobeStyles.u6ed543e2}>
          <div className={lobeStyles.uda7c36cd}>
            <label className={lobeStyles.u3090c200}>Alt 文本</label>
            <TextInput
              ref={altInputRef}
              onChange={setAlt}
              placeholder="图片描述"
              value={alt}
            />
          </div>
          <div className={lobeStyles.uda7c36cd}>
            <label className={lobeStyles.u3090c200}>URL</label>
            <TextInput onChange={setUrl} placeholder="图片地址" value={url} />
          </div>
          <div className={lobeStyles.ud27e9536}>
            <button
              type="button"
              className={lobeStyles.uff7dcd57}
              onClick={handleDelete}
            >
              删除
            </button>
            <div className={lobeStyles.u6cfc7e6a}>
              <Button variant="subtle" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(overlay, document.body)
}
