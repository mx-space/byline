import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import type { AuthorProfile, UserDetail } from '~/api/users'
import { UserAvatar } from '~/features/users/components/UserAvatar'
import { useI18n } from '~/i18n'
import { buildLanguageOptions } from '~/lib/languages'
import { Popover } from '~/ui/overlay/popover'
import { Badge } from '~/ui/primitives/badge'
import { SelectField } from '~/ui/primitives/select'
import { TextArea, TextInput } from '~/ui/primitives/text-field'

type AuthorCandidate = AuthorProfile &
  Partial<Pick<UserDetail, 'deactivatedAt' | 'isProfileOnly' | 'username'>>

export function AuthorsPicker(props: {
  candidates: AuthorCandidate[]
  onChange: (authors: string[]) => void
  value: string[]
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const byId = useMemo(
    () => new Map(props.candidates.map((author) => [author.id, author])),
    [props.candidates],
  )
  const keyword = search.trim().toLowerCase()
  const available = props.candidates.filter(
    (author) =>
      !props.value.includes(author.id) &&
      !author.deactivatedAt &&
      (!keyword ||
        author.displayName.toLowerCase().includes(keyword) ||
        author.username?.toLowerCase().includes(keyword)),
  )

  const move = (index: number, offset: -1 | 1) => {
    const next = [...props.value]
    const target = index + offset
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    props.onChange(next)
  }

  return (
    <div className="grid gap-2">
      <ol className="grid gap-1">
        {props.value.map((id, index) => {
          const author = byId.get(id)
          const name = author?.displayName || id
          return (
            <li
              className="flex items-center gap-2 rounded-sm border border-border bg-surface-card px-2 py-1.5"
              key={id}
            >
              <span className="w-4 shrink-0 text-center text-xs tabular-nums text-fg-subtle">
                {index + 1}
              </span>
              <UserAvatar
                avatar={author?.avatar}
                className="size-6"
                name={name}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-fg">
                {name}
              </span>
              {author?.isProfileOnly ? (
                <Badge pill size="sm" tone="neutral" variant="soft">
                  {t('users.status.profileOnly')}
                </Badge>
              ) : null}
              <div className="flex shrink-0 items-center">
                <IconButton
                  disabled={index === 0}
                  label={t('write.authors.moveUp')}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp aria-hidden="true" className="size-3.5" />
                </IconButton>
                <IconButton
                  disabled={index === props.value.length - 1}
                  label={t('write.authors.moveDown')}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown aria-hidden="true" className="size-3.5" />
                </IconButton>
                <IconButton
                  disabled={props.value.length <= 1}
                  label={t('write.authors.remove')}
                  onClick={() =>
                    props.onChange(props.value.filter((item) => item !== id))
                  }
                >
                  <X aria-hidden="true" className="size-3.5" />
                </IconButton>
              </div>
            </li>
          )
        })}
      </ol>
      <Popover onOpenChange={setOpen} open={open}>
        <Popover.Trigger
          className="inline-flex items-center gap-1.5 self-start rounded-sm px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-inset hover:text-fg focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-accent/15"
          type="button"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          {t('write.authors.add')}
        </Popover.Trigger>
        <Popover.Content className="grid gap-2 p-2" width="md">
          <TextInput
            aria-label={t('write.authors.search')}
            autoFocus
            onChange={setSearch}
            placeholder={t('write.authors.search')}
            value={search}
          />
          <div className="grid max-h-64 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-fg-subtle">
                {t('write.authors.noCandidates')}
              </p>
            ) : (
              available.map((author) => (
                <button
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-fg hover:bg-surface-inset"
                  key={author.id}
                  onClick={() => {
                    props.onChange([...props.value, author.id])
                    setSearch('')
                    setOpen(false)
                  }}
                  type="button"
                >
                  <UserAvatar
                    avatar={author.avatar}
                    className="size-6"
                    name={author.displayName}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {author.displayName}
                  </span>
                  {author.isProfileOnly ? (
                    <span className="shrink-0 text-xs text-fg-subtle">
                      {t('users.status.profileOnly')}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover>
    </div>
  )
}

function IconButton(props: {
  children: ReactNode
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={props.label}
      className="inline-flex size-6 items-center justify-center rounded-xs text-fg-subtle transition-colors hover:bg-surface-inset hover:text-fg disabled:pointer-events-none disabled:opacity-30"
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.label}
      type="button"
    >
      {props.children}
    </button>
  )
}

export function SourceLangField(props: {
  onChange: (value: string) => void
  siteDefault?: string | null
  value: string
}) {
  const { locale, t } = useI18n()
  const options = useMemo(
    () => buildLanguageOptions(locale, [props.value, props.siteDefault]),
    [locale, props.siteDefault, props.value],
  )
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-fg-muted">
        {t('write.sourceLang.label')}
      </span>
      <SelectField
        aria-label={t('write.sourceLang.label')}
        onValueChange={props.onChange}
        options={options}
        value={props.value || props.siteDefault || 'en'}
      />
      {props.siteDefault ? (
        <p className="text-xs text-fg-subtle">
          {t('write.sourceLang.siteDefault', { lang: props.siteDefault })}
        </p>
      ) : null}
    </div>
  )
}

export interface SeoFieldsValue {
  seoDescription: string
  seoImage: string
  seoTitle: string
}

export function SeoFields(props: {
  onChange: (key: keyof SeoFieldsValue, value: string) => void
  titlePlaceholder?: string
  value: SeoFieldsValue
}) {
  const { t } = useI18n()
  return (
    <>
      <TextInput
        controlClassName="h-9"
        label={t('write.seo.title')}
        onChange={(value) => props.onChange('seoTitle', value)}
        placeholder={props.titlePlaceholder}
        value={props.value.seoTitle}
      />
      <TextArea
        controlClassName="min-h-20"
        label={t('write.seo.description')}
        maxLength={1000}
        onChange={(value) => props.onChange('seoDescription', value)}
        value={props.value.seoDescription}
      />
      <TextInput
        controlClassName="h-9"
        label={t('write.seo.image')}
        onChange={(value) => props.onChange('seoImage', value)}
        placeholder="https://"
        value={props.value.seoImage}
      />
    </>
  )
}
