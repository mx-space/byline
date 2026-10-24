import { createStaticStyles } from '@lobehub/ui'

import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'

const MD_QUERY = '(min-width: 768px)'
const LG_QUERY = '(min-width: 992px)'

export const SELECTION_COLUMN_WIDTH = 48
export const EXPAND_COLUMN_WIDTH = 48

/**
 * Pin the identity column and the actions column only on the desktop shell.
 * Below that, a frozen left column plus a frozen right column covers a phone,
 * so the row scrolls as a whole instead.
 */
export function useRecordTable() {
  const md = useMediaQuery(MD_QUERY)
  const lg = useMediaQuery(LG_QUERY)
  const pin = useMediaQuery(DESKTOP_MEDIA_QUERY)
  return { lg, md, pin }
}

export function pinStart(pin: boolean) {
  return pin ? { fixed: 'left' as const } : {}
}

export function pinEnd(pin: boolean) {
  return pin ? { fixed: 'right' as const } : {}
}

export function columnShown(
  responsive: readonly string[] | undefined,
  screens: { lg: boolean; md: boolean },
) {
  if (!responsive?.length) return true
  return responsive.some((point) => {
    if (point === 'lg' || point === 'xl' || point === 'xxl' || point === 'xxxl')
      return screens.lg
    if (point === 'md') return screens.md
    if (point === 'xs') return !screens.md
    return true
  })
}

export function recordTableScroll(
  columns: readonly {
    responsive?: readonly string[]
    width?: number | string
  }[],
  screens: { lg: boolean; md: boolean },
  extra = 0,
) {
  const x = columns.reduce((sum, column) => {
    if (!columnShown(column.responsive, screens)) return sum
    return sum + (typeof column.width === 'number' ? column.width : 220)
  }, extra)
  return { x }
}

export const recordTableStyles = createStaticStyles(({ css }) => ({
  root: css`
    min-width: 0;
    max-width: 100%;

    .lobe-table-content,
    .lobe-table-body,
    .lobe-table-header {
      max-width: 100%;
    }

    .lobe-table-thead th {
      white-space: nowrap;
    }
  `,
}))
