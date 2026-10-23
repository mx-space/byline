import { useLocation, useNavigate, useParams } from 'react-router'

import { OverviewDetailPane } from './OverviewDetailPane'

export function OverviewDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  if (!id) return null

  const close = () =>
    navigate({ pathname: '/ai/overview', search: location.search })

  return <OverviewDetailPane onClose={close} refId={id} />
}
