import {
  Alert,
  Button,
  Checkbox,
  CopyButton,
  Input,
  InputPassword,
  Skeleton,
  Text,
} from '@lobehub/ui'
import { Form, type FormInstance, useWatch } from '@lobehub/ui/form'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { z } from 'zod'

import { getWebhookEvents, type WebhookModel } from '~/api/webhooks'
import { adminQueryKeys } from '~/query/keys'

import { isWebhookScope, scopeOptions } from '../constants'
import { useWebhookCopy, type WebhookCopyKey } from '../copy'
import {
  defaultScope,
  endpointUrl,
  generateSecret,
  groupEvents,
} from '../utils/webhooks'
import { styles } from './styles'

export interface WebhookFormValues {
  events: string[]
  payloadUrl: string
  scope: number
  secret: string
}

export function webhookFormValues(
  webhook: WebhookModel | null,
): WebhookFormValues {
  return {
    events: webhook?.events ?? [],
    payloadUrl: endpointUrl(webhook),
    scope:
      typeof webhook?.scope === 'number' && isWebhookScope(webhook.scope)
        ? webhook.scope
        : defaultScope(),
    secret: webhook ? '' : generateSecret(),
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function webhookFormSchema(text: (key: WebhookCopyKey) => string) {
  return z.object({
    events: z.array(z.string()).min(1, text('validateEvents')),
    payloadUrl: z.string().trim().refine(isHttpUrl, text('validateUrl')),
    scope: z.number().refine(isWebhookScope, text('validateScope')),
    secret: z.string(),
  })
}

export function toWebhookInput(
  values: WebhookFormValues,
  mode: 'create' | 'edit',
) {
  const secret = values.secret.trim()
  return {
    events: values.events,
    payloadUrl: values.payloadUrl.trim(),
    scope: values.scope,
    ...(mode === 'create' || secret ? { secret } : {}),
  }
}

export function WebhookFields(props: {
  form: FormInstance<WebhookFormValues>
  mode: 'create' | 'edit'
}) {
  const text = useWebhookCopy()
  const secret = useWatch(props.form, 'secret') ?? ''

  return (
    <>
      <Form.Field
        label={text('fieldUrl')}
        name="payloadUrl"
        required={text('validateUrl')}
      >
        <Input
          autoComplete="off"
          className={styles.urlInput}
          placeholder={text('urlPlaceholder')}
          spellCheck={false}
        />
      </Form.Field>
      <Form.Field
        desc={
          props.mode === 'create'
            ? text('fieldSecretCreate')
            : text('fieldSecretEdit')
        }
        label={text('fieldSecret')}
        name="secret"
        render={(field) => (
          <div className={styles.secretRow}>
            <InputPassword
              autoComplete="new-password"
              className={styles.secretInput}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={
                props.mode === 'edit'
                  ? text('fieldSecretPlaceholder')
                  : undefined
              }
              spellCheck={false}
              value={field.value}
              visibilityToggleLabels={{
                hide: text('hideSecret'),
                show: text('showSecret'),
              }}
            />
            {secret ? (
              <CopyButton content={secret} title={text('copySecret')} />
            ) : null}
            <Button
              htmlType="button"
              icon={RefreshCw}
              onClick={() =>
                props.form.setValue('secret', generateSecret(), {
                  asUser: true,
                })
              }
            >
              {text('regenerateSecret')}
            </Button>
          </div>
        )}
      />
      <Form.Field
        label={text('fieldEvents')}
        name="events"
        render={(field) => (
          <EventPicker onChange={field.onChange} value={field.value ?? []} />
        )}
      />
      <Form.Field
        desc={text('fieldScopeHint')}
        label={text('fieldScope')}
        name="scope"
        render={(field) => {
          const scope: number = field.value ?? 0
          return (
            <div className={styles.scopeRow}>
              {scopeOptions.map((option) => (
                <Checkbox
                  checked={(scope & option.value) === option.value}
                  key={option.value}
                  onChange={(checked) =>
                    field.onChange(
                      checked ? scope | option.value : scope & ~option.value,
                    )
                  }
                >
                  {text(option.labelKey)}
                </Checkbox>
              ))}
            </div>
          )
        }}
      />
    </>
  )
}

function EventPicker(props: {
  onChange: (value: string[]) => void
  value: string[]
}) {
  const text = useWebhookCopy()
  const eventsQuery = useQuery({
    queryFn: getWebhookEvents,
    queryKey: adminQueryKeys.webhooks.events(),
    staleTime: 5 * 60_000,
  })
  const available = eventsQuery.data ?? []
  const all = props.value.includes('all')
  const selected = new Set(props.value)
  const selectedCount = all
    ? available.length
    : available.filter((event) => selected.has(event)).length

  const toggle = (events: string[], checked: boolean) => {
    const base = all
      ? available
      : props.value.filter((event) => event !== 'all')
    const next = new Set(base)
    for (const event of events) {
      if (checked) next.add(event)
      else next.delete(event)
    }
    props.onChange(available.filter((event) => next.has(event)))
  }

  if (eventsQuery.isPending) {
    return (
      <div className={styles.eventPicker}>
        <div className={styles.eventPickerHead}>
          <Skeleton height={20} width="40%" />
        </div>
      </div>
    )
  }

  if (eventsQuery.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void eventsQuery.refetch()}>
            {text('retry')}
          </Button>
        }
        showIcon
        title={text('eventsLoadFailed')}
        type="error"
      />
    )
  }

  if (available.length === 0) {
    return <Text type="secondary">{text('eventsEmptyCatalog')}</Text>
  }

  return (
    <div className={styles.eventPicker}>
      <div className={styles.eventPickerHead}>
        <Checkbox
          checked={all}
          indeterminate={!all && selectedCount > 0}
          onChange={(checked) => props.onChange(checked ? ['all'] : [])}
        >
          <Text weight={500}>{text('allEvents')}</Text>
        </Checkbox>
        <Text type="secondary">
          {all
            ? text('allEventsHint')
            : text('selectedEvents', {
                selected: selectedCount,
                total: available.length,
              })}
        </Text>
      </div>
      {groupEvents(available).map((group) => {
        const groupSelected = all
          ? group.events.length
          : group.events.filter((event) => selected.has(event)).length
        return (
          <div className={styles.eventGroup} key={group.key}>
            <Checkbox
              checked={groupSelected === group.events.length}
              indeterminate={
                groupSelected > 0 && groupSelected < group.events.length
              }
              onChange={(checked) => toggle(group.events, checked)}
            >
              <span className={styles.eventName}>
                {group.events.length === 1 ? group.events[0] : group.key}
              </span>
            </Checkbox>
            {group.events.length > 1 ? (
              <div className={styles.eventGrid}>
                {group.events.map((event) => (
                  <Checkbox
                    checked={all || selected.has(event)}
                    key={event}
                    onChange={(checked) => toggle([event], checked)}
                  >
                    <span className={styles.eventName} title={event}>
                      {event}
                    </span>
                  </Checkbox>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
