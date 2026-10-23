import { createStaticStyles } from '@lobehub/ui'
import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { uploadImageFile, useEditorView } from './editor-store'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ucc24a5d7: css`
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    border-radius: 1rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding-inline: 4rem;
    padding-block: 3rem;
    box-shadow: ${cssVar.boxShadow};
    transition-duration: 150ms;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  ufdfbb4cb: css`
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u4b735018: css`
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  ub82230f8: css`
    pointer-events: none;
    position: absolute;
    inset: 0px;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(
      in srgb,
      ${cssVar.colorBgContainer} 60%,
      transparent
    );
    backdrop-filter: blur(12px);
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 70%,
        transparent
      );
    }
  `,
}))

const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
  while (el) {
    const style = getComputedStyle(el)
    const overflowY = style.overflowY
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight
    ) {
      return el
    }
    el = el.parentElement
  }
  return null
}

export function ImageDropZone() {
  const view = useEditorView()
  const [isDragging, setIsDragging] = useState(false)
  const [teleportTarget, setTeleportTarget] = useState<HTMLElement | null>(null)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    if (!view) {
      setTeleportTarget(null)
      return
    }

    const hasImageFile = (dataTransfer: DataTransfer | null) => {
      if (!dataTransfer?.items) return false
      for (const item of dataTransfer.items) {
        if (item.type.startsWith('image/')) return true
      }
      return false
    }

    const handleDrop = (event: DragEvent) => {
      dragCounterRef.current = 0
      setIsDragging(false)

      const files = event.dataTransfer?.files
      if (!files || files.length === 0) return

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/'),
      )

      if (imageFiles.length > 0) {
        event.preventDefault()
        event.stopPropagation()
        imageFiles.forEach((file) => uploadImageFile(file))
      }
    }

    const handleDragOver = (event: DragEvent) => {
      if (hasImageFile(event.dataTransfer)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleDragEnter = (event: DragEvent) => {
      if (hasImageFile(event.dataTransfer)) {
        event.preventDefault()
        dragCounterRef.current++
        setIsDragging(true)
      }
    }

    const handleDragLeave = () => {
      dragCounterRef.current--
      if (dragCounterRef.current === 0) setIsDragging(false)
    }

    view.dom.addEventListener('drop', handleDrop)
    view.dom.addEventListener('dragover', handleDragOver)
    view.dom.addEventListener('dragenter', handleDragEnter)
    view.dom.addEventListener('dragleave', handleDragLeave)

    const scrollContainer = findScrollableParent(view.dom)
    setTeleportTarget(scrollContainer)

    return () => {
      view.dom.removeEventListener('drop', handleDrop)
      view.dom.removeEventListener('dragover', handleDragOver)
      view.dom.removeEventListener('dragenter', handleDragEnter)
      view.dom.removeEventListener('dragleave', handleDragLeave)
    }
  }, [view])

  if (!isDragging || !teleportTarget) return null

  const overlay = (
    <div className={lobeStyles.ub82230f8}>
      <div className={lobeStyles.ucc24a5d7}>
        <Upload
          width={48}
          height={48}
          strokeWidth={1.5}
          className={lobeStyles.ufdfbb4cb}
        />
        <span className={lobeStyles.u4b735018}>松开以上传图片</span>
      </div>
    </div>
  )

  return createPortal(overlay, teleportTarget)
}
