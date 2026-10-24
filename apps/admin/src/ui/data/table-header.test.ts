import { describe, expect, it } from 'vitest'

import {
  compareNumber,
  compareText,
  compareTime,
  orderedBy,
  readFilterValues,
  readSingleFilter,
} from './table-header'

describe('table header comparisons', () => {
  it('orders names with numeric chunks and ignores case', () => {
    expect(['b', 'a10', 'A2'].sort(compareText)).toEqual(['A2', 'a10', 'b'])
  })

  it('treats a missing number or time as zero', () => {
    expect(compareNumber(undefined, 2)).toBeLessThan(0)
    expect(compareTime(undefined, '2020-01-01T00:00:00.000Z')).toBeLessThan(0)
    expect(compareTime(10, 2)).toBeGreaterThan(0)
  })

  it('reverses a compare result for descend and leaves the source order otherwise', () => {
    const rows = [{ n: 1 }, { n: 3 }, { n: 2 }]
    expect(
      orderedBy(rows, 'ascend', (left, right) => left.n - right.n).map(
        (row) => row.n,
      ),
    ).toEqual([1, 2, 3])
    expect(
      orderedBy(rows, 'descend', (left, right) => left.n - right.n).map(
        (row) => row.n,
      ),
    ).toEqual([3, 2, 1])
    expect(orderedBy(rows, null, (left, right) => left.n - right.n)).toEqual(
      rows,
    )
  })
})

describe('readFilterValues', () => {
  it('reads a multi-select, a single value, and a cleared filter', () => {
    expect(readFilterValues({ type: ['png', 'jpg'] }, 'type')).toEqual([
      'png',
      'jpg',
    ])
    expect(readSingleFilter({ category: ['cat-1'] }, 'category')).toBe('cat-1')
    expect(readSingleFilter({ category: null }, 'category')).toBeNull()
    expect(readSingleFilter({ status: 'active' }, 'status')).toBe('active')
  })
})
