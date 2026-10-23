import { Pagination } from '@lobehub/ui'

export interface CompactPaginationProps {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  page: number
  pageCount: number
  pageSize: number
  pageSizes?: number[]
}

export function CompactPagination(props: CompactPaginationProps) {
  const pageSizes = props.pageSizes ?? [10, 20, 50, 100]
  const total = Math.max(props.pageCount, 1) * props.pageSize

  return (
    <Pagination
      current={props.page}
      onChange={(page, pageSize) => {
        if (pageSize !== props.pageSize) props.onPageSizeChange(pageSize)
        if (page !== props.page) props.onPageChange(page)
      }}
      pageSize={props.pageSize}
      pageSizeOptions={pageSizes}
      showSizeChanger
      simple
      size="small"
      total={total}
    />
  )
}
