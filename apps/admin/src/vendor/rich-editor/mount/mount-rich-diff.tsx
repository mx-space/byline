import '@haklex/rich-diff/style.css'

import { RichDiff } from '@haklex/rich-diff'
import { codeSnippetNodes } from '@haklex/rich-ext-code-snippet/static'
import { embedNodes } from '@haklex/rich-ext-embed/static'
import { ExcalidrawNode } from '@haklex/rich-ext-excalidraw/static'
import { galleryNodes } from '@haklex/rich-ext-gallery/static'
import { nestedDocNodes } from '@haklex/rich-ext-nested-doc/static'
import type { SerializedEditorState } from 'lexical'
import { createRoot } from 'react-dom/client'

import { enhancedRendererConfig } from '../core'

const extraNodes = [
  ExcalidrawNode,
  ...embedNodes,
  ...galleryNodes,
  ...codeSnippetNodes,
  ...nestedDocNodes,
]

export interface MountRichDiffOptions {
  oldValue: SerializedEditorState
  newValue: SerializedEditorState
  variant?: 'article' | 'comment' | 'note'
  className?: string
  theme: 'dark' | 'light'
}

export interface RichDiffHandle {
  update: (opts: MountRichDiffOptions) => void
  unmount: () => void
}

export function mountRichDiff(
  container: HTMLElement,
  initial: MountRichDiffOptions,
): RichDiffHandle {
  const root = createRoot(container)

  const render = (opts: MountRichDiffOptions) => {
    root.render(
      <RichDiff
        oldValue={opts.oldValue}
        newValue={opts.newValue}
        variant={opts.variant}
        theme={opts.theme}
        className={opts.className}
        extraNodes={extraNodes}
        rendererConfig={enhancedRendererConfig}
      />,
    )
  }

  render(initial)

  return {
    update(opts) {
      render(opts)
    },
    unmount() {
      root.unmount()
    },
  }
}
