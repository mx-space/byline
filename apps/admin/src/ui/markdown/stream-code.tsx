import type { StreamdownProps } from '@lobehub/streamdown'
import { Highlighter } from '@lobehub/ui'
import { isValidElement, type ReactNode } from 'react'

function textContent(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textContent(node.props.children)
  }
  return ''
}

function fenceLanguage(children: ReactNode) {
  const child = Array.isArray(children) ? children[0] : children
  const className = isValidElement<{ className?: string }>(child)
    ? child.props.className
    : undefined
  return className?.match(/language-([\w#+.-]+)/)?.[1] ?? 'plaintext'
}

export const streamCodeComponents: NonNullable<StreamdownProps['components']> =
  {
    pre({ children }) {
      return (
        <Highlighter language={fenceLanguage(children)} variant="filled">
          {textContent(children).replace(/\n$/, '')}
        </Highlighter>
      )
    },
  }
