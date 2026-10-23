import {
  Button,
  Input,
  InputNumber,
  Select,
  Switch,
  TextArea,
} from '@lobehub/ui'

import type { ConfigFormField } from '~/api/options'

import { stringValue } from '../../utils/settings'
import { isSecretField } from '../../utils/settings-risk'
import { SecretInput } from '../SettingsPrimitives'
import { TagsEditor } from '../TagsEditor'
import { LanguageSelect } from './LanguageSelect'

const fill = { width: '100%' }

export function isWideConfigField(field: ConfigFormField) {
  return field.ui.component === 'textarea' || field.ui.component === 'tags'
}

export function renderConfigControl(props: {
  field: ConfigFormField
  id?: string
  onAction: (actionId: string) => void
  onChange: (value: unknown) => void
  value: unknown
}) {
  const { field } = props
  const placeholder = field.ui.placeholder

  if (field.key === 'defaultSourceLang') {
    return (
      <LanguageSelect
        aria-label={field.title}
        onChange={props.onChange}
        value={stringValue(props.value) || 'en'}
      />
    )
  }

  if (isSecretField(field)) {
    return (
      <SecretInput
        aria-label={field.title}
        onChange={props.onChange}
        value={stringValue(props.value)}
      />
    )
  }

  switch (field.ui.component) {
    case 'textarea': {
      return (
        <TextArea
          id={props.id}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={placeholder}
          value={stringValue(props.value)}
        />
      )
    }
    case 'number': {
      return (
        <InputNumber
          id={props.id}
          onChange={(next) => props.onChange(next ?? undefined)}
          placeholder={placeholder}
          style={fill}
          value={typeof props.value === 'number' ? props.value : null}
        />
      )
    }
    case 'select': {
      const selected =
        typeof props.value === 'number' || typeof props.value === 'string'
          ? props.value
          : null
      return (
        <Select
          id={props.id}
          onChange={(next) => {
            if (next !== null && next !== undefined && !Array.isArray(next)) {
              props.onChange(next)
            }
          }}
          options={field.ui.options ?? []}
          placeholder={placeholder}
          style={fill}
          value={selected}
        />
      )
    }
    case 'tags': {
      return (
        <TagsEditor
          onChange={props.onChange}
          value={Array.isArray(props.value) ? props.value.map(String) : []}
        />
      )
    }
    case 'switch': {
      return (
        <Switch
          aria-label={field.title}
          checked={Boolean(props.value)}
          id={props.id}
          onChange={(checked) => props.onChange(checked)}
        />
      )
    }
    case 'action': {
      return (
        <Button
          onClick={() => {
            if (field.ui.actionId) props.onAction(field.ui.actionId)
          }}
        >
          {field.ui.actionLabel || field.title}
        </Button>
      )
    }
    default: {
      return (
        <Input
          id={props.id}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={placeholder}
          value={stringValue(props.value)}
        />
      )
    }
  }
}
