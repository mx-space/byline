import {
  ActionIcon,
  Center,
  createStaticStyles,
  cx,
  Empty,
  Flexbox,
  Text,
} from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'

import { ARTICLE_MAX_WIDTH } from './page'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  actions: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: 4px;
  `,
  body: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
  `,
  content: css`
    width: 100%;
    margin-inline: auto;
    padding-block: 20px 32px;
    padding-inline: 24px;

    ${responsive.md} {
      padding-block: 16px 24px;
      padding-inline: 16px;
    }
  `,
  contentArticle: css`
    max-width: ${ARTICLE_MAX_WIDTH};
  `,
  contentDefault: css`
    max-width: 960px;
  `,
  contentFull: css`
    max-width: none;
  `,
  contentNarrow: css`
    max-width: 720px;
  `,
  count: css`
    flex: none;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  detailHeader: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: 12px;

    min-height: 64px;
    padding-block: 12px;
    padding-inline: 24px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    ${responsive.md} {
      padding-inline: 12px 16px;
    }
  `,
  detailIdentity: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  detailTitle: css`
    overflow: hidden;

    margin: 0;

    font-size: ${cssVar.fontSizeLG};
    font-weight: 600;
    line-height: 1.4;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  footer: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    min-height: 48px;
    padding-block: 8px;
    padding-inline: 16px;
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
  `,
  listHeader: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;

    height: 56px;
    padding-inline: 16px 12px;
  `,
  listTitle: css`
    overflow: hidden;

    margin: 0;

    font-size: ${cssVar.fontSizeLG};
    font-weight: 600;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;

    min-width: 0;

    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
  `,
  notices: css`
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 8px;
    padding-block-end: 8px;
    padding-inline: 12px;
  `,
  pane: css`
    display: flex;
    flex-direction: column;

    height: 100%;
    min-height: 0;
    min-width: 0;

    background: ${cssVar.colorBgContainer};
  `,
  placeholder: css`
    height: 100%;
    padding: 24px;
  `,
  titleRow: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  `,
  toolbar: css`
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    padding-block: 0 12px;
    padding-inline: 12px;
  `,
}))

export interface ListPaneProps {
  actions?: ReactNode
  'aria-busy'?: boolean
  children: ReactNode
  className?: string
  count?: ReactNode
  footer?: ReactNode
  notices?: ReactNode
  title: ReactNode
  /** Search and filters that narrow the list. */
  toolbar?: ReactNode
}

/** Left column of a master-detail page: header, filters, scrolling rows, pager. */
export function ListPane(props: ListPaneProps) {
  return (
    <div
      aria-busy={props['aria-busy']}
      className={cx(styles.pane, props.className)}
    >
      <header className={styles.listHeader}>
        <Flexbox
          align="baseline"
          flex={1}
          gap={8}
          horizontal
          style={{ minWidth: 0 }}
        >
          <h1 className={styles.listTitle}>{props.title}</h1>
          {props.count != null ? (
            <Text as="span" className={styles.count}>
              {props.count}
            </Text>
          ) : null}
        </Flexbox>
        {props.actions ? (
          <div className={styles.actions}>{props.actions}</div>
        ) : null}
      </header>
      {props.toolbar ? (
        <div className={styles.toolbar}>{props.toolbar}</div>
      ) : null}
      {props.notices ? (
        <div className={styles.notices}>{props.notices}</div>
      ) : null}
      <div className={styles.body}>{props.children}</div>
      {props.footer ? (
        <div className={styles.footer}>{props.footer}</div>
      ) : null}
    </div>
  )
}

export interface DetailPaneProps {
  actions?: ReactNode
  /** Back to the list. Only shown when the detail covers the list (narrow screens). */
  backLabel?: string
  children?: ReactNode
  className?: string
  /** `full` uses the pane. `article` is the draft reading column. */
  contentWidth?: 'article' | 'default' | 'full' | 'narrow'
  /** Small label above the title, such as the object type. */
  footer?: ReactNode
  /**
   * The surrounding Drawer already shows the title and close control.
   * Skip this pane's own header so actions can live in the drawer footer.
   */
  hideHeader?: boolean
  meta?: ReactNode
  onBack?: () => void
  /** Skip the inner padding when the body manages its own layout. */
  padded?: boolean
  status?: ReactNode
  /** Rendered under the header, outside the scrolling body. */
  tabs?: ReactNode
  title?: ReactNode
}

/** Right column of a master-detail page: identity and actions on top, content below. */
export function DetailPane(props: DetailPaneProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const padded = props.padded ?? true
  const width = props.contentWidth ?? 'default'
  return (
    <div className={cx(styles.pane, props.className)}>
      {props.hideHeader ? null : (
        <header className={styles.detailHeader}>
          {!isDesktop && props.onBack ? (
            <ActionIcon
              aria-label={props.backLabel}
              icon={ArrowLeft}
              onClick={props.onBack}
              title={props.backLabel}
            />
          ) : null}
          <div className={styles.detailIdentity}>
            <div className={styles.titleRow}>
              <h2 className={styles.detailTitle}>{props.title}</h2>
              {props.status}
            </div>
            {props.meta ? (
              <div className={styles.meta}>{props.meta}</div>
            ) : null}
          </div>
          {props.actions ? (
            <div className={styles.actions}>{props.actions}</div>
          ) : null}
        </header>
      )}
      {props.tabs}
      <div className={styles.body}>
        {padded ? (
          <div
            className={cx(
              styles.content,
              width === 'full'
                ? styles.contentFull
                : width === 'narrow'
                  ? styles.contentNarrow
                  : width === 'article'
                    ? styles.contentArticle
                    : styles.contentDefault,
            )}
          >
            {props.children}
          </div>
        ) : (
          props.children
        )}
      </div>
      {props.footer ? (
        <div className={styles.footer}>{props.footer}</div>
      ) : null}
    </div>
  )
}

/** Shown in the detail column before anything is picked. */
export function DetailPlaceholder(props: {
  action?: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  title: ReactNode
}) {
  return (
    <Center className={styles.placeholder}>
      <Empty
        action={props.action}
        description={props.description}
        icon={props.icon}
        title={props.title}
      />
    </Center>
  )
}
