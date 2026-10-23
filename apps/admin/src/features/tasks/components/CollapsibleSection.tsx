import { Collapsible, createStaticStyles, Icon } from '@lobehub/ui'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

const styles = createStaticStyles(({ css, cssVar }) => ({
  section: css`
    border-block-start: 1px solid ${cssVar.colorBorderSecondary};
    padding-block-start: 8px;
  `,
  trigger: css`
    align-items: center;
    background: transparent;
    border: 0;
    color: ${cssVar.colorText};
    cursor: pointer;
    display: flex;
    font-size: ${cssVar.fontSize};
    font-weight: 500;
    gap: 6px;
    padding-block: 8px;
    padding-inline: 0;
    text-align: start;
    width: 100%;
  `,
  hint: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
    font-weight: 400;
    margin-inline-start: auto;
  `,
  open: css`
    display: inline-flex;
    transform: rotate(90deg);
  `,
  body: css`
    padding-block-end: 8px;
  `,
}))

export function CollapsibleSection(props: {
  children: ReactNode
  defaultOpen?: boolean
  hint?: ReactNode
  title: string
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? false)
  return (
    <section className={styles.section}>
      <button
        aria-expanded={open}
        className={styles.trigger}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={open ? styles.open : undefined}>
          <Icon icon={ChevronRight} size="small" />
        </span>
        {props.title}
        {props.hint ? <span className={styles.hint}>{props.hint}</span> : null}
      </button>
      <Collapsible open={open}>
        <div className={styles.body}>{props.children}</div>
      </Collapsible>
    </section>
  )
}
