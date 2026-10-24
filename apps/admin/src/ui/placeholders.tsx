import { Flexbox, Skeleton, Text } from '@lobehub/ui'
import { LoadingAnnouncer } from '@lobehub/ui/dashboard'

/** Missing field mark. Kept as a string where the value is interpolated into a sentence. */
export const EMPTY_MARK = '--'

/** A missing field. Secondary so it does not read as content. */
export function EmptyValue() {
  return (
    <Text as="span" type="secondary">
      {EMPTY_MARK}
    </Text>
  )
}

/** The trimmed value, or the muted empty mark when it is blank. */
export function emptyOr(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return <EmptyValue />
  return trimmed
}

/** List and desk rows: a title line and a shorter meta line. */
export function ListSkeleton(props: { label?: string; rows?: number }) {
  const rows = props.rows ?? 4
  return (
    <div aria-busy="true">
      {props.label ? <LoadingAnnouncer label={props.label} /> : null}
      {Array.from({ length: rows }, (_, index) => (
        <Flexbox gap={6} key={index} paddingBlock={8} paddingInline={12}>
          <Skeleton.Text
            fontSize={14}
            rows={2}
            width={index % 2 === 0 ? ['68%', '36%'] : ['52%', '28%']}
          />
        </Flexbox>
      ))}
    </div>
  )
}

/** A settings or drawer form: a short label over a control. */
export function FormSkeleton(props: { label?: string; rows?: number }) {
  const rows = props.rows ?? 4
  return (
    <Flexbox aria-busy gap={16}>
      {props.label ? <LoadingAnnouncer label={props.label} /> : null}
      {Array.from({ length: rows }, (_, index) => (
        <Flexbox gap={8} key={index}>
          <Skeleton height={12} width={index % 2 === 0 ? 88 : 64} />
          <Skeleton height={32} width="100%" />
        </Flexbox>
      ))}
    </Flexbox>
  )
}

/** Suspense fallback for a detail pane: header bar, then body lines. */
export function DetailSkeleton() {
  return (
    <Flexbox
      aria-busy
      flex={1}
      gap={16}
      height="100%"
      padding={16}
      style={{ minHeight: 0 }}
    >
      <Skeleton height={16} width={180} />
      <Skeleton.Text fontSize={14} rows={3} width={['72%', '48%', '60%']} />
    </Flexbox>
  )
}
