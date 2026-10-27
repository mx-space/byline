import { RouteTabs } from '~/ui/page'

import { useFileCopy } from '../copy'
import { useOrphanCount } from '../hooks/useOrphanCount'

export function FilesTabs() {
  const copy = useFileCopy()
  const orphanCount = useOrphanCount()

  return (
    <RouteTabs
      label={copy('tabsLabel')}
      tabs={[
        { href: '/files', label: copy('tabLocal') },
        { href: '/files/remote', label: copy('tabRemote') },
        {
          count: orphanCount || undefined,
          href: '/files/orphans',
          label: copy('tabOrphans'),
        },
      ]}
    />
  )
}
