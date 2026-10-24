import { Input } from '@lobehub/ui'
import * as stylex from '@stylexjs/stylex'
import { Code2, Search } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { DynamicCatalogEntry } from '~/api/dynamic-components'
import { useI18n } from '~/i18n'
import { fieldsFromSchema } from '~/lib/dynamic-props'
import { Button } from '~/ui/site-button'

import { filterCatalogEntries } from './catalog-picker'
import { styles } from './styles'

export function CatalogPicker(props: {
  entries: DynamicCatalogEntry[] | null
  onManual: () => void
  onPick: (entry: DynamicCatalogEntry) => void
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // Lexical restores focus to the editor right after the slash command that
  // inserted this node, which wins over autoFocus.
  useEffect(() => {
    const frame = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])
  const visible = useMemo(
    () => filterCatalogEntries(props.entries ?? [], query),
    [props.entries, query],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((index) =>
        visible.length === 0
          ? 0
          : (index + step + visible.length) % visible.length,
      )
    } else if (event.key === 'Enter' && visible[active]) {
      event.preventDefault()
      props.onPick(visible[active])
    }
  }

  return (
    <>
      <div {...stylex.props(styles.search)}>
        <Input
          aria-label={t('dynamicNode.search')}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('dynamicNode.search')}
          prefix={<Search aria-hidden="true" size={14} />}
          ref={searchRef}
          type="search"
          value={query}
          variant="filled"
        />
      </div>
      <div {...stylex.props(styles.options)} role="listbox">
        {props.entries === null ? (
          <p {...stylex.props(styles.status)}>{t('common.loading')}</p>
        ) : visible.length === 0 ? (
          <p {...stylex.props(styles.status)}>{t('dynamicNode.noMatch')}</p>
        ) : (
          visible.map((entry, index) => (
            <button
              aria-selected={index === active}
              {...stylex.props(
                styles.option,
                index === active && styles.optionActive,
              )}
              key={entry.url}
              onClick={() => props.onPick(entry)}
              onMouseEnter={() => setActive(index)}
              role="option"
              type="button"
            >
              <span {...stylex.props(styles.optionIcon)}>
                <Code2 aria-hidden="true" size={16} />
              </span>
              <span {...stylex.props(styles.optionMain)}>
                <span {...stylex.props(styles.optionName)}>{entry.name}</span>
                {entry.description ? (
                  <span {...stylex.props(styles.optionDescription)}>
                    {entry.description}
                  </span>
                ) : null}
              </span>
              <span {...stylex.props(styles.optionCount)}>
                {t('dynamicNode.fieldCount', {
                  count: fieldsFromSchema(entry.propsSchema).length,
                })}
              </span>
            </button>
          ))
        )}
      </div>
      <div {...stylex.props(styles.footer)}>
        <span {...stylex.props(styles.hint)}>
          {t('dynamicNode.pickerHint')}
        </span>
        <Button onClick={props.onManual} size="small" type="text">
          {t('dynamicNode.manualLink')}
        </Button>
      </div>
    </>
  )
}
