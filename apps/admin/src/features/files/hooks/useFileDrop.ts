import type { DragEvent } from 'react'
import { useRef, useState } from 'react'

export function useFileDrop(onFiles?: (files: File[]) => void) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)

  if (!onFiles) return { bind: {}, over: false }

  const bind = {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      if (!event.dataTransfer?.types.includes('Files')) return
      event.preventDefault()
      depth.current += 1
      setOver(true)
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setOver(false)
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      depth.current = 0
      setOver(false)
      const files = Array.from(event.dataTransfer?.files ?? [])
      if (files.length > 0) onFiles(files)
    },
  }

  return { bind, over }
}
