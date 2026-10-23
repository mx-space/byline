import {
  Accordion,
  Button,
  Image,
  Input,
  Select,
  Switch,
  Text,
  TextArea,
} from '@lobehub/ui'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { CategoryEntity } from '~/data/resources/category'
import { useI18n } from '~/i18n'
import type { Image as ImageModel } from '~/models/base'

import { writeCopy } from '../../copy'
import { MetaPresetSection } from '../../meta-presets'
import { CoverGenerationEntry } from '../cover-generation/CoverGenerationEntry'
import { AuthorsPicker, SeoFields, SourceLangField } from '../PostBylineFields'
import { TtsGenerationEntry } from '../tts/TtsGenerationEntry'
import { writeChromeStyles as styles } from './styles'

export interface WriteRailValues {
  authors: string[]
  categoryId: string
  image: string
  meta: Record<string, unknown>
  pin: boolean
  pinOrder: string
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
  draftId?: string
  generatePending: boolean
  hasArticle: boolean
  onGenerate: () => void
  onRetryCategories: () => void
  onUnpublish: () => void
  publicPath: string
  published: boolean
  refId?: string
  siteDefaultLang: string
  slugPrefix: string
  tags: Array<{ count: number; name: string }>
  unpublishPending: boolean
  updateField: (
    key: keyof WriteRailValues,
    value: WriteRailValues[keyof WriteRailValues],
  ) => void
  values: WriteRailValues
}

const DEFAULT_OPEN = ['publish', 'basics', 'summary']

function splitCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function WriteMetaFields(props: WriteMetaFieldsProps) {
  const { locale } = useI18n()
  const navigate = useNavigate()
  const copy = (
    key: Parameters<typeof writeCopy>[1],
    values?: Record<string, number | string>,
  ) => writeCopy(locale, key, values)
  const canGenerate =
    props.values.text.trim().length > 0 &&
    (!props.values.title.trim() || !props.values.slug.trim())

  const publishSection = (
    <div className={styles.section}>
      {props.published && props.publicPath ? (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{copy('liveAt')}</span>
          <a href={props.publicPath} rel="noreferrer" target="_blank">
            <Text as="span" ellipsis={{ tooltip: props.publicPath }}>
              {props.publicPath}
            </Text>
          </a>
        </div>
      ) : (
        <span className={styles.fieldHint}>{copy('notPublished')}</span>
      )}
      {props.published && props.hasArticle ? (
        <Button
          block
          danger
          disabled={props.unpublishPending}
          htmlType="button"
          loading={props.unpublishPending}
          onClick={props.onUnpublish}
        >
          {copy('unpublish')}
        </Button>
      ) : null}
      {props.published && props.publicPath ? (
        <Button
          block
          htmlType="button"
          icon={ExternalLink}
          onClick={() =>
            window.open(props.publicPath, '_blank', 'noopener,noreferrer')
          }
          type="text"
        >
          {copy('openLive')}
        </Button>
      ) : null}
    </div>
  )

  const basicsSection = (
    <div className={styles.section}>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{copy('byline')}</span>
        <AuthorsPicker
          candidates={props.authorCandidates}
          onChange={(authors) => props.updateField('authors', authors)}
          value={props.values.authors}
        />
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
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="write-slug">
          {copy('slug')}
        </label>
        <Input
          id="write-slug"
          onChange={(event) => props.updateField('slug', event.target.value)}
          placeholder={copy('slugPlaceholder')}
          required
          value={props.values.slug}
        />
        <span className={styles.fieldHint}>
          {props.slugPrefix}
          {props.values.slug || copy('slugPlaceholder')}
        </span>
        {canGenerate ? (
          <Button
            htmlType="button"
            loading={props.generatePending}
            onClick={props.onGenerate}
            size="small"
          >
            {props.values.title.trim()
              ? copy('generateSlug')
              : copy('generateTitleSlug')}
          </Button>
        ) : null}
      </div>
    </div>
  )

  const summarySection = (
    <div className={styles.section}>
      <label className={styles.field} htmlFor="write-summary">
        <span className={styles.fieldLabel}>{copy('summary')}</span>
        <TextArea
          autoSize={{ maxRows: 8, minRows: 3 }}
          id="write-summary"
          onChange={(event) => props.updateField('summary', event.target.value)}
          value={props.values.summary}
        />
      </label>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{copy('tags')}</span>
        <Select
          aria-label={copy('tags')}
          mode="tags"
          onChange={(value) =>
            props.updateField('tags', (value as string[]).join(', '))
          }
          options={props.tags.map((tag) => ({
            label: (
              <span>
                {tag.name} <span className={styles.tagOption}>{tag.count}</span>
              </span>
            ),
            value: tag.name,
          }))}
          placeholder={copy('tagsPlaceholder')}
          tokenSeparators={[',', '，']}
          value={splitCommaList(props.values.tags)}
        />
      </div>
    </div>
  )

  const coverSection = (
    <div className={styles.section}>
      {props.values.image ? (
        <Image
          alt={copy('coverAlt')}
          maxHeight={180}
          objectFit="cover"
          src={props.values.image}
          width="100%"
        />
      ) : null}
      <label className={styles.field} htmlFor="write-cover">
        <span className={styles.fieldLabel}>{copy('cover')}</span>
        <Input
          id="write-cover"
          list="write-cover-images"
          onChange={(event) => props.updateField('image', event.target.value)}
          placeholder="https://"
          value={props.values.image}
        />
        {props.coverImages.length > 0 ? (
          <datalist id="write-cover-images">
            {props.coverImages.map((image) => (
              <option key={image.src} value={image.src} />
            ))}
          </datalist>
        ) : null}
      </label>
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

  const seoSection = (
    <div className={styles.section}>
      <SeoFields
        onChange={(key, value) => props.updateField(key, value)}
        titlePlaceholder={props.values.title}
        value={props.values}
      />
    </div>
  )

  const advancedSection = (
    <div className={styles.section}>
      <SourceLangField
        onChange={(value) => props.updateField('sourceLang', value)}
        siteDefault={props.siteDefaultLang}
        value={props.values.sourceLang}
      />
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
      <TtsGenerationEntry refId={props.refId} />
      <MetaPresetSection
        meta={props.values.meta}
        onUpdateMeta={(meta) => props.updateField('meta', meta)}
        scope="post"
      />
    </div>
  )

  return (
    <div className={styles.settings}>
      <Accordion
        defaultValue={DEFAULT_OPEN}
        items={[
          {
            children: publishSection,
            key: 'publish',
            title: copy('sectionPublish'),
          },
          {
            children: basicsSection,
            key: 'basics',
            title: copy('sectionBasics'),
          },
          {
            children: summarySection,
            key: 'summary',
            title: copy('sectionSummary'),
          },
          { children: coverSection, key: 'cover', title: copy('sectionCover') },
          { children: seoSection, key: 'seo', title: copy('sectionSeo') },
          {
            children: advancedSection,
            key: 'advanced',
            title: copy('sectionAdvanced'),
          },
        ]}
        multiple
        variant="borderless"
      />
    </div>
  )
}
