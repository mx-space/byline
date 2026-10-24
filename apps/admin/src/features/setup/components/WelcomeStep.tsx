import { Alert, Skeleton } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { getAppInfo } from '~/api/system'
import { API_URL } from '~/constants/env'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { useSetupCopy } from '../copy'
import {
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

export function WelcomeStep(props: {
  connected: boolean
  onFresh: () => void
}) {
  const copy = useSetupCopy()
  const infoQuery = useQuery({
    enabled: props.connected,
    queryFn: getAppInfo,
    queryKey: adminQueryKeys.onboarding.info(),
    retry: false,
  })
  const apiLabel = API_URL || location.origin
  const version = infoQuery.data?.version

  return (
    <OnboardingShell step="welcome">
      <OnboardingCard
        description={copy('welcomeDescription')}
        footer={
          <OnboardingFooter>
            <Button
              data-testid="onboarding-submit"
              disabled={!props.connected}
              htmlType="button"
              onClick={props.onFresh}
              title={props.connected ? undefined : copy('welcomeBlocked')}
              type="primary"
            >
              {copy('welcomeContinue')}
            </Button>
          </OnboardingFooter>
        }
        title={copy('welcomeTitle')}
      >
        <div className={wizardStyles.stack}>
          <Alert
            className={wizardStyles.break}
            description={
              props.connected
                ? version
                  ? copy('welcomeVersion', { version })
                  : undefined
                : copy('welcomeDisconnectedDetail')
            }
            showIcon
            title={
              props.connected
                ? copy('welcomeConnected', { url: apiLabel })
                : copy('welcomeDisconnected', { url: apiLabel })
            }
            type={props.connected ? 'success' : 'error'}
          />
          {props.connected && infoQuery.isPending ? (
            <Skeleton.Text
              aria-label={copy('welcomeLoading')}
              rows={1}
              width="42%"
            />
          ) : null}
          {props.connected && infoQuery.isError ? (
            <Alert showIcon title={copy('welcomeLoadError')} type="warning" />
          ) : null}
          {props.connected && infoQuery.isError ? (
            <Button
              htmlType="button"
              onClick={() => void infoQuery.refetch()}
              type="text"
            >
              {copy('retry')}
            </Button>
          ) : null}
          <Link className={wizardStyles.link} to="/setup-api">
            {copy('welcomeChange')}
          </Link>
        </div>
      </OnboardingCard>
    </OnboardingShell>
  )
}
