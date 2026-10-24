import {
  AutoComplete,
  DatePicker,
  Image,
  Input,
  Select,
  Switch,
  TextArea,
} from '@lobehub/ui'
import {
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { CategoryEntity } from '~/data/resources/category'
import { usePostScheduled } from '~/hooks/use-post-scheduled'
import { useI18n } from '~/i18n'
import type { Image as ImageModel } from '~/models/base'
import { Button } from '~/ui/site-button'

import { writeCopy } from '../../copy'
import { MetaPresetSection } from '../../meta-presets'
import { CoverGenerationEntry } from '../cover-generation/CoverGenerationEntry'
import { AuthorsPicker, SeoFields, SourceLangField } from '../PostBylineFields'
import { TtsGenerationEntry } from '../tts/TtsGenerationEntry'
import { writeChromeStyles as styles } from './styles'

export interface WriteRailValues {
  publicAt: string
  authors: string[]
  categoryId: string
  image: string
  meta: Record<string, unknown>
  pin: boolean
  pinOrder: string
  publishedAt: string
  seoDescription: string
  seoImage: string
  seoTitle: string
  slug: string
  sourceLang: string
  summary: string
  tags: string
  text: string
  title: string
}

export interface WriteMetaFieldsProps {
  authorCandidates: Parameters<typeof AuthorsPicker>[0]['candidates']
  categories: CategoryEntity[]
  categoriesFailed: boolean
  coverImages: ImageModel[]
  deletePending: boolean
  draftId?: string
  generatePending: boolean
  hasArticle: boolean
  onDelete: () => void
  onGenerate: () => void
  onRetryCategories: () => void
  onUnpublish: () => void
  onViewChange: (view: SettingsView) => void
  publicPath: string
  published: boolean
  publishedPublicAt?: string | null
  refId?: string
  siteDefaultLang: string
  slugPrefix: string
  tags: Array<{ count: number; name: string }>
  unpublishPending: boolean
  view: SettingsView
  updateField: (
    key: keyof WriteRailValues,
    value: WriteRailValues[keyof WriteRailValues],
  ) => void
  values: WriteRailValues
}

export type SettingsView = 'advanced' | 'cover' | 'main' | 'seo'

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function seoConfigured(values: WriteRailValues) {
  return [values.seoTitle, values.seoDescription, values.seoImage].some(
    (value) => value.trim().length > 0,
  )
}

function advancedSummary(
  meta: WriteRailValues['meta'],
  copy: (
    key: Parameters<typeof writeCopy>[1],
    values?: Record<string, number | string>,
  ) => string,
) {
  const count = meta && typeof meta === 'object' ? Object.keys(meta).length : 0
  if (count === 0) return copy('notConfigured')
  if (count === 1) return copy('itemCountOne')
  return copy('itemCount', { count })
}

export function WriteMetaFields(props: WriteMetaFieldsProps) {
  const { locale, format } = useI18n()
  const scheduled = usePostScheduled({
    isPublished: props.published,
    publicAt: props.publishedPublicAt,
  })
  const navigate = useNavigate()
  const copy = (
    key: Parameters<typeof writeCopy>[1],
    values?: Record<string, number | string>,
  ) => writeCopy(locale, key, values)
  const canGenerate =
    props.values.text.trim().length > 0 &&
    (!props.values.title.trim() || !props.values.slug.trim())
  const pathText = `${props.slugPrefix}${props.values.slug || copy('slugPlaceholder')}`

  if (props.view !== 'main') {
    return (
      <div className={styles.settings}>
        {props.view === 'cover' ? (
          <CoverFields {...props} copy={copy} />
        ) : props.view === 'seo' ? (
          <div className={styles.section}>
            <SeoFields
              coverImage={props.values.image}
              fallbackDescription={props.values.summary}
              onChange={(key, value) => props.updateField(key, value)}
              path={props.published ? props.publicPath : pathText}
              titlePlaceholder={props.values.title}
              value={props.values}
            />
          </div>
        ) : (
          <AdvancedFields {...props} />
        )}
      </div>
    )
  }

  return (
    <div className={styles.settings}>
      <div className={styles.section}>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.fieldLabel} htmlFor="write-slug">
              {copy('slug')}
            </label>
            {props.published && !scheduled && props.publicPath ? (
              <a
                className={styles.sideLink}
                href={props.publicPath}
                rel="noreferrer"
                target="_blank"
              >
                {copy('openLive')}
                <ExternalLink aria-hidden size={14} />
              </a>
            ) : null}
          </div>
          <Input
            id="write-slug"
            onChange={(event) => props.updateField('slug', event.target.value)}
            placeholder={copy('slugPlaceholder')}
            prefix={<Link2 size={16} />}
            required
            value={props.values.slug}
          />
          <div className={styles.pathRow}>
            <span
              className={styles.path}
              title={props.published ? props.publicPath : pathText}
            >
              {props.published && props.publicPath
                ? props.publicPath
                : pathText}
            </span>
          </div>
          {canGenerate ? (
            <Button
              htmlType="button"
              loading={props.generatePending}
              onClick={props.onGenerate}
              size="small"
              type="text"
            >
              {props.values.title.trim()
                ? copy('generateSlug')
                : copy('generateTitleSlug')}
            </Button>
          ) : null}
        </div>

        <PublishDateField
          onChange={(value) => props.updateField('publishedAt', value)}
          value={props.values.publishedAt}
        />

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="write-public-at">
            {copy('publicAt')}
          </label>
          <DatePicker
            allowClear
            id="write-public-at"
            needConfirm={false}
            onChange={(date) =>
              props.updateField('publicAt', date?.toISOString() ?? '')
            }
            placeholder={copy('publicAtPlaceholder')}
            showTime
            value={
              props.values.publicAt ? new Date(props.values.publicAt) : null
            }
          />
          <span className={styles.fieldHint}>{copy('publicAtHint')}</span>
          {scheduled ? (
            <span className={styles.fieldHint}>
              {copy('scheduledFor', {
                time: format.dateTime(props.publishedPublicAt!),
              })}
            </span>
          ) : null}
        </div>

        <label className={styles.field} htmlFor="write-category">
          <span className={styles.fieldLabel}>{copy('category')}</span>
          {props.categoriesFailed ? (
            <div className={styles.fieldRow}>
              <span className={styles.fieldHint}>{copy('categoryFailed')}</span>
              <Button
                htmlType="button"
                onClick={props.onRetryCategories}
                size="small"
              >
                {copy('retry')}
              </Button>
            </div>
          ) : props.categories.length === 0 ? (
            <div className={styles.fieldRow}>
              <span className={styles.fieldHint}>{copy('categoryEmpty')}</span>
              <Button
                htmlType="button"
                onClick={() => navigate('/posts/category')}
                size="small"
              >
                {copy('createCategory')}
              </Button>
            </div>
          ) : (
            <Select
              id="write-category"
              onChange={(value) => {
                if (typeof value === 'string')
                  props.updateField('categoryId', value)
              }}
              options={props.categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
              placeholder={copy('categoryPlaceholder')}
              value={props.values.categoryId || null}
            />
          )}
        </label>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{copy('pin')}</span>
          <Switch
            aria-label={copy('pin')}
            checked={props.values.pin}
            onChange={(checked) => props.updateField('pin', checked)}
          />
        </div>
        {props.values.pin ? (
          <label className={styles.field} htmlFor="write-pin-order">
            <span className={styles.fieldLabel}>{copy('pinOrder')}</span>
            <Input
              id="write-pin-order"
              inputMode="numeric"
              onChange={(event) =>
                props.updateField('pinOrder', event.target.value)
              }
              value={props.values.pinOrder}
            />
          </label>
        ) : null}

        <label className={styles.field} htmlFor="write-summary">
          <span className={styles.fieldLabel}>{copy('summary')}</span>
          <TextArea
            autoSize={{ maxRows: 4, minRows: 2 }}
            id="write-summary"
            onChange={(event) =>
              props.updateField('summary', event.target.value)
            }
            value={props.values.summary}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>{copy('byline')}</span>
          <AuthorsPicker
            candidates={props.authorCandidates}
            onChange={(authors) => props.updateField('authors', authors)}
            value={props.values.authors}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>{copy('tags')}</span>
          <Select
            aria-label={copy('tags')}
            classNames={{ trigger: styles.tagTrigger }}
            mode="tags"
            onChange={(value) =>
              props.updateField('tags', (value as string[]).join(', '))
            }
            optionRender={(option) => (
              <span>
                {option.label}{' '}
                <span className={styles.tagOption}>{option.title}</span>
              </span>
            )}
            options={props.tags.map((tag) => ({
              label: tag.name,
              title: String(tag.count),
              value: tag.name,
            }))}
            placeholder={copy('tagsPlaceholder')}
            tokenSeparators={[',', '，']}
            value={splitCommaList(props.values.tags)}
          />
        </div>

        <SourceLangField
          onChange={(value) => props.updateField('sourceLang', value)}
          siteDefault={props.siteDefaultLang}
          value={props.values.sourceLang}
        />
      </div>

      <DrillRow
        extra={
          props.values.image.trim() ? (
            <span
              aria-hidden
              className={styles.drillThumb}
              style={{
                backgroundImage: `url(${JSON.stringify(props.values.image.trim())})`,
              }}
            />
          ) : (
            <span className={styles.drillValue}>{copy('coverUnset')}</span>
          )
        }
        icon={<ImageIcon aria-hidden size={16} />}
        label={copy('sectionCover')}
        onClick={() => props.onViewChange('cover')}
      />
      <DrillRow
        extra={
          <span className={styles.drillValue}>
            {seoConfigured(props.values)
              ? copy('configured')
              : copy('notConfigured')}
          </span>
        }
        icon={<Search aria-hidden size={16} />}
        label={copy('sectionSeo')}
        onClick={() => props.onViewChange('seo')}
      />
      <DrillRow
        extra={
          <span className={styles.drillValue}>
            {advancedSummary(props.values.meta, copy)}
          </span>
        }
        icon={<SlidersHorizontal aria-hidden size={16} />}
        label={copy('sectionAdvanced')}
        onClick={() => props.onViewChange('advanced')}
      />

      {props.hasArticle ? (
        <div className={styles.dangerZone}>
          {props.published ? (
            <Button
              className={styles.dangerAction}
              danger
              disabled={props.unpublishPending}
              htmlType="button"
              loading={props.unpublishPending}
              onClick={props.onUnpublish}
              shape="round"
              type="fill"
            >
              {copy('unpublish')}
            </Button>
          ) : null}
          <Button
            className={styles.dangerAction}
            danger
            disabled={props.deletePending}
            htmlType="button"
            loading={props.deletePending}
            onClick={props.onDelete}
            shape="round"
            type="fill"
          >
            {copy('deletePost')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function PublishDateField(props: {
  onChange: (value: string) => void
  value: string
}) {
  const { locale } = useI18n()
  const openedAt = useState(() => new Date().toISOString())[0]
  const current = new Date(props.value || openedAt)
  const value = Number.isNaN(current.getTime()) ? new Date() : current

  const commit = (next: Date) => {
    const now = new Date()
    props.onChange((next.getTime() > now.getTime() ? now : next).toISOString())
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>
        {writeCopy(locale, 'publishDate')}
      </span>
      <div className={styles.dateRow}>
        <DatePicker
          allowClear={false}
          disabledDate={(date) => isAfterToday(date)}
          needConfirm={false}
          onChange={(date) => {
            if (!date) return
            const next = new Date(value)
            next.setFullYear(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            )
            commit(next)
          }}
          style={{ width: '100%' }}
          value={value}
        />
        <DatePicker.TimePicker
          allowClear={false}
          format="HH:mm"
          needConfirm={false}
          onChange={(date) => {
            if (!date) return
            const next = new Date(value)
            next.setHours(date.getHours(), date.getMinutes(), 0, 0)
            commit(next)
          }}
          style={{ width: '100%' }}
          value={value}
        />
      </div>
    </div>
  )
}

function isAfterToday(date: Date) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return date.getTime() > end.getTime()
}

function DrillRow(props: {
  extra?: ReactNode
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button className={styles.drill} onClick={props.onClick} type="button">
      {props.icon}
      <span className={styles.drillLabel}>{props.label}</span>
      {props.extra}
      <ChevronRight aria-hidden size={16} />
    </button>
  )
}

function CoverFields(
  props: WriteMetaFieldsProps & {
    copy: (key: Parameters<typeof writeCopy>[1]) => string
  },
) {
  return (
    <div className={styles.section}>
      {props.values.image ? (
        <Image
          alt={props.copy('coverAlt')}
          maxHeight={180}
          objectFit="cover"
          src={props.values.image}
          width="100%"
        />
      ) : null}
      <div className={styles.field}>
        <span className={styles.fieldLabel} id="write-cover-label">
          {props.copy('cover')}
        </span>
        <AutoComplete
          aria-labelledby="write-cover-label"
          onChange={(value) => props.updateField('image', value)}
          options={props.coverImages.map((image) => ({
            label: image.src,
            value: image.src,
          }))}
          placeholder="https://"
          style={{ width: '100%' }}
          value={props.values.image}
        />
      </div>
      <CoverGenerationEntry
        currentCover={props.values.image}
        draftId={props.draftId}
        onSelectCover={(url) => props.updateField('image', url)}
        refId={props.refId}
        summary={props.values.summary}
        text={props.values.text}
        title={props.values.title}
      />
    </div>
  )
}

function AdvancedFields(props: WriteMetaFieldsProps) {
  return (
    <div className={styles.section}>
      <TtsGenerationEntry refId={props.refId} />
      <MetaPresetSection
        meta={props.values.meta}
        onUpdateMeta={(meta) => props.updateField('meta', meta)}
        scope="post"
      />
    </div>
  )
}
