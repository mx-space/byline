import { Button, Input, Switch, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useMemo, useRef, useState } from 'react'

import { useSetupCopy } from '../copy'
import { SetupPage } from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

const storeApiUrlKey = 'mx-admin:setup-api:url'
const storeGatewayUrlKey = 'mx-admin:setup-api:gateway'

interface ApiValues {
  apiUrl: string
  gatewayUrl: string
  persist: boolean
}

export function SetupApiRouteViewContent() {
  const copy = useSetupCopy()
  const lock = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const historyApiUrl = useMemo(
    () => readStringArray(localStorage.getItem(storeApiUrlKey)),
    [],
  )
  const historyGatewayUrl = useMemo(
    () => readStringArray(localStorage.getItem(storeGatewayUrlKey)),
    [],
  )
  const form = useForm<ApiValues>({
    initialValues: {
      apiUrl:
        localStorage.getItem('__api') ||
        `${location.protocol}//${location.host}/api/v2`,
      gatewayUrl:
        localStorage.getItem('__gateway') ||
        `${location.protocol}//${location.host}`,
      persist: true,
    },
    onSubmit: async (values) => {
      if (lock.current) return
      lock.current = true
      setSubmitting(true)
      try {
        const fullApiUrl = transformFullUrl(values.apiUrl)
        const fullGatewayUrl = transformFullUrl(values.gatewayUrl)
        const storage = values.persist ? localStorage : sessionStorage

        if (fullApiUrl) storage.setItem('__api', fullApiUrl)
        if (fullGatewayUrl) storage.setItem('__gateway', fullGatewayUrl)

        localStorage.setItem(
          storeApiUrlKey,
          JSON.stringify([
            ...new Set(historyApiUrl.concat(fullApiUrl || values.apiUrl)),
          ]),
        )
        localStorage.setItem(
          storeGatewayUrlKey,
          JSON.stringify([
            ...new Set(
              historyGatewayUrl.concat(fullGatewayUrl || values.gatewayUrl),
            ),
          ]),
        )

        const url = new URL(location.href)
        url.hash = '#/dashboard'
        location.href = url.toString()
        location.reload()
      } catch {
        lock.current = false
        setSubmitting(false)
        toast.error(copy('apiSaveError'))
      }
    },
  })

  const clearSavedAddresses = () => {
    localStorage.removeItem('__api')
    localStorage.removeItem('__gateway')
    sessionStorage.removeItem('__api')
    sessionStorage.removeItem('__gateway')
    location.href = location.pathname
    location.hash = ''
  }

  const fillLocalAddresses = () => {
    form.setValues(
      {
        apiUrl: 'http://localhost:2333',
        gatewayUrl: 'http://localhost:2333',
      },
      { asUser: true },
    )
  }

  return (
    <SetupPage description={copy('apiDescription')} title={copy('apiTitle')}>
      <Form form={form} gap={16} layout="vertical">
        <Form.Field
          desc={copy('apiUrlHint')}
          label={copy('apiUrl')}
          name="apiUrl"
        >
          <Input
            autoComplete="url"
            list={apiListId}
            name="apiUrl"
            placeholder={copy('apiPlaceholder')}
            type="url"
          />
        </Form.Field>
        {historyApiUrl.length === 0 ? null : (
          <datalist id={apiListId}>
            {historyApiUrl.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        )}
        <Form.Field
          desc={copy('apiGatewayHint')}
          label={copy('apiGateway')}
          name="gatewayUrl"
        >
          <Input
            autoComplete="url"
            list={gatewayListId}
            name="gatewayUrl"
            placeholder={copy('apiPlaceholder')}
            type="url"
          />
        </Form.Field>
        {historyGatewayUrl.length === 0 ? null : (
          <datalist id={gatewayListId}>
            {historyGatewayUrl.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        )}
        <Form.Field
          desc={copy('apiPersistHint')}
          label={copy('apiPersist')}
          name="persist"
        >
          <Switch aria-label={copy('apiPersist')} />
        </Form.Field>
        <p className={wizardStyles.description}>{copy('apiClearHint')}</p>
        <div className={wizardStyles.footer}>
          <Button htmlType="button" onClick={fillLocalAddresses} type="text">
            {copy('apiLocal')}
          </Button>
          <Button htmlType="button" onClick={clearSavedAddresses} type="text">
            {copy('apiClear')}
          </Button>
          <div className={wizardStyles.actions}>
            <Button
              disabled={submitting}
              htmlType="submit"
              loading={submitting}
              type="primary"
            >
              {copy('apiSubmit')}
            </Button>
          </div>
        </div>
      </Form>
    </SetupPage>
  )
}

const apiListId = 'setup-api-url-history'
const gatewayListId = 'setup-gateway-url-history'

function transformFullUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url

  const protocol = ['localhost', '127.0.0.1'].includes(url) ? 'http' : 'https'
  return `${protocol}://${url}`
}

function readStringArray(value: null | string): string[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}
