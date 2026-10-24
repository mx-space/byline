// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { findStaleLegacyFiles, readLegacyFiles, scanAdmin } from '.'

describe('legacyFiles.json', () => {
  it('lists only files that still import emotion styles', () => {
    expect(findStaleLegacyFiles(scanAdmin())).toEqual([])
  })

  it('stays sorted so pruning diffs only remove lines', () => {
    const legacy = readLegacyFiles()
    expect(legacy).toEqual([...legacy].sort())
  })
})
