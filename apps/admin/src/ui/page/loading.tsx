import { createStaticStyles, cx } from '@lobehub/ui'
import { PageLoading } from '@lobehub/ui/dashboard'

import { PAGE_CONTENT_MAX_WIDTH } from './page'

const styles = createStaticStyles(({ css, responsive }) => ({
  frame: css`
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: auto;
  `,
  skeleton: css`
    box-sizing: border-box;
    width: 100%;
    max-width: ${PAGE_CONTENT_MAX_WIDTH};
    margin-inline: auto;
    padding-block: 28px 40px;
    padding-inline: 32px;

    ${responsive.md} {
      padding-block: 16px 24px;
      padding-inline: 16px;
    }
  `,
}))

export function PageLoadingFrame(props: { className?: string; label: string }) {
  return (
    <div className={cx(styles.frame, props.className)}>
      <PageLoading className={styles.skeleton} label={props.label} />
    </div>
  )
}
