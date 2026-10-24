import { Alert, Input, TextArea, toast } from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'

import type { DynamicCatalog } from '~/api/dynamic-components'
import {
  registerDynamicComponentEntry,
  updateDynamicComponentEntry,
} from '~/api/dynamic-components'
import { uploadFile } from '~/api/files'
import { ApiRequestError } from '~/api/http'
import { useI18n } from '~/i18n'
import { formatJson, parseJsonObject } from '~/lib/dynamic-props'
import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/site-button'

import type { DynamicComponentItem } from '../types/dynamic-components'
import { styles } from './styles'

const ERROR_KEYS = {
  DYNAMIC_COMPONENT_NAME_CONFLICT:
    'dynamicComponents.editor.error.nameConflict',
  DYNAMIC_COMPONENT_URL_CONFLICT: 'dynamicComponents.editor.error.urlConflict',
} as const

interface EditorProps {
  item: DynamicComponentItem | null
}

export interface DynamicComponentEditorResult {
  catalog: DynamicCatalog
  url: string
}

function Field(props: {
  children: ReactNode
  hint?: ReactNode
  htmlFor: string
  label: ReactNode
  required?: boolean
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={props.htmlFor}>
        {props.label}
        {props.required ? ' *' : null}
      </label>
      {props.children}
      {props.hint ? <p className={styles.fieldHint}>{props.hint}</p> : null}
    </div>
  )
}

function DynamicComponentEditorModal({ item }: EditorProps) {
  const { t } = useI18n()
  const modal = useModal<DynamicComponentEditorResult>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const idPrefix = useId()
  const fieldId = (name: string) => `${idPrefix}-${name}`

  const [name, setName] = useState(item?.name ?? '')
  const [url, setUrl] = useState(item?.url ?? '')
  const [initialHeight, setInitialHeight] = useState(
    String(item?.initialHeight ?? 240),
  )
  const [description, setDescription] = useState(item?.description ?? '')
  const [schemaText, setSchemaText] = useState(
    formatJson(item?.propsSchema ?? {}),
  )
  const [error, setError] = useState('')

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'file', true),
    onError: () => setError(t('dynamicComponents.editor.uploadFailed')),
    onSuccess: (uploaded) => setUrl(uploaded.url),
  })

  const saveMutation = useMutation({
    mutationFn: async (entry: {
      description: string
      initialHeight: number
      name: string
      propsSchema: Record<string, unknown>
      url: string
    }) =>
      item
        ? updateDynamicComponentEntry(item.id, entry)
        : registerDynamicComponentEntry(entry),
    onError: (cause: unknown) => {
      const key =
        cause instanceof ApiRequestError
          ? ERROR_KEYS[cause.code as keyof typeof ERROR_KEYS]
          : undefined
      setError(
        key ? t(key) : cause instanceof Error ? cause.message : String(cause),
      )
    },
    onSuccess: (catalog, entry) => {
      toast.success(
        t(
          item
            ? 'dynamicComponents.toast.updated'
            : 'dynamicComponents.toast.created',
        ),
      )
      modal.close({ catalog, url: entry.url })
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const height = Number(initialHeight)
    const propsSchema = parseJsonObject(schemaText)
    const problem = !name.trim()
      ? 'dynamicComponents.editor.validate.nameRequired'
      : !url.trim()
        ? 'dynamicComponents.editor.validate.urlRequired'
        : !Number.isInteger(height) || height < 0 || height > 10_000
          ? 'dynamicComponents.editor.validate.heightInvalid'
          : null
    if (problem) {
      setError(t(problem))
      return
    }
    if (!propsSchema) {
      setError(t('dynamicComponents.editor.validate.schemaInvalid'))
      return
    }
    setError('')
    saveMutation.mutate({
      description: description.trim(),
      initialHeight: height,
      name: name.trim(),
      propsSchema,
      url: url.trim(),
    })
  }

  const busy = saveMutation.isPending || uploadMutation.isPending

  return (
    <form
      aria-busy={busy}
      className={styles.editorForm}
      onSubmit={handleSubmit}
    >
      <ModalHeader
        title={t(
          item
            ? 'dynamicComponents.editor.editTitle'
            : 'dynamicComponents.editor.createTitle',
        )}
      />

      <div className={styles.editorBody}>
        <Field
          htmlFor={fieldId('name')}
          label={t('dynamicComponents.editor.name')}
          required
        >
          <Input
            id={fieldId('name')}
            onChange={(event) => setName(event.target.value)}
            placeholder="PriceTable"
            required
            value={name}
          />
        </Field>

        <Field
          hint={t('dynamicComponents.editor.urlHint')}
          htmlFor={fieldId('url')}
          label={t('dynamicComponents.editor.url')}
          required
        >
          <div className={styles.uploadRow}>
            <Input
              className={styles.uploadInput}
              classNames={{ input: styles.monoInput }}
              id={fieldId('url')}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://cdn.example.com/widget.js"
              required
              spellCheck={false}
              value={url}
            />
            <Button
              icon={Upload}
              loading={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {t(
                uploadMutation.isPending
                  ? 'dynamicComponents.editor.uploading'
                  : 'dynamicComponents.editor.upload',
              )}
            </Button>
            <input
              accept=".js,.mjs,text/javascript"
              className={styles.hiddenInput}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                setError('')
                uploadMutation.mutate(file)
              }}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </Field>

        <Field
          htmlFor={fieldId('height')}
          label={t('dynamicComponents.editor.initialHeight')}
          required
        >
          <Input
            id={fieldId('height')}
            inputMode="numeric"
            min={0}
            onChange={(event) => setInitialHeight(event.target.value)}
            required
            type="number"
            value={initialHeight}
          />
        </Field>

        <Field
          hint={t('dynamicComponents.editor.descriptionHint')}
          htmlFor={fieldId('description')}
          label={t('dynamicComponents.editor.description')}
        >
          <TextArea
            autoSize={{ maxRows: 8, minRows: 3 }}
            id={fieldId('description')}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </Field>

        <Field
          htmlFor={fieldId('schema')}
          label={t('dynamicComponents.editor.propsSchema')}
        >
          <TextArea
            autoSize={{ maxRows: 20, minRows: 8 }}
            className={styles.monoInput}
            id={fieldId('schema')}
            onChange={(event) => setSchemaText(event.target.value)}
            spellCheck={false}
            value={schemaText}
          />
        </Field>
      </div>

      {error ? (
        <div className={styles.editorError}>
          <Alert showIcon title={error} type="error" />
        </div>
      ) : null}

      <ModalFooter>
        <Button onClick={() => modal.dismiss()}>{t('common.cancel')}</Button>
        <Button
          disabled={uploadMutation.isPending}
          htmlType="submit"
          loading={saveMutation.isPending}
          type="primary"
        >
          {t(
            saveMutation.isPending
              ? 'dynamicComponents.editor.saving'
              : item
                ? 'common.save'
                : 'common.create',
          )}
        </Button>
      </ModalFooter>
    </form>
  )
}

export async function presentDynamicComponentEditor(
  item: DynamicComponentItem | null,
): Promise<DynamicComponentEditorResult | undefined> {
  return await present<EditorProps, DynamicComponentEditorResult>(
    DynamicComponentEditorModal,
    { item },
    { modalProps: { popupStyle: { width: 'min(94vw, 40rem)' } } },
  )
}
