import { FolderOpen, PenLine } from 'lucide-react'
import { useMemo } from 'react'

import { useI18n } from '~/i18n'
import { MobileHeaderAffordance } from '~/ui/layout/mobile-header-affordance'
import { ButtonLink } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

import { resolveGreetingKey } from '../utils/desk'

const actionClassName =
  'phone:bg-surface-inset phone:text-fg phone:hover:bg-surface-inset'

export function DeskGreeting(props: { className?: string }) {
  const { format, t } = useI18n()
  const now = useMemo(() => new Date(), [])

  return (
    <header className={cn('pb-8 phone:pb-6', props.className)}>
      <div className="flex min-w-0 items-center gap-2">
        <MobileHeaderAffordance />
        <p className="truncate text-xs tabular-nums text-fg-subtle">
          {format.dateTime(now, { dateStyle: 'full', timeStyle: undefined })}
        </p>
      </div>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-fg phone:text-2xl">
        {t(resolveGreetingKey(now.getHours()))}
      </h1>
      <div className="-ml-3 mt-4 flex flex-wrap gap-1 phone:ml-0 phone:grid phone:grid-cols-2 phone:gap-2">
        <ButtonLink
          className={actionClassName}
          to="/posts/edit"
          variant="ghost"
        >
          <PenLine aria-hidden="true" className="size-4" />
          {t('dashboard.desk.action.post')}
        </ButtonLink>
        <ButtonLink className={actionClassName} to="/files" variant="ghost">
          <FolderOpen aria-hidden="true" className="size-4" />
          {t('dashboard.desk.action.files')}
        </ButtonLink>
      </div>
    </header>
  )
}
