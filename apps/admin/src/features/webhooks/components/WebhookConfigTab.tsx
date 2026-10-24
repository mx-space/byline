import { Alert, Text, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import type { WebhookModel } from '~/api/webhooks'
import { updateWebhook } from '~/api/webhooks'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { webhooksQueryKey } from '../constants'
import { useWebhookCopy } from '../copy'
import { errorText } from '../utils/webhooks'
import { styles } from './styles'
import {
  toWebhookInput,
  WebhookFields,
  webhookFormSchema,
  type WebhookFormValues,
  webhookFormValues,
} from './WebhookFields'

export function WebhookConfigTab(props: { webhook: WebhookModel }) {
  const text = useWebhookCopy()
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  const [formError, setFormError] = useState('')
  const schema = useMemo(() => webhookFormSchema(text), [text])

  const mutation = useMutation({
    mutationFn: (values: WebhookFormValues) =>
      updateWebhook(props.webhook.id, toWebhookInput(values, 'edit')),
    onError: (error: unknown) => {
      setFormError(
        text('saveFailed', { message: errorText(error, text('retryLater')) }),
      )
    },
    onSuccess: async (_result, values) => {
      form.reset({ ...values, secret: '' })
      toast.success(text('saved'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: webhooksQueryKey }),
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.webhooks.dispatchesRoot(props.webhook.id),
        }),
      ])
    },
  })

  const form = useForm<WebhookFormValues>({
    initialValues: webhookFormValues(props.webhook),
    onSubmit: (values) => {
      setFormError('')
      mutation.mutate(values)
    },
    onValuesChange: () => setFormError(''),
    schema,
  })

  useEffect(() => {
    form.setSchema(schema)
  }, [form, schema])

  useEffect(() => {
    return form.subscribe(
      (values) => JSON.stringify(values),
      () => setDirty(form.isDirty()),
    )
  }, [form])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  return (
    <Form form={form} gap={20} layout="vertical">
      {formError ? <Alert showIcon title={formError} type="error" /> : null}
      <WebhookFields form={form} mode="edit" />
      {dirty ? (
        <div className={styles.saveBar}>
          <Text className={styles.saveBarText}>{text('unsaved')}</Text>
          <Button htmlType="button" onClick={() => form.reset()}>
            {text('discard')}
          </Button>
          <Button htmlType="submit" loading={mutation.isPending} type="primary">
            {text('save')}
          </Button>
        </div>
      ) : null}
    </Form>
  )
}
