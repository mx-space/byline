import { Center, Empty, Skeleton } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { getWebhooks } from '~/api/webhooks'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { adminQueryKeys } from '~/query/keys'
import { DetailPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useWebhookCopy } from '../copy'
import { endpointUrl, errorText } from '../utils/webhooks'
import { styles } from './styles'
import { WebhookDetail } from './WebhookDetail'
import { useWebhooksRouteContext } from './webhooks-route-context'

export function WebhookDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const text = useWebhookCopy()
  const ctx = useWebhooksRouteContext()
  const query = useQuery({
    queryFn: getWebhooks,
    queryKey: adminQueryKeys.webhooks.list(),
  })
  const webhook = query.data?.find((item) => item.id === id)
  useDocumentTitle(endpointUrl(webhook) || text('listTitle'))

  if (webhook) {
    return (
      <WebhookDetail
        onBack={ctx.onBack}
        onDeleted={() => ctx.onDeleted(webhook.id)}
        webhook={webhook}
      />
    )
  }

  if (query.isPending) {
    return (
      <DetailPane
        backLabel={text('backToList')}
        onBack={ctx.onBack}
        title={<Skeleton height={20} width={240} />}
      >
        <div className={styles.drawerBody}>
          <Skeleton height={32} width="100%" />
          <Skeleton height={32} width="100%" />
          <Skeleton height={160} width="100%" />
        </div>
      </DetailPane>
    )
  }

  return (
    <DetailPane
      backLabel={text('backToList')}
      onBack={ctx.onBack}
      title={text('listTitle')}
    >
      <Center paddingBlock={48}>
        {query.isError ? (
          <Empty
            action={
              <Button onClick={() => void query.refetch()}>
                {text('retry')}
              </Button>
            }
            description={errorText(query.error, text('listErrorDescription'))}
            title={text('listErrorTitle')}
          />
        ) : (
          <Empty
            action={<Button onClick={ctx.onBack}>{text('backToList')}</Button>}
            description={text('notFoundDescription')}
            title={text('notFoundTitle')}
          />
        )}
      </Center>
    </DetailPane>
  )
}

export default WebhookDetailRoute
