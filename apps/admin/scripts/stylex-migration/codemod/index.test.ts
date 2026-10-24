// @vitest-environment node
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { findFilesWithMockedStyles } from '.'

const adminRoot = path.resolve(import.meta.dirname, '../../..')

describe('findFilesWithMockedStyles', () => {
  it('returns an empty set when no test mocks createStaticStyles', () => {
    expect(findFilesWithMockedStyles(adminRoot).size).toBe(0)
  })
})
