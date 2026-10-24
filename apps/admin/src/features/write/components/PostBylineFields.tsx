import { Avatar, createStaticStyles, Select, Tag } from '@lobehub/ui'
import { useMemo, useState } from 'react'

import type { AuthorProfile, UserDetail } from '~/api/users'
import { useI18n } from '~/i18n'
import { buildLanguageOptions } from '~/lib/languages'
import { SelectField } from '~/ui/primitives/select'
import { TextArea, TextInput } from '~/ui/primitives/text-field'

import { writeChromeStyles } from './chrome/styles'
import { SeoPreviews } from './seo-preview'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  authorOption: css`
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  `,
  uf59d50f5: css`
    display: grid;
    gap: 6px;
    width: 100%;
    min-width: 0;
  `,
  ucd6c15f2: css`
    font-size: ${cssVar.fontSize};
    line-height: ${cssVar.lineHeight};
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  u59d40084: css`
    font-size: ${cssVar.fontSize};
    line-height: ${cssVar.lineHeight};
    color: ${cssVar.colorTextTertiary};
  `,
  ue7a768f9: css`
    height: 2.25rem;
  `,
  u3f2a1ff6: css`
    min-height: 5rem;
  `,
  countNum: css`
    font-weight: 600;
    color: ${cssVar.colorSuccess};

    &[data-over] {
      color: ${cssVar.colorWarning};
    }
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
  const [resetKey, setResetKey] = useState(0)
  const byId = useMemo(
    () => new Map(props.candidates.map((author) => [author.id, author])),
    [props.candidates],
  )
  const options = props.candidates
    .filter(
      (author) => !author.deactivatedAt || props.value.includes(author.id),
    )
    .map((author) => ({
      label: author.displayName,
      value: author.id,
    }))

  return (
    <Select
      aria-label={t('write.authors.title')}
      classNames={{ trigger: writeChromeStyles.tagTrigger }}
      filterOption={(input, option) => {
        const author = byId.get(String(option.value))
        const query = input.trim().toLowerCase()
        if (!query) return true
        return [author?.displayName, author?.username].some((value) =>
          value?.toLowerCase().includes(query),
        )
      }}
      key={resetKey}
      mode="tags"
      onChange={(next) => {
        const raw = (Array.isArray(next) ? next : []).map(String)
        const ids: string[] = []
        let rejected = false
        for (const token of raw) {
          if (byId.has(token)) {
            ids.push(token)
            continue
          }
          const query = token.trim().toLowerCase()
          const matches = props.candidates.filter(
            (author) =>
              !author.deactivatedAt &&
              (author.displayName.toLowerCase() === query ||
                author.username?.toLowerCase() === query),
          )
          if (matches.length === 1) ids.push(matches[0].id)
          else rejected = true
        }
        const unique = [...new Set(ids)]
        if (rejected) setResetKey((key) => key + 1)
        if (unique.length === 0) return
        const kept = props.value.filter((id) => unique.includes(id))
        const added = unique.filter((id) => !props.value.includes(id))
        props.onChange([...kept, ...added])
      }}
      optionRender={(option) => {
        const author = byId.get(String(option.value))
        const name = author?.displayName || String(option.value)
        return (
          <span className={lobeStyles.authorOption}>
            <Avatar
              alt=""
              avatar={author?.avatar?.trim() || undefined}
              shape="circle"
              size={20}
            />
            <span>{name}</span>
            {author?.isProfileOnly ? (
              <Tag>{t('users.status.profileOnly')}</Tag>
            ) : null}
          </span>
        )
      }}
      options={options}
      placeholder={t('write.authors.add')}
      showSearch
      value={props.value}
    />
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

const TITLE_LIMIT = 60
const DESCRIPTION_LIMIT = 145

export function SeoFields(props: {
  aiDescription?: string
  coverImage?: string
  fallbackDescription?: string
  onChange: (key: keyof SeoFieldsValue, value: string) => void
  path?: string
  titlePlaceholder?: string
  value: SeoFieldsValue
}) {
  const { t } = useI18n()
  const cover = props.coverImage?.trim() ?? ''
  const seoImage = props.value.seoImage.trim()
  const image = seoImage || cover
  const title = props.value.seoTitle || props.titlePlaceholder || ''
  const aiDescription = props.value.seoDescription
    ? ''
    : (props.aiDescription ?? '')
  const description =
    props.value.seoDescription ||
    aiDescription ||
    props.fallbackDescription ||
    ''

  return (
    <>
      <TextInput
        className={lobeStyles.uf59d50f5}
        controlClassName={lobeStyles.ue7a768f9}
        label={t('write.seo.title')}
        labelClassName={lobeStyles.ucd6c15f2}
        onChange={(value) => props.onChange('seoTitle', value)}
        placeholder={props.titlePlaceholder}
        value={props.value.seoTitle}
      />
      <CountHint
        label={t('write.seo.titleCount', { max: TITLE_LIMIT })}
        max={TITLE_LIMIT}
        used={props.value.seoTitle.length}
      />
      <TextArea
        className={lobeStyles.uf59d50f5}
        controlClassName={lobeStyles.u3f2a1ff6}
        label={t('write.seo.description')}
        labelClassName={lobeStyles.ucd6c15f2}
        maxLength={1000}
        onChange={(value) => props.onChange('seoDescription', value)}
        placeholder={aiDescription || undefined}
        value={props.value.seoDescription}
      />
      {aiDescription ? (
        <p className={lobeStyles.u59d40084}>{t('write.seo.aiDescription')}</p>
      ) : null}
      <CountHint
        label={t('write.seo.descriptionCount', { max: DESCRIPTION_LIMIT })}
        max={DESCRIPTION_LIMIT}
        used={props.value.seoDescription.length}
      />
      <ImageField
        fallbackHint={
          !seoImage && cover ? t('write.seo.imageFallback') : undefined
        }
        label={t('write.seo.image')}
        onChange={(value) => props.onChange('seoImage', value)}
        value={props.value.seoImage}
      />
      <div className={lobeStyles.uf59d50f5}>
        <span className={lobeStyles.ucd6c15f2}>{t('write.seo.preview')}</span>
        <SeoPreviews
          cardLabel={t('write.seo.cardPreview')}
          description={description || t('write.seo.previewFallback')}
          image={image || undefined}
          path={props.path}
          searchLabel={t('write.seo.searchPreview')}
          title={title || '--'}
        />
      </div>
    </>
  )
}

function ImageField(props: {
  fallbackHint?: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className={lobeStyles.uf59d50f5}>
      <span className={lobeStyles.ucd6c15f2}>{props.label}</span>
      <TextInput
        controlClassName={lobeStyles.ue7a768f9}
        onChange={props.onChange}
        placeholder="https://"
        value={props.value}
      />
      {props.fallbackHint ? (
        <p className={lobeStyles.u59d40084}>{props.fallbackHint}</p>
      ) : null}
    </div>
  )
}

function CountHint(props: { label: string; max: number; used: number }) {
  return (
    <p className={lobeStyles.u59d40084}>
      {props.label}{' '}
      <span
        className={lobeStyles.countNum}
        data-over={props.used > props.max ? '' : undefined}
      >
        {props.used}
      </span>
    </p>
  )
}
