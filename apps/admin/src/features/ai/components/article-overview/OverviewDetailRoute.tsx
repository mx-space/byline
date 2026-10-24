import { useParams } from 'react-router'

import { OverviewDetailPane } from './OverviewDetailPane'

export function OverviewDetailRoute() {
  const { id } = useParams<{ id: string }>()

  if (!id) return null

  return <OverviewDetailPane refId={id} />
}
