import { Flexbox, Icon, Text } from '@lobehub/ui'
import { AuthLayout } from '@lobehub/ui/dashboard'
import { Check, ChevronLeft } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

import { AuthTools } from '~/features/auth/components/auth-tools'
import { AuthScreen } from '~/features/auth/components/AuthScreen'
import { Button } from '~/ui/site-button'

import faviconUrl from '../../../../favicon.png'
import { type SetupCopyKey, useSetupCopy } from '../copy'
import type { OnboardingStep } from '../utils/onboarding'
import { onboardingSteps } from '../utils/onboarding'
import { wizardStyles } from './wizard-styles'

export const deploymentDocsUrl = 'https://github.com/mx-space/byline'

type RailState = 'active' | 'current' | 'done' | 'pending'

interface RailItem {
  children?: RailItem[]
  key: OnboardingStep | 'ai'
  label: SetupCopyKey
}

const railItems: RailItem[] = [
  { key: 'welcome', label: 'stepWelcome' },
  { key: 'account', label: 'stepAccount' },
  { key: 'site', label: 'stepSite' },
  {
    children: [
      { key: 'ai-providers', label: 'stepProviders' },
      { key: 'ai-models', label: 'stepModels' },
      { key: 'ai-features', label: 'stepFeatures' },
    ],
    key: 'ai',
    label: 'stepAi',
  },
  { key: 'ready', label: 'stepReady' },
]

function stepIndex(step: OnboardingStep) {
  return onboardingSteps.indexOf(step)
}

function itemState(item: RailItem, current: OnboardingStep): RailState {
  if (item.children) {
    const states = item.children.map((child) => itemState(child, current))
    if (states.every((state) => state === 'done')) return 'done'
    if (states.every((state) => state === 'pending')) return 'pending'
    return 'active'
  }
  const index = stepIndex(item.key as OnboardingStep)
  const currentIndex = stepIndex(current)
  if (index < currentIndex) return 'done'
  if (index === currentIndex) return 'current'
  return 'pending'
}

function currentLabel(step: OnboardingStep): SetupCopyKey {
  for (const item of railItems) {
    if (item.key === step) return item.label
    const child = item.children?.find((entry) => entry.key === step)
    if (child) return child.label
  }
  return 'stepWelcome'
}

function RailRow(props: {
  hidden?: boolean
  item: RailItem
  state: RailState
  sub?: boolean
}) {
  const copy = useSetupCopy()
  const { state } = props
  return (
    <li
      aria-current={state === 'current' ? 'step' : undefined}
      className={`${wizardStyles.railItem} ${props.sub ? wizardStyles.railSub : ''} ${state === 'current' ? wizardStyles.railCurrent : ''}`}
      data-state={state}
      data-step={props.item.key}
      hidden={props.hidden}
    >
      {state === 'done' ? <Icon icon={Check} size="small" /> : null}
      {copy(props.item.label)}
    </li>
  )
}

export function SetupBoot() {
  const copy = useSetupCopy()
  return <AuthScreen loading title={copy('boot')} />
}

export function SetupPage(props: {
  children?: ReactNode
  description?: ReactNode
  title: ReactNode
}) {
  return (
    <AuthScreen subtitle={props.description} title={props.title}>
      {props.children}
    </AuthScreen>
  )
}

export function OnboardingShell(
  props: PropsWithChildren<{
    aside?: ReactNode
    onLater?: () => void
    step: OnboardingStep
  }>,
) {
  // lobe-design-ignore DETAIL-NO-EMPTY: 步骤清单是写死的，不会出现空列表
  const copy = useSetupCopy()
  const index = stepIndex(props.step)
  const current = index + 1
  const total = onboardingSteps.length
  const remaining = total - current
  const progressValues = {
    current,
    name: copy(currentLabel(props.step)),
    remaining,
    total,
  }

  return (
    <AuthLayout
      background="grid"
      brand={
        <Flexbox horizontal align="center" gap={8}>
          <img alt="" height={24} src={faviconUrl} width={24} />
          <Text weight={500}>Byline</Text>
        </Flexbox>
      }
      card={false}
      tools={<AuthTools />}
      variant="elevated"
    >
      <div className={wizardStyles.board}>
        <nav aria-label={copy('railLabel')} className={wizardStyles.railCol}>
          <p className={wizardStyles.progress}>
            {remaining === 0
              ? copy('progressLast', progressValues)
              : copy('progress', progressValues)}
          </p>
          <ol className={wizardStyles.rail}>
            {railItems.flatMap((item) => {
              const state = itemState(item, props.step)
              return [
                <RailRow item={item} key={item.key} state={state} />,
                ...(item.children ?? []).map((child) => (
                  <RailRow
                    hidden={state === 'pending'}
                    item={child}
                    key={child.key}
                    state={itemState(child, props.step)}
                    sub
                  />
                )),
              ]
            })}
          </ol>
          {props.onLater ? (
            <Button htmlType="button" onClick={props.onLater} type="text">
              {copy('later')}
            </Button>
          ) : null}
          <a
            className={wizardStyles.docs}
            href={deploymentDocsUrl}
            rel="noreferrer"
            target="_blank"
          >
            {copy('docs')}
          </a>
        </nav>
        <div className={wizardStyles.stage}>
          <main>{props.children}</main>
          {props.aside ? (
            <aside className={wizardStyles.aside}>{props.aside}</aside>
          ) : null}
        </div>
      </div>
    </AuthLayout>
  )
}

export function OnboardingCard(
  props: PropsWithChildren<{
    description?: ReactNode
    footer?: ReactNode
    title: ReactNode
  }>,
) {
  return (
    <section className={wizardStyles.card}>
      <header>
        <h1 className={wizardStyles.title}>{props.title}</h1>
        {props.description ? (
          <p className={wizardStyles.description}>{props.description}</p>
        ) : null}
      </header>
      <div className={wizardStyles.body}>{props.children}</div>
      {props.footer ? (
        <footer className={wizardStyles.footer}>{props.footer}</footer>
      ) : null}
    </section>
  )
}

export function OnboardingFooter(
  props: PropsWithChildren<{ meta?: ReactNode; onBack?: () => void }>,
) {
  const copy = useSetupCopy()
  return (
    <>
      {props.onBack ? (
        <Button
          htmlType="button"
          icon={ChevronLeft}
          onClick={props.onBack}
          type="text"
        >
          {copy('back')}
        </Button>
      ) : (
        <span>{props.meta}</span>
      )}
      <div className={wizardStyles.actions}>{props.children}</div>
    </>
  )
}
