import { Input, TextArea } from '@lobehub/ui'
import { mxLexicalToMarkdown } from '@mx-space/editor'
import type { SerializedEditorState } from 'lexical'
import { lazy, Suspense, useMemo, useState } from 'react'

import type { AIInsights, AISummary, AITranslation } from '~/api/ai'
import { SeoFields } from '~/features/write/components/PostBylineFields'
import { emptyOr } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import type { ProductBodyProps } from '../components/article-grouped/types'
import { useAiCopy } from '../copy'
import { aiStyles } from '../shell/styles'
import { seoFromFields, seoToFields } from '../utils/translation-seo'

const LexicalEmbeddedEditor = lazy(async () => {
  await import('~/vendor/rich-editor/core/style')
  return import('../components/article-grouped/LexicalEmbeddedEditor')
})

function parseLexical(raw?: string | null): SerializedEditorState | undefined {
  if (!raw || !raw.trim()) return undefined
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as SerializedEditorState
    }
  } catch {
    return undefined
  }
  return undefined
}

export function TranslationBody(props: ProductBodyProps<AITranslation>) {
  const copy = useAiCopy()
  const item = props.item
  const [title, setTitle] = useState(item.title)
  const [subtitle, setSubtitle] = useState(item.subtitle ?? '')
  const [summary, setSummary] = useState(item.summary ?? '')
  const [seo, setSeo] = useState(() => seoToFields(item.seo))
  const initialLexical = useMemo(
    () => parseLexical(item.content),
    [item.content],
  )
  const [lexicalContent, setLexicalContent] = useState<string | undefined>(
    item.content ?? undefined,
  )
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!title.trim()) {
      setError(copy('titleRequired'))
      return
    }
    if (!parseLexical(lexicalContent)) {
      setError(copy('bodyRequired'))
      return
    }
    setError(null)
    const next: AITranslation = {
      ...item,
      seo: seoFromFields(seo),
      subtitle: subtitle || undefined,
      summary: summary || undefined,
      text: mxLexicalToMarkdown(lexicalContent!),
      title,
      content: lexicalContent,
    }
    void props.onSubmit(next)
  }

  return (
    <div className={aiStyles.stack}>
      {props.editing ? (
        <>
          <label className={aiStyles.field}>
            <span className={aiStyles.label}>{copy('fieldTitle')}</span>
            <Input
              onChange={(event) =>
                setTitle(typeof event === 'string' ? event : event.target.value)
              }
              value={title}
            />
          </label>
          <label className={aiStyles.field}>
            <span className={aiStyles.label}>{copy('fieldSubtitle')}</span>
            <Input
              onChange={(event) =>
                setSubtitle(
                  typeof event === 'string' ? event : event.target.value,
                )
              }
              value={subtitle}
            />
          </label>
          <label className={aiStyles.field}>
            <span className={aiStyles.label}>{copy('fieldSummary')}</span>
            <TextArea
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              value={summary}
            />
          </label>
          <div className={aiStyles.field}>
            <span className={aiStyles.label}>{copy('fieldSeo')}</span>
            <SeoFields
              onChange={(key, value) =>
                setSeo((current) => ({ ...current, [key]: value }))
              }
              titlePlaceholder={title}
              value={seo}
            />
          </div>
          <div className={aiStyles.field}>
            <span className={aiStyles.label}>{copy('fieldBody')}</span>
            {initialLexical ? (
              <Suspense
                fallback={
                  <p className={aiStyles.meta}>{copy('loadingPost')}</p>
                }
              >
                <LexicalEmbeddedEditor
                  contentClassName={aiStyles.editor}
                  initialValue={initialLexical}
                  onChange={(value) => setLexicalContent(JSON.stringify(value))}
                />
              </Suspense>
            ) : (
              <p className={aiStyles.meta}>{copy('bodyRequired')}</p>
            )}
          </div>
          {error ? <p className={aiStyles.meta}>{error}</p> : null}
          <SaveActions
            label={copy('saveTranslation')}
            onCancel={props.onCancel}
            onSave={submit}
            submitting={props.submitting}
          />
        </>
      ) : (
        <>
          <h3 className={aiStyles.translationTitle}>{emptyOr(item.title)}</h3>
          {item.subtitle ? (
            <p className={aiStyles.meta}>{item.subtitle}</p>
          ) : null}
          {item.summary ? (
            <p className={aiStyles.prose}>{item.summary}</p>
          ) : null}
          {initialLexical ? (
            <Suspense
              fallback={<p className={aiStyles.meta}>{copy('loadingPost')}</p>}
            >
              <LexicalEmbeddedEditor
                contentClassName={aiStyles.editor}
                initialValue={initialLexical}
              />
            </Suspense>
          ) : (
            <p className={aiStyles.prose}>{copy('bodyRequired')}</p>
          )}
        </>
      )}
    </div>
  )
}

export function SummaryBody(props: ProductBodyProps<AISummary>) {
  const copy = useAiCopy()
  const [summary, setSummary] = useState(props.item.summary)
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!summary.trim()) {
      setError(copy('summaryRequired'))
      return
    }
    setError(null)
    void props.onSubmit({ ...props.item, summary })
  }

  if (!props.editing) {
    return <p className={aiStyles.summaryRead}>{emptyOr(props.item.summary)}</p>
  }

  return (
    <div className={aiStyles.stack}>
      <label className={aiStyles.field}>
        <span className={aiStyles.label}>{copy('kindSummary')}</span>
        <TextArea
          onChange={(event) => setSummary(event.target.value)}
          rows={10}
          value={summary}
        />
      </label>
      {error ? <p className={aiStyles.meta}>{error}</p> : null}
      <SaveActions
        label={copy('saveSummary')}
        onCancel={props.onCancel}
        onSave={submit}
        submitting={props.submitting}
      />
    </div>
  )
}

export function InsightsBody(props: ProductBodyProps<AIInsights>) {
  const copy = useAiCopy()
  const [content, setContent] = useState(props.item.content)
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!content.trim()) {
      setError(copy('insightsRequired'))
      return
    }
    setError(null)
    void props.onSubmit({ ...props.item, content })
  }

  if (!props.editing) {
    return (
      <div className={aiStyles.stack}>
        {props.item.isTranslation && props.item.sourceLang ? (
          <p className={aiStyles.meta}>
            {copy('translatedFrom', { lang: props.item.sourceLang })}
          </p>
        ) : null}
        <p className={aiStyles.insightsRead}>{emptyOr(props.item.content)}</p>
      </div>
    )
  }

  return (
    <div className={aiStyles.stack}>
      <label className={aiStyles.field}>
        <span className={aiStyles.label}>{copy('kindInsights')}</span>
        <TextArea
          onChange={(event) => setContent(event.target.value)}
          rows={18}
          value={content}
        />
      </label>
      {error ? <p className={aiStyles.meta}>{error}</p> : null}
      <SaveActions
        label={copy('saveInsights')}
        onCancel={props.onCancel}
        onSave={submit}
        submitting={props.submitting}
      />
    </div>
  )
}

function SaveActions(props: {
  label: string
  onCancel: () => void
  onSave: () => void
  submitting: boolean
}) {
  const copy = useAiCopy()
  return (
    <div className={aiStyles.actions}>
      <Button htmlType="button" onClick={props.onCancel}>
        {copy('cancel')}
      </Button>
      <Button
        htmlType="button"
        loading={props.submitting}
        onClick={props.onSave}
        type="primary"
      >
        {props.label}
      </Button>
    </div>
  )
}
