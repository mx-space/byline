import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-ext-nested-doc/style.css'
import '../core/style'

import type {
  AgentExecutorPlugin,
  AgentStore,
  AgentToolConfig,
  ChatMessage,
  LLMProvider,
} from '@haklex/rich-agent-core'
import { DialogStackProvider } from '@haklex/rich-editor-ui'
import {
  AgentAskAIAction,
  AgentDiffEditNode,
  AgentSelectionPinPlugin,
  DiffReviewOverlayPlugin,
} from '@haklex/rich-ext-ai-agent'
import { ExcalidrawConfigProvider } from '@haklex/rich-ext-excalidraw'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
  NestedDocPlugin,
} from '@haklex/rich-ext-nested-doc'
import { ImageEditModalPlugin } from '@haklex/rich-plugin-image-editor'
import type { LexicalEditor } from 'lexical'
import { useContext, useRef } from 'react'
import { createPortal } from 'react-dom'

import { imageGpsPrivacy } from '~/lib/image-upload-privacy'

import type { RichEditorProps } from '../core'
import { RichEditor } from '../core'
import type {
  AgentLitexmlRegistryProvider,
  AgentLoopHandle,
  SaveExcalidrawSnapshot,
} from '../types'
import { AgentLoopCapture } from './AgentLoopCapture'
import { EditorToolbar } from './EditorToolbar'
import { NestedDocDialogEditor } from './NestedDocDialogEditor'
import { EditorToolbarSlotContext } from './toolbar-slot'

export interface ReactEditorPaneProps {
  editorProps: Omit<RichEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  store: AgentStore
  provider: LLMProvider | null
  saveExcalidrawSnapshot: SaveExcalidrawSnapshot
  apiUrl: string
  onChange?: RichEditorProps['onChange']
  onSubmit?: RichEditorProps['onSubmit']
  onEditorReady?: (editor: LexicalEditor | null) => void
  onAgentLoopReady: (loop: AgentLoopHandle | null) => void
  onPinSelection?: () => void
  injectDocumentXml?: boolean
  plugins?: AgentExecutorPlugin[]
  tools?: AgentToolConfig[]
  toolSystemRole?: string | false
  litexmlRegistry?: AgentLitexmlRegistryProvider
  systemMessages?: ChatMessage[]
}

export function ReactEditorPane({
  editorProps,
  store,
  provider,
  saveExcalidrawSnapshot,
  apiUrl,
  onChange,
  onSubmit,
  onEditorReady,
  onAgentLoopReady,
  onPinSelection,
  injectDocumentXml,
  plugins,
  tools,
  toolSystemRole,
  litexmlRegistry,
  systemMessages,
}: ReactEditorPaneProps) {
  const editorRef = useRef<LexicalEditor | null>(null)
  const toolbarSlot = useContext(EditorToolbarSlotContext)

  const handleEditorReady = (editor: LexicalEditor | null) => {
    editorRef.current = editor
    onEditorReady?.(editor)
  }

  return (
    <NestedDocDialogEditorProvider value={NestedDocDialogEditor}>
      <DialogStackProvider>
        <ExcalidrawConfigProvider
          saveSnapshot={saveExcalidrawSnapshot}
          apiUrl={apiUrl}
        >
          <RichEditor
            {...editorProps}
            extraNodes={[
              ...(editorProps.extraNodes || []),
              ...nestedDocEditNodes,
              AgentDiffEditNode,
            ]}
            header={
              toolbarSlot ? (
                createPortal(<EditorToolbar />, toolbarSlot)
              ) : (
                <EditorToolbar />
              )
            }
            floatingToolbarActions={
              provider ? <AgentAskAIAction onPin={onPinSelection} /> : undefined
            }
            onChange={onChange}
            onSubmit={onSubmit}
            onEditorReady={handleEditorReady}
          >
            <DiffReviewOverlayPlugin store={store} />
            {provider ? <AgentSelectionPinPlugin store={store} /> : null}
            <AgentLoopCapture
              editorRef={editorRef}
              injectDocumentXml={injectDocumentXml}
              onAgentLoopReady={onAgentLoopReady}
              plugins={plugins}
              provider={provider}
              store={store}
              tools={tools}
              toolSystemRole={toolSystemRole}
              litexmlRegistry={litexmlRegistry}
              systemMessages={systemMessages}
            />
            <NestedDocPlugin />
            <ImageEditModalPlugin privacy={imageGpsPrivacy} />
          </RichEditor>
        </ExcalidrawConfigProvider>
      </DialogStackProvider>
    </NestedDocDialogEditorProvider>
  )
}
