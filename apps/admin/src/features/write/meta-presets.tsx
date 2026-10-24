import {
  ActionIcon,
  createStaticStyles,
  Empty,
  Highlighter,
  Input,
  Segmented,
  TextArea as LobeTextArea,
  toast,
} from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { getMetaPresets } from '~/api/meta-presets'
import { useI18n } from '~/i18n'
import type { TranslationKey } from '~/i18n/types'
import type {
  MetaFieldOption,
  MetaPresetChild,
  MetaPresetField,
  MetaPresetScope,
} from '~/models/meta-preset'
import { Modal, ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { FormSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { CodeEditor } from '~/ui/primitives/code-editor'
import { SelectField } from '~/ui/primitives/select'
import { FormSwitch } from '~/ui/primitives/switch'
import { TextArea, TextInput } from '~/ui/primitives/text-field'
import { Button as LobeButton } from '~/ui/site-button'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uab547bd4: css`
    display: grid;
    gap: 0.75rem;
  `,
  u1b728c04: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  ue5746cdf: css`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    min-width: 0;

    padding-block: 6px;

    font-size: ${cssVar.fontSize};
    line-height: ${cssVar.lineHeight};
    color: ${cssVar.colorText};
    text-align: left;
  `,
  u34fbabce: css`
    margin-inline-start: 8px;
    color: ${cssVar.colorTextTertiary};
  `,
  ua005bc18: css`
    width: 1rem;
    height: 1rem;
    color: ${cssVar.colorTextSecondary};
    transition: transform 0.15s ease;
  `,
  u3350916b: css`
    rotate: 180deg;
  `,
  u6ecb3128: css`
    height: 1.75rem;
    flex-shrink: 0;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u2ad29a22: css`
    display: grid;
    gap: 12px;
  `,
  kvField: css`
    display: grid;
    gap: 8px;
    min-width: 0;

    > * {
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
  `,
  kvKey: css`
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;

    > :first-child {
      flex: 1;
      min-width: 0;
    }
  `,
  u048ab586: css`
    margin-bottom: 0.75rem;
    display: inline-flex;
    gap: 0.25rem;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorText} 60%,
        transparent
      );
    }
  `,
  u084b1e36: css`
    border-radius: 6px;
    padding-inline: 0.75rem;
    padding-block: 0.25rem;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  `,
  ua94dd009: css`
    box-shadow: ${cssVar.boxShadowTertiary};
    background-color: ${cssVar.colorBgContainer};
    color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  ub7819fc6: css`
    color: ${cssVar.colorTextSecondary};
    &:hover {
      color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u3c4c1a59: css`
    display: grid;
    gap: 1rem;
  `,
  uf59d50f5: css`
    display: grid;
    gap: 0.375rem;
  `,
  u78942561: css`
    display: grid;
    gap: 0.125rem;
  `,
  u3a98e768: css`
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  ud43cf347: css`
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
  `,
  u6a9369f3: css`
    height: 2.25rem;
    &:focus {
      border-color: ${cssVar.colorTextSecondary};
    }
  `,
  uaf92a141: css`
    min-height: 5rem;
    &:focus {
      border-color: ${cssVar.colorTextSecondary};
    }
  `,
  u27846a89: css`
    display: grid;
    gap: 0.5rem;
  `,
  uf4c3da60: css`
    margin-left: 0.75rem;
    display: grid;
    gap: 0.75rem;
    border-left-width: 2px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding-left: 0.75rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  u3238b1a9: css`
    min-height: 4rem;
    &:focus {
      border-color: ${cssVar.colorTextSecondary};
    }
  `,
  u4b23e247: css`
    display: grid;
    gap: 0.25rem;
  `,
  u0425c249: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorTextSecondary};
    }
  `,
  u629154da: css`
    display: grid;
    gap: 0.375rem;
    @media (min-width: 640px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  u6978b7c6: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  `,
  ubd8f1a40: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.375rem;
    padding-block: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorText};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u66316002: css`
    border-radius: 0.25rem;
    padding: 0.125rem;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &:hover {
      background-color: ${cssVar.colorText};
    }
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  u152c1189: css`
    display: flex;
    gap: 0.5rem;
  `,
  ub8a627aa: css`
    height: 2rem;
    &:focus {
      border-color: ${cssVar.colorTextSecondary};
    }
  `,
  u9756bfd7: css`
    height: 2rem;
    padding-inline: 0.5rem;
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u327cfeab: css`
    padding-block: 0.5rem;
    text-align: center;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u6cfc7e6a: css`
    display: grid;
    gap: 8px;
    min-width: 0;
  `,
  ub7192aed: css`
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorTextSecondary};
    }
    :where(.dark, .dark *) &:hover {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u5a1fe526: css`
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  u780c0472: css`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
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
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
    :where(.dark, .dark *) &:hover {
      background-color: ${cssVar.colorText};
    }
  `,
  u558f6434: css`
    max-height: 12rem;
  `,
  u2b5fa9a9: css`
    min-height: 0px;
    flex: 1 1 0%;
  `,
}))

type MetaRecord = Record<string, unknown>

interface KeyValuePair {
  id: string
  key: string
  value: string
}

let pairIdSeq = 0
const nextPairId = () => `pair-${++pairIdSeq}`

function jsonStringifyValue(value: unknown) {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function jsonParseLoose(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function metaToPairs(meta: MetaRecord | undefined): KeyValuePair[] {
  if (!meta) return []
  return Object.entries(meta).map(([key, value]) => ({
    id: nextPairId(),
    key,
    value: jsonStringifyValue(value),
  }))
}

function pairsToMeta(pairs: KeyValuePair[]): MetaRecord {
  const next: MetaRecord = {}
  for (const pair of pairs) {
    if (!pair.key || pair.value === '') continue
    next[pair.key] = jsonParseLoose(pair.value)
  }
  return next
}

function metaPresetsQueryKey(scope: MetaPresetScope) {
  return ['meta-presets', { scope, enabledOnly: true }] as const
}

type BuiltinPresetTranslation = {
  children?: Record<
    string,
    { label: TranslationKey; placeholder?: TranslationKey }
  >
  description?: TranslationKey
  label: TranslationKey
  options?: Record<string, TranslationKey>
  placeholder?: TranslationKey
}

const builtinPresetTranslations: Record<string, BuiltinPresetTranslation> = {
  aiGen: {
    description: 'write.meta.builtin.aiGen.description',
    label: 'write.meta.builtin.aiGen.label',
    options: {
      '-1': 'write.meta.builtin.aiGen.option.noAi',
      '0': 'write.meta.builtin.aiGen.option.writingAssistance',
      '1': 'write.meta.builtin.aiGen.option.polishing',
      '2': 'write.meta.builtin.aiGen.option.fullyGenerated',
      '3': 'write.meta.builtin.aiGen.option.storyOrganization',
      '4': 'write.meta.builtin.aiGen.option.titleGeneration',
      '5': 'write.meta.builtin.aiGen.option.proofreading',
      '6': 'write.meta.builtin.aiGen.option.inspirationSource',
      '7': 'write.meta.builtin.aiGen.option.rewriting',
      '8': 'write.meta.builtin.aiGen.option.generatedImagery',
      '9': 'write.meta.builtin.aiGen.option.dictation',
    },
  },
  banner: {
    children: {
      className: {
        label: 'write.meta.builtin.banner.className.label',
        placeholder: 'write.meta.builtin.banner.className.placeholder',
      },
      message: { label: 'write.meta.builtin.banner.message.label' },
      type: { label: 'write.meta.builtin.banner.type.label' },
    },
    description: 'write.meta.builtin.banner.description',
    label: 'write.meta.builtin.banner.label',
  },
  cover: { label: 'write.meta.builtin.cover.label' },
  keywords: {
    label: 'write.meta.builtin.keywords.label',
    placeholder: 'write.meta.builtin.keywords.placeholder',
  },
  style: {
    label: 'write.meta.builtin.style.label',
    placeholder: 'write.meta.builtin.style.placeholder',
  },
}

function localizeBuiltinPreset(
  field: MetaPresetField,
  t: ReturnType<typeof useI18n>['t'],
): MetaPresetField {
  const translation = field.isBuiltin
    ? builtinPresetTranslations[field.key]
    : undefined
  if (!translation) return field

  return {
    ...field,
    children: field.children?.map((child) => {
      const childTranslation = translation.children?.[child.key]
      return childTranslation
        ? {
            ...child,
            label: t(childTranslation.label),
            placeholder: childTranslation.placeholder
              ? t(childTranslation.placeholder)
              : child.placeholder,
          }
        : child
    }),
    description: translation.description
      ? t(translation.description)
      : undefined,
    label: t(translation.label),
    options: field.options?.map((option) => {
      const optionKey = translation.options?.[String(option.value)]
      return optionKey ? { ...option, label: t(optionKey) } : option
    }),
    placeholder: translation.placeholder
      ? t(translation.placeholder)
      : field.placeholder,
  }
}

export interface MetaPresetSectionProps {
  meta: MetaRecord
  onUpdateMeta: (meta: MetaRecord) => void
  scope: MetaPresetScope
}

export function MetaPresetSection(props: MetaPresetSectionProps) {
  const { meta, onUpdateMeta, scope } = props
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'preset' | 'json'>('preset')
  const [showJsonModal, setShowJsonModal] = useState(false)
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  const presetsQuery = useQuery({
    queryFn: () => getMetaPresets({ enabledOnly: true, scope }),
    queryKey: metaPresetsQueryKey(scope),
    staleTime: 60_000,
  })

  const presets = useMemo<MetaPresetField[]>(
    () => (Array.isArray(presetsQuery.data) ? presetsQuery.data : []),
    [presetsQuery.data],
  )

  const itemCount = Object.keys(meta).length

  const updateFieldValue = (key: string, value: unknown) => {
    // Object field: an empty object represents "enabled but unfilled" state and must remain in meta.
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    if (isEmpty) {
      const { [key]: _drop, ...rest } = meta
      onUpdateMeta(rest)
    } else {
      onUpdateMeta({ ...meta, [key]: value })
    }
  }

  return (
    <div className={lobeStyles.uab547bd4}>
      <div className={lobeStyles.u1b728c04}>
        <button
          aria-expanded={expanded}
          className={lobeStyles.ue5746cdf}
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          <span>
            {t('write.meta.section.title')}
            {itemCount > 0 ? (
              <span className={lobeStyles.u34fbabce}>
                {t('write.meta.section.itemCount', { count: itemCount })}
              </span>
            ) : null}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              lobeStyles.ua005bc18,
              expanded && lobeStyles.u3350916b,
            )}
          />
        </button>
        <Button
          onClick={() => setShowJsonModal(true)}
          type="button"
          variant="ghost"
        >
          {t('write.meta.section.jsonEdit')}
        </Button>
      </div>

      {expanded ? (
        <div className={lobeStyles.u2ad29a22}>
          <Segmented
            block
            onChange={(value) => setActiveTab(value as 'preset' | 'json')}
            options={[
              { label: t('write.meta.tab.preset'), value: 'preset' },
              { label: t('write.meta.tab.json'), value: 'json' },
            ]}
            value={activeTab}
          />

          {activeTab === 'preset' ? (
            <PresetFieldList
              loading={presetsQuery.isLoading}
              meta={meta}
              onUpdateField={updateFieldValue}
              presets={presets}
            />
          ) : (
            <KeyValuePairList
              meta={meta}
              onUpdateMeta={onUpdateMeta}
              onTogglePreview={() => setShowJsonPreview((v) => !v)}
              previewOpen={showJsonPreview}
            />
          )}
        </div>
      ) : null}

      <JsonEditorDialog
        meta={meta}
        onClose={() => setShowJsonModal(false)}
        onSubmit={(next) => {
          onUpdateMeta(next)
          setShowJsonModal(false)
        }}
        open={showJsonModal}
      />
    </div>
  )
}

function PresetFieldList(props: {
  loading: boolean
  meta: MetaRecord
  onUpdateField: (key: string, value: unknown) => void
  presets: MetaPresetField[]
}) {
  const { t } = useI18n()
  if (props.loading) {
    return <FormSkeleton label={t('common.loading')} rows={3} />
  }
  if (props.presets.length === 0) {
    return <Empty title={t('write.meta.preset.empty')} />
  }
  return (
    <div className={lobeStyles.u3c4c1a59}>
      {props.presets.map((field) => {
        const localizedField = localizeBuiltinPreset(field, t)
        return (
          <PresetFieldRenderer
            field={localizedField}
            key={field.id}
            onChange={(value) => props.onUpdateField(field.key, value)}
            value={props.meta[field.key]}
          />
        )
      })}
    </div>
  )
}

function PresetFieldRenderer(props: {
  field: MetaPresetField
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { field, onChange, value } = props
  if (field.type === 'object') {
    return (
      <ObjectFieldRenderer field={field} onChange={onChange} value={value} />
    )
  }
  return (
    <div className={lobeStyles.uf59d50f5}>
      <FieldLabel description={field.description} label={field.label} />
      <FieldControl field={field} onChange={onChange} value={value} />
    </div>
  )
}

function FieldLabel(props: { description?: string; label: string }) {
  return (
    <div className={lobeStyles.u78942561}>
      <span className={lobeStyles.u3a98e768}>{props.label}</span>
      {props.description ? (
        <span className={lobeStyles.ud43cf347}>{props.description}</span>
      ) : null}
    </div>
  )
}

function FieldControl(props: {
  field: MetaPresetField
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { field, onChange, value } = props
  switch (field.type) {
    case 'text':
    case 'url': {
      return (
        <TextInput
          controlClassName={lobeStyles.u6a9369f3}
          onChange={onChange}
          placeholder={
            field.placeholder || (field.type === 'url' ? 'https://...' : '')
          }
          value={typeof value === 'string' ? value : ''}
        />
      )
    }
    case 'textarea': {
      return (
        <TextArea
          controlClassName={lobeStyles.uaf92a141}
          onChange={onChange}
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
        />
      )
    }
    case 'number': {
      return (
        <TextInput
          controlClassName={lobeStyles.u6a9369f3}
          inputMode="decimal"
          onChange={(v) => onChange(v === '' ? undefined : Number(v))}
          placeholder={field.placeholder}
          type="number"
          value={
            typeof value === 'number' || typeof value === 'string'
              ? String(value)
              : ''
          }
        />
      )
    }
    case 'boolean': {
      return (
        <FormSwitch
          checked={value === true}
          label={field.label}
          onCheckedChange={onChange}
        />
      )
    }
    case 'select': {
      const options = field.options ?? []
      return (
        <SelectField
          onValueChange={onChange as (v: string) => void}
          options={options.map((o) => ({
            label: o.label,
            value: String(o.value),
          }))}
          value={value == null ? '' : String(value)}
        />
      )
    }
    case 'multi-select': {
      return (
        <MultiSelectField
          allowCustom={false}
          field={field}
          onChange={onChange}
          value={value}
        />
      )
    }
    case 'checkbox': {
      return (
        <MultiSelectField
          allowCustom={Boolean(field.allowCustomOption)}
          field={field}
          onChange={onChange}
          value={value}
        />
      )
    }
    case 'tags': {
      return <TagsInput onChange={onChange} value={normalizeToArray(value)} />
    }
    default: {
      return (
        <TextInput
          controlClassName={lobeStyles.u6a9369f3}
          onChange={onChange}
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
        />
      )
    }
  }
}

function ObjectFieldRenderer(props: {
  field: MetaPresetField
  onChange: (value: MetaRecord | undefined) => void
  value: unknown
}) {
  const isEnabled = props.value !== undefined && props.value !== null
  const current =
    isEnabled && typeof props.value === 'object' && !Array.isArray(props.value)
      ? (props.value as MetaRecord)
      : {}

  const toggle = (enabled: boolean) => {
    props.onChange(enabled ? {} : undefined)
  }

  const updateChild = (key: string, childValue: unknown) => {
    const isEmpty = childValue == null || childValue === ''
    if (isEmpty) {
      const { [key]: _drop, ...rest } = current
      props.onChange(rest)
    } else {
      props.onChange({ ...current, [key]: childValue })
    }
  }

  return (
    <div className={lobeStyles.u27846a89}>
      <FormSwitch
        checked={isEnabled}
        description={props.field.description}
        label={props.field.label}
        onCheckedChange={toggle}
      />
      {isEnabled && props.field.children ? (
        <div className={lobeStyles.uf4c3da60}>
          {props.field.children.map((child) => (
            <ChildFieldRenderer
              child={child}
              key={child.key}
              onChange={(v) => updateChild(child.key, v)}
              value={current[child.key]}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ChildFieldRenderer(props: {
  child: MetaPresetChild
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { child, onChange, value } = props
  const control = () => {
    switch (child.type) {
      case 'textarea': {
        return (
          <TextArea
            controlClassName={lobeStyles.u3238b1a9}
            onChange={onChange}
            placeholder={child.placeholder}
            value={typeof value === 'string' ? value : ''}
          />
        )
      }
      case 'number': {
        return (
          <TextInput
            controlClassName={lobeStyles.u6a9369f3}
            inputMode="decimal"
            onChange={(v) => onChange(v === '' ? undefined : Number(v))}
            placeholder={child.placeholder}
            type="number"
            value={
              typeof value === 'number' || typeof value === 'string'
                ? String(value)
                : ''
            }
          />
        )
      }
      case 'select': {
        const options = child.options ?? []
        return (
          <SelectField
            onValueChange={onChange as (v: string) => void}
            options={options.map((o) => ({
              label: o.label,
              value: String(o.value),
            }))}
            value={value == null ? '' : String(value)}
          />
        )
      }
      default: {
        return (
          <TextInput
            controlClassName={lobeStyles.u6a9369f3}
            onChange={onChange}
            placeholder={child.placeholder}
            value={typeof value === 'string' ? value : ''}
          />
        )
      }
    }
  }

  return (
    <div className={lobeStyles.u4b23e247}>
      <span className={lobeStyles.u0425c249}>{child.label}</span>
      {control()}
    </div>
  )
}

function MultiSelectField(props: {
  allowCustom: boolean
  field: MetaPresetField
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { t } = useI18n()
  const options = props.field.options ?? []
  const optionValueSet = useMemo(
    () => new Set(options.map((o) => o.value)),
    [options],
  )
  const exclusiveValues = useMemo(
    () => new Set(options.filter((o) => o.exclusive).map((o) => o.value)),
    [options],
  )

  const all = normalizeToArray(props.value)
  const customs = all.filter(
    (v) => typeof v === 'string' && !optionValueSet.has(v),
  ) as string[]
  const [customInput, setCustomInput] = useState('')

  const isChecked = (option: MetaFieldOption) => all.includes(option.value)

  const toggleOption = (option: MetaFieldOption, checked: boolean) => {
    let next = all.filter((v) => v !== option.value)
    if (checked) {
      if (option.exclusive) {
        next = [option.value]
      } else {
        next = next.filter((v) => !exclusiveValues.has(v))
        next.push(option.value)
      }
    }
    props.onChange(normalizeFromArray(next))
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed || all.includes(trimmed)) {
      setCustomInput('')
      return
    }
    const next = all.filter((v) => !exclusiveValues.has(v))
    next.push(trimmed)
    setCustomInput('')
    props.onChange(normalizeFromArray(next))
  }

  const removeCustom = (val: string) => {
    const next = all.filter((v) => v !== val)
    props.onChange(normalizeFromArray(next))
  }

  return (
    <div className={lobeStyles.u27846a89}>
      <div className={lobeStyles.u629154da}>
        {options.map((option) => (
          <Checkbox
            checked={isChecked(option)}
            key={String(option.value)}
            label={option.label}
            onCheckedChange={(checked) => toggleOption(option, checked)}
          />
        ))}
      </div>
      {customs.length > 0 ? (
        <div className={lobeStyles.u6978b7c6}>
          {customs.map((val) => (
            <span className={lobeStyles.ubd8f1a40} key={val}>
              {val}
              <button
                aria-label={t('write.meta.multiSelect.removeAria', {
                  value: val,
                })}
                className={lobeStyles.u66316002}
                onClick={() => removeCustom(val)}
                type="button"
              >
                <X aria-hidden="true" className={lobeStyles.uef2d6f74} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {props.allowCustom ? (
        <div className={lobeStyles.u152c1189}>
          <TextInput
            controlClassName={lobeStyles.ub8a627aa}
            onChange={setCustomInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustom()
              }
            }}
            placeholder={t('write.meta.multiSelect.customPlaceholder')}
            value={customInput}
          />
          <Button
            className={lobeStyles.u9756bfd7}
            disabled={!customInput.trim()}
            onClick={addCustom}
            type="button"
            variant="subtle"
          >
            <Plus aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function TagsInput(props: {
  onChange: (value: unknown) => void
  value: unknown[]
}) {
  const { t } = useI18n()
  const tags = props.value.map((v) => String(v))
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) {
      setInput('')
      return
    }
    const next = [...tags, trimmed]
    setInput('')
    props.onChange(next)
  }

  const remove = (tag: string) => {
    props.onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className={lobeStyles.u27846a89}>
      {tags.length > 0 ? (
        <div className={lobeStyles.u6978b7c6}>
          {tags.map((tag) => (
            <span className={lobeStyles.ubd8f1a40} key={tag}>
              {tag}
              <button
                aria-label={t('write.meta.multiSelect.removeAria', {
                  value: tag,
                })}
                className={lobeStyles.u66316002}
                onClick={() => remove(tag)}
                type="button"
              >
                <X aria-hidden="true" className={lobeStyles.uef2d6f74} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className={lobeStyles.u152c1189}>
        <TextInput
          controlClassName={lobeStyles.ub8a627aa}
          onChange={setInput}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          placeholder={t('write.meta.tags.placeholder')}
          value={input}
        />
        <Button
          className={lobeStyles.u9756bfd7}
          disabled={!input.trim()}
          onClick={add}
          type="button"
          variant="subtle"
        >
          <Plus aria-hidden="true" className={lobeStyles.uf7b5fa97} />
        </Button>
      </div>
    </div>
  )
}

function KeyValuePairList(props: {
  meta: MetaRecord
  onTogglePreview: () => void
  onUpdateMeta: (meta: MetaRecord) => void
  previewOpen: boolean
}) {
  const { t } = useI18n()
  const [pairs, setPairs] = useState<KeyValuePair[]>(() =>
    metaToPairs(props.meta),
  )

  useEffect(() => {
    setPairs(metaToPairs(props.meta))
  }, [props.meta])

  const commit = (next: KeyValuePair[]) => {
    setPairs(next)
    props.onUpdateMeta(pairsToMeta(next))
  }

  const updatePair = (id: string, patch: Partial<KeyValuePair>) => {
    commit(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const removePair = (id: string) => {
    commit(pairs.filter((p) => p.id !== id))
  }

  const addPair = () => {
    commit([...pairs, { id: nextPairId(), key: '', value: '' }])
  }

  const hasMeta = Object.keys(props.meta).length > 0

  return (
    <div className={lobeStyles.uab547bd4}>
      <div className={lobeStyles.u27846a89}>
        {pairs.length === 0 ? (
          <p className={lobeStyles.u327cfeab}>{t('write.meta.kvList.empty')}</p>
        ) : (
          pairs.map((pair) => (
            <div className={lobeStyles.kvField} key={pair.id}>
              <div className={lobeStyles.kvKey}>
                <Input
                  onChange={(event) =>
                    updatePair(pair.id, { key: event.target.value })
                  }
                  placeholder={t('write.meta.kvList.keyPlaceholder')}
                  value={pair.key}
                />
                <ActionIcon
                  aria-label={t('write.meta.kvList.deleteFieldAria')}
                  icon={X}
                  onClick={() => removePair(pair.id)}
                  size="small"
                />
              </div>
              <LobeTextArea
                autoSize={{ maxRows: 8, minRows: 3 }}
                onChange={(event) =>
                  updatePair(pair.id, { value: event.target.value })
                }
                placeholder={t('write.meta.kvList.valuePlaceholder')}
                value={pair.value}
              />
            </div>
          ))
        )}
        <LobeButton icon={Plus} onClick={addPair} type="text">
          {t('write.meta.kvList.addField')}
        </LobeButton>
      </div>

      {hasMeta ? (
        <div>
          <LobeButton
            aria-expanded={props.previewOpen}
            icon={ChevronDown}
            onClick={props.onTogglePreview}
            type="text"
          >
            {t('write.meta.kvList.previewJson')}
          </LobeButton>
          {props.previewOpen ? (
            <Highlighter language="json" variant="filled" wrap>
              {JSON.stringify(props.meta, null, 2)}
            </Highlighter>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function JsonEditorDialog(props: {
  meta: MetaRecord
  onClose: () => void
  onSubmit: (meta: MetaRecord) => void
  open: boolean
}) {
  const { t } = useI18n()
  const initial = useMemo(
    () =>
      Object.keys(props.meta).length > 0
        ? JSON.stringify(props.meta, null, 2)
        : '',
    [props.meta, props.open],
  )
  const [value, setValue] = useState(initial)

  useEffect(() => {
    if (props.open) setValue(initial)
  }, [props.open, initial])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      props.onSubmit({})
      return
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        toast.error(t('write.meta.json.invalidObject'))
        return
      }
      props.onSubmit(parsed as MetaRecord)
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : t('write.meta.json.parseError'),
      )
    }
  }

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      popupStyle={{
        height: 'min(80svh, 40rem)',
        maxHeight: 'min(80svh, 40rem)',
        maxWidth: 'min(92vw, 56rem)',
        width: 'min(92vw, 56rem)',
      }}
    >
      <ModalHeader title={t('write.meta.json.dialogTitle')} />
      <div className={lobeStyles.u2b5fa9a9}>
        <CodeEditor
          language="json"
          onChange={setValue}
          onSave={submit}
          title="META JSON"
          value={value}
        />
      </div>
      <ModalFooter>
        <Button onClick={props.onClose} type="button" variant="subtle">
          {t('common.cancel')}
        </Button>
        <Button onClick={submit} type="button">
          {t('common.submit')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function normalizeToArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value
  return [value]
}

function normalizeFromArray(arr: unknown[]): unknown {
  if (arr.length === 0) return undefined
  if (arr.length === 1) return arr[0]
  return arr
}
