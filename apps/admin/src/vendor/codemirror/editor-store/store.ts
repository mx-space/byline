import type { EditorView } from '@codemirror/view'
import { subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import type { StateCreator } from 'zustand/vanilla'

import { flattenActions } from '~/store/utils/flatten-actions'

import type { EditorStoreAction } from './action'
import { createEditorStoreSlice } from './action'
import type { EditorStoreState } from './initial-state'
import { initialEditorStoreState } from './initial-state'

export interface EditorStore extends EditorStoreState, EditorStoreAction {}

const createStore: StateCreator<EditorStore> = (...params) => ({
  ...initialEditorStoreState,
  ...flattenActions<EditorStoreAction>([createEditorStoreSlice(...params)]),
})

export const useEditorStore = createWithEqualityFn<EditorStore>()(
  subscribeWithSelector(createStore),
  shallow,
)

export const getEditorStoreState = () => useEditorStore.getState()

/* Imperative wrappers that keep the prior module-level API. */

export const setEditorView = (view: EditorView | undefined): void =>
  useEditorStore.getState().setEditorView(view)

export const getEditorView = (): EditorView | undefined =>
  useEditorStore.getState().editorView

export const useEditorView = (): EditorView | undefined =>
  useEditorStore((s) => s.editorView)

export const setEditorValue = (value: string): void =>
  useEditorStore.getState().setEditorValue(value)

export const focusEditor = (): void => useEditorStore.getState().focusEditor()

export const uploadImageFile = (file: File): Promise<void> =>
  useEditorStore.getState().uploadImageFile(file)
