import {
  createStaticStyles,
  Flexbox,
  Skeleton,
  SkeletonText,
} from '@lobehub/ui'

import { DetailPane } from '~/ui/page'

const styles = createStaticStyles(({ css }) => ({
  row: css`
    margin-inline: 8px;
    padding-block: 12px;
    padding-inline: 8px 12px;
  `,
}))

export function DraftListSkeleton() {
  return (
    <div aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div className={styles.row} key={index}>
          <Flexbox gap={8}>
            <Flexbox gap={12} horizontal justify="space-between">
              <Skeleton height={16} width="60%" />
              <Skeleton height={12} width={48} />
            </Flexbox>
            <Skeleton height={12} width="40%" />
          </Flexbox>
        </div>
      ))}
    </div>
  )
}

export function DraftDetailSkeleton() {
  return (
    <DetailPane title={<Skeleton height={20} width={240} />}>
      <Flexbox gap={32}>
        <SkeletonText rows={3} />
        <SkeletonText rows={8} />
      </Flexbox>
    </DetailPane>
  )
}
