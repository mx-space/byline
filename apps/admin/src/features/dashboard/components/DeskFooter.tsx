import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import { formatVersionLabel } from '../utils/desk'

export function DeskFooter(props: {
  adminVersion: string
  className?: string
  systemVersion: string
}) {
  const { t } = useI18n()

  return (
    <footer
      className={cn(
        'mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-5 text-xs text-fg-subtle',
        props.className,
      )}
    >
      <span>
        {t('dashboard.footer.versions', {
          admin: formatVersionLabel(props.adminVersion),
          system: formatVersionLabel(props.systemVersion),
        })}
      </span>
    </footer>
  )
}
