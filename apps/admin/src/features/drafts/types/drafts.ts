export interface DiffRendererInstance {
  cleanUp: () => void
  render: (props: {
    containerWrapper: HTMLElement
    newFile: { contents: string; name: string }
    oldFile: { contents: string; name: string }
  }) => boolean | void
}

export interface DraftDiffStats {
  delta: number
  isSame: boolean
}
