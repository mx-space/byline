import { Block, Flexbox, Text } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { getMe } from '~/api/users'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { useSetupCopy } from '../copy'
import {
  claimPendingOnboarding,
  readOnboardingProgress,
  writeOnboardingProgress,
} from '../utils/onboarding'
import { wizardStyles } from './wizard-styles'

export function OnboardingResumeBanner(props: { className?: string }) {
  // lobe-design-ignore DETAIL-NO-RETRY: 读不到当前用户时不显示横幅，重试由所在页面负责
  const copy = useSetupCopy()
  const ownerQuery = useQuery({
    queryFn: getMe,
    queryKey: adminQueryKeys.users.me(),
  })
  const [dismissed, setDismissed] = useState(false)
  const ownerId = ownerQuery.data?.id
  const progress = ownerId
    ? (readOnboardingProgress(ownerId) ?? claimPendingOnboarding(ownerId))
    : null

  if (
    ownerQuery.isPending ||
    ownerQuery.isError ||
    !ownerId ||
    !progress ||
    progress.status !== 'active' ||
    dismissed
  ) {
    return null
  }

  const dismiss = () => {
    writeOnboardingProgress(ownerId, { ...progress, status: 'dismissed' })
    setDismissed(true)
  }

  return (
    <Block
      align="center"
      className={props.className}
      gap={12}
      horizontal
      variant="outlined"
    >
      <Flexbox gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Text>{copy('resumeTitle')}</Text>
        <Text type="secondary">{copy('resumeDescription')}</Text>
      </Flexbox>
      <Button
        data-testid="onboarding-dismiss"
        htmlType="button"
        onClick={dismiss}
        type="text"
      >
        {copy('resumeDismiss')}
      </Button>
      <Link className={wizardStyles.link} to="/setup">
        {copy('resumeContinue')}
      </Link>
    </Block>
  )
}
