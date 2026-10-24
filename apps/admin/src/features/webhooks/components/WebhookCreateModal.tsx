import { Alert, confirmModal, Flexbox, Modal, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { createWebhook, getWebhooks } from '~/api/webhooks'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { webhooksQueryKey } from '../constants'
import { useWebhookCopy } from '../copy'
import { errorText } from '../utils/webhooks'
import {
  toWebhookInput,
  WebhookFields,
  webhookFormSchema,
  type WebhookFormValues,
  webhookFormValues,
} from './WebhookFields'

export function WebhookCreateModal(props: {
  existingIds: string[]
  onClose: () => void
  onCreated: (id?: string) => void
  open: boolean
}) {
  return props.open ? <CreateBody {...props} /> : null
}

function CreateBody(props: {
  existingIds: string[]
  onClose: () => void
  onCreated: (id?: string) => void
}) {
  const text = useWebhookCopy()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState('')
  const schema = useMemo(() => webhookFormSchema(text), [text])

  const mutation = useMutation({
    mutationFn: async (values: WebhookFormValues) => {
      await createWebhook({
        ...toWebhookInput(values, 'create'),
        enabled: true,
      })
      await queryClient.invalidateQueries({ queryKey: webhooksQueryKey })
      const list = await queryClient.fetchQuery({
        queryFn: getWebhooks,
        queryKey: adminQueryKeys.webhooks.list(),
      })
      return list.find((item) => !props.existingIds.includes(item.id))?.id
    },
    onError: (error: unknown) => {
      setFormError(
        text('saveFailed', { message: errorText(error, text('retryLater')) }),
      )
    },
    onSuccess: (id) => {
      toast.success(text('created'))
      props.onCreated(id)
    },
  })

  const form = useForm<WebhookFormValues>({
    initialValues: webhookFormValues(null),
    onSubmit: (values) => {
      setFormError('')
      mutation.mutate(values)
    },
    schema,
  })

  const requestClose = () => {
    if (!form.isDirty()) {
      props.onClose()
      return
    }
    confirmModal({
      cancelText: text('keepEditing'),
      content: text('discardBody'),
      okButtonProps: { danger: true },
      okText: text('discardOk'),
      onOk: props.onClose,
      title: text('discardTitle'),
    })
  }

  return (
    <Modal
      footer={null}
      onCancel={requestClose}
      open
      title={text('create')}
      width={600}
    >
      <Form
        footer={
          <Flexbox gap={8} horizontal justify="flex-end">
            <Button htmlType="button" onClick={requestClose}>
              {text('cancel')}
            </Button>
            <Button
              htmlType="submit"
              loading={mutation.isPending}
              type="primary"
            >
              {text('create')}
            </Button>
          </Flexbox>
        }
        form={form}
        gap={16}
        layout="vertical"
      >
        {formError ? <Alert showIcon title={formError} type="error" /> : null}
        <WebhookFields form={form} mode="create" />
      </Form>
    </Modal>
  )
}
