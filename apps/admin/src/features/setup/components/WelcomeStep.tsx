import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { Link } from 'react-router'

import { getAppInfo } from '~/api/system'
import { API_URL } from '~/constants/env'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

import {
  OnboardingAsideTitle,
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'

export function WelcomeStep(props: {
  connected: boolean
  onFresh: () => void
}) {
  const { t } = useI18n()
  const infoQuery = useQuery({
    enabled: props.connected,
    queryFn: getAppInfo,
    queryKey: ['onboarding', 'info'],
    retry: false,
  })
  const apiLabel = API_URL || location.origin

  const asideRows = [
    [
      t('setup.onboarding.rail.account'),
      t('setup.onboarding.welcome.asideAccount'),
    ],
    [t('setup.onboarding.rail.site'), t('setup.onboarding.welcome.asideSite')],
    [t('setup.onboarding.rail.ai'), t('setup.onboarding.welcome.asideAi')],
  ]

  return (
    <OnboardingShell
      aside={
        <>
          <OnboardingAsideTitle>
            {t('setup.onboarding.welcome.asideTitle')}
          </OnboardingAsideTitle>
          <div className="flex flex-col gap-3 text-sm">
            {asideRows.map(([title, description]) => (
              <div key={title}>
                <div className="font-medium text-fg">{title}</div>
                <div className="text-fg-muted">{description}</div>
              </div>
            ))}
          </div>
        </>
      }
      step="welcome"
    >
      <OnboardingCard
        description={t('setup.onboarding.welcome.description')}
        footer={
          <OnboardingFooter meta={t('setup.onboarding.welcome.duration')}>
            <Button
              data-testid="onboarding-submit"
              disabled={!props.connected}
              onClick={props.onFresh}
              type="button"
            >
              {t('setup.onboarding.action.continue')}
            </Button>
          </OnboardingFooter>
        }
        title={t('setup.onboarding.welcome.title')}
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-sm px-3 py-2 text-sm',
            props.connected
              ? 'bg-surface-inset text-fg'
              : 'bg-red-50 text-red-700',
          )}
        >
          {props.connected ? (
            <CircleCheck
              aria-hidden="true"
              className="size-4 shrink-0 text-green-600"
            />
          ) : (
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          )}
          <span className="min-w-0 truncate">
            {props.connected
              ? t('setup.onboarding.welcome.connected', { url: apiLabel })
              : t('setup.onboarding.welcome.disconnected', { url: apiLabel })}
            {infoQuery.data?.version ? ` · v${infoQuery.data.version}` : ''}
          </span>
          <Link
            className="ml-auto shrink-0 text-accent hover:text-accent-hover"
            to="/setup-api"
          >
            {t('setup.onboarding.welcome.change')}
          </Link>
        </div>
      </OnboardingCard>
    </OnboardingShell>
  )
}
