import { Alert, Button, Collapsible, Input, Text, toast } from '@lobehub/ui'
import { Form, useForm, useWatch } from '@lobehub/ui/form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getOption, getUrlOptions, patchOption } from '~/api/options'
import { API_URL } from '~/constants/env'
import { LanguageSelect } from '~/features/settings/components/config/LanguageSelect'
import { adminQueryKeys } from '~/query/keys'

import { useSetupCopy } from '../copy'
import { deriveServiceUrls } from '../utils/onboarding'
import { getErrorMessage } from '../utils/setup'
import {
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

interface SiteOptions {
  defaultSourceLang?: string
}

interface SiteValues {
  adminUrl: string
  serverUrl: string
  sourceLang: string
  webUrl: string
  wsUrl: string
}

const serviceKeys = ['serverUrl', 'adminUrl', 'wsUrl'] as const

const siteQueryKey = adminQueryKeys.onboarding.site()

function readGatewayOverride() {
  try {
    return (
      sessionStorage.getItem('__gateway') ||
      localStorage.getItem('__gateway') ||
      ''
    )
  } catch {
    return ''
  }
}

function isConfiguredUrl(value?: string) {
  if (!value) return false
  try {
    const { hostname } = new URL(value)
    return hostname !== 'localhost' && hostname !== '127.0.0.1'
  } catch {
    return false
  }
}

export function SiteStep(props: {
  onBack?: () => void
  onLater?: () => void
  onNext: () => void
}) {
  // lobe-design-ignore DETAIL-NO-EMPTY: 服务地址是固定的三项，不是请求回来的列表
  const copy = useSetupCopy()
  const queryClient = useQueryClient()
  const hydrated = useRef(false)
  const lock = useRef(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const siteQuery = useQuery({
    queryFn: () => getOption<SiteOptions>('site'),
    queryKey: siteQueryKey,
  })
  const urlQuery = useQuery({
    queryFn: getUrlOptions,
    queryKey: adminQueryKeys.onboarding.url(),
  })
  const derived = useMemo(
    () =>
      deriveServiceUrls({
        adminHref: location.href.split('#')[0],
        apiUrl: API_URL || location.origin,
        gatewayUrl: readGatewayOverride(),
      }),
    [],
  )
  const form = useForm<SiteValues>({
    initialValues: {
      adminUrl: derived.adminUrl,
      serverUrl: derived.serverUrl,
      sourceLang: 'en',
      webUrl: '',
      wsUrl: derived.wsUrl,
    },
    onSubmit: async (values) => {
      if (lock.current) return
      lock.current = true
      setSubmitting(true)
      try {
        await patchOption('site', { defaultSourceLang: values.sourceLang })
        queryClient.setQueryData<SiteOptions>(siteQueryKey, (current) => ({
          ...current,
          defaultSourceLang: values.sourceLang,
        }))
        const trimmedWebUrl = values.webUrl.trim()
        const services = {
          adminUrl: values.adminUrl,
          serverUrl: values.serverUrl,
          wsUrl: values.wsUrl,
        }
        await patchOption(
          'url',
          trimmedWebUrl ? { ...services, webUrl: trimmedWebUrl } : services,
        )
        await queryClient.invalidateQueries({
          queryKey: adminQueryKeys.settings.root,
        })
        props.onNext()
      } catch (error) {
        toast.error(getErrorMessage(error, copy('siteSaveError')))
      } finally {
        lock.current = false
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (hydrated.current || !siteQuery.isSuccess || !urlQuery.isSuccess) return
    hydrated.current = true
    const saved = urlQuery.data
    const next = { ...form.getValues() }
    if (siteQuery.data?.defaultSourceLang) {
      next.sourceLang = siteQuery.data.defaultSourceLang
    }
    if (saved) {
      if (isConfiguredUrl(saved.webUrl)) next.webUrl = saved.webUrl
      for (const key of serviceKeys) {
        if (isConfiguredUrl(saved[key])) next[key] = saved[key]
      }
    }
    form.setValues(next)
  }, [
    form,
    siteQuery.data,
    siteQuery.isSuccess,
    urlQuery.data,
    urlQuery.isSuccess,
  ])

  const sourceLang = useWatch(form, 'sourceLang')

  const serviceLabels: Record<
    (typeof serviceKeys)[number],
    'siteAdmin' | 'siteServer' | 'siteWs'
  > = {
    adminUrl: 'siteAdmin',
    serverUrl: 'siteServer',
    wsUrl: 'siteWs',
  }

  return (
    <OnboardingShell onLater={props.onLater} step="site">
      <Form form={form} gap={16} layout="vertical">
        <OnboardingCard
          description={copy('siteDescription')}
          footer={
            <OnboardingFooter onBack={props.onBack}>
              <Button
                data-testid="onboarding-submit"
                disabled={submitting}
                htmlType="submit"
                loading={submitting}
                type="primary"
              >
                {copy('siteContinue')}
              </Button>
            </OnboardingFooter>
          }
          title={copy('siteTitle')}
        >
          <div className={wizardStyles.stack}>
            {siteQuery.isPending || urlQuery.isPending ? (
              <Text type="secondary">{copy('siteLoading')}</Text>
            ) : null}
            {siteQuery.isError || urlQuery.isError ? (
              <Alert
                description={copy('siteLoadErrorDetail')}
                showIcon
                title={copy('siteLoadError')}
                type="error"
              />
            ) : null}
            {siteQuery.isError || urlQuery.isError ? (
              <Button
                htmlType="button"
                onClick={() => {
                  void siteQuery.refetch()
                  void urlQuery.refetch()
                }}
                type="text"
              >
                {copy('retry')}
              </Button>
            ) : null}
            <Form.Field
              desc={copy('siteSourceHint')}
              label={copy('siteSource')}
              name="sourceLang"
            >
              <LanguageSelect
                aria-label={copy('siteSource')}
                onChange={(value) =>
                  form.setValue('sourceLang', value, { asUser: true })
                }
                value={sourceLang}
              />
            </Form.Field>
            <Form.Field
              desc={copy('siteWebHint')}
              label={copy('siteWeb')}
              name="webUrl"
            >
              <Input
                autoComplete="url"
                name="webUrl"
                placeholder={copy('siteWebPlaceholder')}
                type="url"
              />
            </Form.Field>
            <div>
              <Button
                aria-expanded={servicesOpen}
                htmlType="button"
                onClick={() => setServicesOpen((open) => !open)}
                type="text"
              >
                {copy('siteServices')}
              </Button>
              <Text type="secondary">{copy('siteServicesHint')}</Text>
              <Collapsible keepMounted open={servicesOpen}>
                <div className={wizardStyles.stack}>
                  {serviceKeys.map((key) => (
                    <Form.Field
                      key={key}
                      label={copy(serviceLabels[key])}
                      name={key}
                    >
                      <Input name={key} type="url" />
                    </Form.Field>
                  ))}
                </div>
              </Collapsible>
            </div>
          </div>
        </OnboardingCard>
      </Form>
    </OnboardingShell>
  )
}
