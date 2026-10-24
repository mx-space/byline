import { Alert, Text } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { getUrlOptions } from '~/api/options'
import { getMe } from '~/api/users'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { useSetupCopy } from '../copy'
import { useOnboardingAiConfig } from '../hooks/use-onboarding-ai'
import { onboardingLanguages } from '../utils/onboarding'
import {
  deploymentDocsUrl,
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

export function ReadyStep(props: { onFinish: () => void }) {
  // lobe-design-ignore DETAIL-NO-EMPTY: 这四行是固定核对项，空值用 -- 表示未填写
  const copy = useSetupCopy()
  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.onboarding.me(),
  })
  const urlQuery = useQuery({
    queryFn: getUrlOptions,
    queryKey: adminQueryKeys.onboarding.url(),
  })
  const aiQuery = useOnboardingAiConfig()
  const ai = aiQuery.data
  const separator = copy('readySeparator')
  const loading = meQuery.isPending || urlQuery.isPending || aiQuery.isPending
  const failed = meQuery.isError || urlQuery.isError || aiQuery.isError

  const enabledFeatures = [
    ai?.enableTranslation && copy('featuresTranslation'),
    ai?.enableSummary && copy('featuresSummary'),
    ai?.enableInsights && copy('featuresInsights'),
    ai?.tts?.enable && copy('featuresTts'),
  ].filter(Boolean)
  const providerNames = (ai?.providers ?? []).map((provider) => provider.name)
  const aiSummary = providerNames.length
    ? [providerNames.join(separator), enabledFeatures.join(separator)]
        .filter(Boolean)
        .join(' · ')
    : ''
  const languages = (ai?.translationTargetLanguages ?? [])
    .map(
      (code) =>
        onboardingLanguages.find((language) => language.code === code)?.label ??
        code,
    )
    .join(separator)

  const summaryRows = [
    {
      href: '/setting/account',
      label: copy('readyAccount'),
      value: meQuery.data?.username,
    },
    {
      href: '/setting/site',
      label: copy('readySite'),
      value: urlQuery.data?.webUrl,
    },
    {
      href: '/setting/ai',
      label: copy('readyAi'),
      value: aiSummary,
    },
    {
      href: '/setting/ai',
      label: copy('readyLanguages'),
      value: ai?.enableTranslation ? languages : '',
    },
  ]

  const nextLinks = [
    {
      hint: copy('readyWriteHint'),
      href: '/posts/edit',
      title: copy('readyWrite'),
    },
    {
      hint: copy('readyInviteHint'),
      href: '/users',
      title: copy('readyInvite'),
    },
  ]

  return (
    <OnboardingShell step="ready">
      <OnboardingCard
        description={copy('readyDescription')}
        footer={
          <OnboardingFooter>
            <Button
              data-testid="onboarding-submit"
              htmlType="button"
              onClick={props.onFinish}
              type="primary"
            >
              {copy('readyEnter')}
            </Button>
          </OnboardingFooter>
        }
        title={copy('readyTitle')}
      >
        <div className={wizardStyles.stack}>
          {loading ? (
            <Text type="secondary">{copy('readyLoading')}</Text>
          ) : null}
          {failed ? (
            <Alert showIcon title={copy('readyLoadError')} type="error" />
          ) : null}
          {failed ? (
            <Button
              htmlType="button"
              onClick={() => {
                void meQuery.refetch()
                void urlQuery.refetch()
                void aiQuery.refetch()
              }}
              type="text"
            >
              {copy('retry')}
            </Button>
          ) : null}
          <div className={wizardStyles.summary}>
            {summaryRows.map((row) => (
              <SummaryRow key={row.label} {...row} />
            ))}
          </div>
          {nextLinks.map((item) => (
            <div key={item.href}>
              <Link className={wizardStyles.link} to={item.href}>
                {item.title}
              </Link>
              <Text type="secondary">{item.hint}</Text>
            </div>
          ))}
          <div>
            <a
              className={wizardStyles.link}
              href={deploymentDocsUrl}
              rel="noreferrer"
              target="_blank"
            >
              {copy('readyConnect')}
            </a>
            <Text type="secondary">{copy('readyConnectHint')}</Text>
          </div>
        </div>
      </OnboardingCard>
    </OnboardingShell>
  )
}

function SummaryRow(props: {
  href: string
  label: string
  value?: string | null
}) {
  const copy = useSetupCopy()
  const value = props.value || copy('readyEmpty')
  return (
    <>
      <Text as="span" type="secondary">
        {props.label}
      </Text>
      <span className={wizardStyles.summaryValue}>{value}</span>
      <Link className={wizardStyles.link} to={props.href}>
        {copy('readyEdit')}
      </Link>
    </>
  )
}
