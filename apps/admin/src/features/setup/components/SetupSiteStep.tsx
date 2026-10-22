import type { FormEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

import { patchInitConfig } from '~/api/system'
import { useI18n } from '~/i18n'

import { cardClassName } from '../constants'
import type { SetupUrls } from '../types/setup'
import { getErrorMessage } from '../utils/setup'
import { StepActions, UrlInput } from './SetupPrimitives'

export function SetupSiteStep(props: {
  onNext: () => void
  onPrev: () => void
}) {
  const { t } = useI18n()
  const [urls, setUrls] = useState<SetupUrls>({
    adminUrl: `${location.origin}/admin/`,
    serverUrl: `${location.origin}/api/v3`,
    webUrl: location.origin,
    wsUrl: location.origin,
  })
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = Boolean(urls.webUrl.trim() && urls.serverUrl.trim())

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || submitting) return

    setSubmitting(true)

    try {
      await patchInitConfig('url', urls)
      props.onNext()
    } catch (error) {
      toast.error(getErrorMessage(error, t('setup.site.saveError')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cardClassName}>
      <form onSubmit={submit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <UrlInput
              label={t('setup.site.webUrlLabel')}
              onChange={(value) =>
                setUrls((current) => ({ ...current, webUrl: value }))
              }
              value={urls.webUrl}
            />
            <UrlInput
              label={t('setup.site.apiUrlLabel')}
              onChange={(value) =>
                setUrls((current) => ({ ...current, serverUrl: value }))
              }
              value={urls.serverUrl}
            />
            <UrlInput
              label={t('setup.site.adminUrlLabel')}
              onChange={(value) =>
                setUrls((current) => ({ ...current, adminUrl: value }))
              }
              value={urls.adminUrl}
            />
            <UrlInput
              label={t('setup.site.gatewayUrlLabel')}
              onChange={(value) =>
                setUrls((current) => ({ ...current, wsUrl: value }))
              }
              value={urls.wsUrl}
            />
          </div>
        </div>

        <StepActions
          canSubmit={canSubmit}
          onPrev={props.onPrev}
          submitting={submitting}
        />
      </form>
    </div>
  )
}
