import { createStaticStyles, cx, lobeStaticStylish, Text } from '@lobehub/ui'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

const styles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: 4px;
  `,
  copy: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  link: css`
    display: flex;
    flex: 1;
    align-items: center;
    gap: 12px;

    min-width: 0;

    color: ${cssVar.colorText};
    text-decoration: none;
  `,
  meta: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;

    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  `,
  row: css`
    display: flex;
    align-items: center;
    gap: 12px;

    min-width: 0;
    min-block-size: 48px;
    padding-block: 6px;
    padding-inline: 12px;
    border-radius: ${cssVar.borderRadius};

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
}))

export function DeskRecordLink(props: {
  actions?: ReactNode
  meta?: ReactNode
  subtitle?: ReactNode
  title: string
  to: string
}) {
  return (
    <div className={styles.row}>
      <Link
        className={cx(styles.link, lobeStaticStylish.resetLinkColor)}
        to={props.to}
      >
        <span className={styles.copy}>
          <Text ellipsis={{ tooltipWhenOverflow: true }} weight={500}>
            {props.title}
          </Text>
          {props.subtitle}
        </span>
        {props.meta ? <span className={styles.meta}>{props.meta}</span> : null}
      </Link>
      {props.actions ? (
        <div className={styles.actions}>{props.actions}</div>
      ) : null}
    </div>
  )
}
