import { createStaticStyles, Tag } from '@lobehub/ui'

const styles = createStaticStyles(({ css }) => ({
  amount: css`
    font-variant-numeric: tabular-nums;
  `,
}))

export function TaskCostBadge(props: {
  className?: string
  cost: number | undefined
}) {
  if (props.cost == null || props.cost === 0) return null
  return (
    <Tag
      className={props.className}
      size="small"
      title={`${props.cost.toFixed(6)} USD`}
    >
      <span className={styles.amount}>${props.cost.toFixed(4)} USD</span>
    </Tag>
  )
}
