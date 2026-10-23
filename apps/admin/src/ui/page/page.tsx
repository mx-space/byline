import { createStaticStyles, cx, Flexbox, Text } from '@lobehub/ui'
import { PageHeader } from '@lobehub/ui/dashboard'
import type { ReactNode } from 'react'

export type PageWidth = 'default' | 'full' | 'narrow' | 'wide'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  `,
  bodyFill: css`
    flex: 1;
    min-height: 0;
  `,
  count: css`
    font-variant-numeric: tabular-nums;
    font-weight: 400;
    color: ${cssVar.colorTextTertiary};
  `,
  header: css`
    flex: none;
  `,
  inner: css`
    display: flex;
    flex-direction: column;
    gap: 20px;

    width: 100%;
    min-width: 0;
    margin-inline: auto;
    padding-block: 28px 40px;
    padding-inline: 32px;

    ${responsive.md} {
      gap: 16px;
      padding-block: 16px 24px;
      padding-inline: 16px;
    }
  `,
  innerFill: css`
    flex: 1;
    min-height: 0;
    padding-block-end: 16px;

    ${responsive.md} {
      padding-block-end: 12px;
    }
  `,
  root: css`
    display: flex;
    flex-direction: column;

    height: 100%;
    min-height: 0;
    min-width: 0;

    background: ${cssVar.colorBgContainer};
  `,
  scroll: css`
    overflow: auto;
  `,
  widthDefault: css`
    max-width: 1120px;
  `,
  widthFull: css`
    max-width: none;
  `,
  widthNarrow: css`
    max-width: 800px;
  `,
  widthWide: css`
    max-width: 1440px;
  `,
}))

const widthClass: Record<PageWidth, string> = {
  default: styles.widthDefault,
  full: styles.widthFull,
  narrow: styles.widthNarrow,
  wide: styles.widthWide,
}

export interface PageProps {
  actions?: ReactNode
  children?: ReactNode
  className?: string
  count?: ReactNode
  description?: ReactNode
  /**
   * The page itself does not scroll; the body takes the remaining height so a
   * list inside it can scroll and keep its pagination in view.
   */
  fill?: boolean
  /** Rendered between the header and the body, usually `RouteTabs`. */
  tabs?: ReactNode
  title: ReactNode
  width?: PageWidth
}

export function Page(props: PageProps) {
  const width = props.width ?? 'default'
  return (
    <section
      className={cx(styles.root, !props.fill && styles.scroll, props.className)}
    >
      <div
        className={cx(
          styles.inner,
          widthClass[width],
          props.fill && styles.innerFill,
        )}
      >
        <div className={styles.header}>
          <PageHeader
            action={props.actions}
            description={props.description}
            title={
              props.count != null ? (
                <Flexbox align="baseline" as="span" gap={8} horizontal>
                  <span>{props.title}</span>
                  <Text as="span" className={styles.count}>
                    {props.count}
                  </Text>
                </Flexbox>
              ) : (
                props.title
              )
            }
          />
        </div>
        {props.tabs}
        <div className={cx(styles.body, props.fill && styles.bodyFill)}>
          {props.children}
        </div>
      </div>
    </section>
  )
}
