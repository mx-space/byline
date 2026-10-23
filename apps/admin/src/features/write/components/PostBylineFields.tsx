import { createStaticStyles } from '@lobehub/ui'
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

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u27846a89: css`
    display: grid;
    gap: 0.5rem;
  `,
  u4b23e247: css`
    display: grid;
    gap: 0.25rem;
  `,
  uc348b76b: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
  `,
  ud8990480: css`
    width: 1rem;
    flex-shrink: 0;
    text-align: center;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  u9af3b4b6: css`
    width: 1.5rem;
    height: 1.5rem;
  `,
  u1eaa9917: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
  `,
  u74db95fb: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  ue4afaaa4: css`
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    align-self: flex-start;
    border-radius: 8px;
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
    &:focus-visible {
      outline: none;
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
  `,
  u9c973782: css`
    display: grid;
    gap: 0.5rem;
    padding: 0.5rem;
  `,
  u40126755: css`
    display: grid;
    max-height: 16rem;
    overflow-y: auto;
  `,
  ueffc70bc: css`
    padding-inline: 0.5rem;
    padding-block: 0.75rem;
    text-align: center;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u688baabe: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 8px;
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    text-align: left;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u3a758b8a: css`
    flex-shrink: 0;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  uf8ac1db5: css`
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: ${cssVar.colorTextTertiary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
    &:disabled {
      pointer-events: none;
    }
    &:disabled {
      opacity: 0.3;
    }
  `,
  uf59d50f5: css`
    display: grid;
    gap: 0.375rem;
  `,
  ucd6c15f2: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  u59d40084: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  ue7a768f9: css`
    height: 2.25rem;
  `,
  u3f2a1ff6: css`
    min-height: 5rem;
  `,
}))

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
    <div className={lobeStyles.u27846a89}>
      <ol className={lobeStyles.u4b23e247}>
        {props.value.map((id, index) => {
          const author = byId.get(id)
          const name = author?.displayName || id
          return (
            <li className={lobeStyles.uc348b76b} key={id}>
              <span className={lobeStyles.ud8990480}>{index + 1}</span>
              <UserAvatar
                avatar={author?.avatar}
                className={lobeStyles.u9af3b4b6}
                name={name}
              />
              <span className={lobeStyles.u1eaa9917}>{name}</span>
              {author?.isProfileOnly ? (
                <Badge pill size="sm" tone="neutral" variant="soft">
                  {t('users.status.profileOnly')}
                </Badge>
              ) : null}
              <div className={lobeStyles.u74db95fb}>
                <IconButton
                  disabled={index === 0}
                  label={t('write.authors.moveUp')}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp
                    aria-hidden="true"
                    className={lobeStyles.u783b0d9d}
                  />
                </IconButton>
                <IconButton
                  disabled={index === props.value.length - 1}
                  label={t('write.authors.moveDown')}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown
                    aria-hidden="true"
                    className={lobeStyles.u783b0d9d}
                  />
                </IconButton>
                <IconButton
                  disabled={props.value.length <= 1}
                  label={t('write.authors.remove')}
                  onClick={() =>
                    props.onChange(props.value.filter((item) => item !== id))
                  }
                >
                  <X aria-hidden="true" className={lobeStyles.u783b0d9d} />
                </IconButton>
              </div>
            </li>
          )
        })}
      </ol>
      <Popover onOpenChange={setOpen} open={open}>
        <Popover.Trigger className={lobeStyles.ue4afaaa4} type="button">
          <Plus aria-hidden="true" className={lobeStyles.u783b0d9d} />
          {t('write.authors.add')}
        </Popover.Trigger>
        <Popover.Content className={lobeStyles.u9c973782} width="md">
          <TextInput
            aria-label={t('write.authors.search')}
            autoFocus
            onChange={setSearch}
            placeholder={t('write.authors.search')}
            value={search}
          />
          <div className={lobeStyles.u40126755}>
            {available.length === 0 ? (
              <p className={lobeStyles.ueffc70bc}>
                {t('write.authors.noCandidates')}
              </p>
            ) : (
              available.map((author) => (
                <button
                  className={lobeStyles.u688baabe}
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
                    className={lobeStyles.u9af3b4b6}
                    name={author.displayName}
                  />
                  <span className={lobeStyles.u67bab313}>
                    {author.displayName}
                  </span>
                  {author.isProfileOnly ? (
                    <span className={lobeStyles.u3a758b8a}>
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
      className={lobeStyles.uf8ac1db5}
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
    <div className={lobeStyles.uf59d50f5}>
      <span className={lobeStyles.ucd6c15f2}>
        {t('write.sourceLang.label')}
      </span>
      <SelectField
        aria-label={t('write.sourceLang.label')}
        onValueChange={props.onChange}
        options={options}
        value={props.value || props.siteDefault || 'en'}
      />
      {props.siteDefault ? (
        <p className={lobeStyles.u59d40084}>
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
        controlClassName={lobeStyles.ue7a768f9}
        label={t('write.seo.title')}
        onChange={(value) => props.onChange('seoTitle', value)}
        placeholder={props.titlePlaceholder}
        value={props.value.seoTitle}
      />
      <TextArea
        controlClassName={lobeStyles.u3f2a1ff6}
        label={t('write.seo.description')}
        maxLength={1000}
        onChange={(value) => props.onChange('seoDescription', value)}
        value={props.value.seoDescription}
      />
      <TextInput
        controlClassName={lobeStyles.ue7a768f9}
        label={t('write.seo.image')}
        onChange={(value) => props.onChange('seoImage', value)}
        placeholder="https://"
        value={props.value.seoImage}
      />
    </>
  )
}
