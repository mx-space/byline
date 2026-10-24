import type { CodeBlockRendererProps } from '@haklex/rich-editor/renderers'
import { CodeBlockEditRenderer } from '@haklex/rich-renderer-codeblock'
import { Highlighter } from '@lobehub/ui'
import { useEffect, useRef, useState } from 'react'

export function LobeCodeBlockRenderer({
  code,
  language,
}: CodeBlockRendererProps) {
  return (
    <Highlighter
      fullFeatured
      language={language || 'plaintext'}
      variant="filled"
    >
      {code}
    </Highlighter>
  )
}

export function LobeCodeBlockEditRenderer(props: CodeBlockRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (props.selected) setEditing(true)
  }, [props.selected])

  useEffect(() => {
    if (!props.editable) setEditing(false)
  }, [props.editable])

  useEffect(() => {
    const node = rootRef.current
    if (!editing || !node) return
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (next instanceof Node && node.contains(next)) return
      setEditing(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && node.contains(event.target)) return
      setEditing(false)
    }
    node.addEventListener('focusout', onFocusOut)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      node.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [editing])

  if (editing) {
    return (
      <div ref={rootRef}>
        <CodeBlockEditRenderer {...props} selected />
      </div>
    )
  }

  return (
    <div
      onMouseDown={(event) => {
        if (!props.editable) return
        const target = event.target
        if (target instanceof Element && target.closest('button')) return
        setEditing(true)
      }}
    >
      <LobeCodeBlockRenderer {...props} />
    </div>
  )
}
