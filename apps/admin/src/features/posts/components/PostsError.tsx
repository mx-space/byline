import { Button, Empty } from '@lobehub/ui'
import { FileText } from 'lucide-react'

import { usePostCopy } from '../copy'
import { styles } from './styles'

export function PostsError(props: {
  kind: 'failed' | 'slow'
  onRetry: () => void
}) {
  const copy = usePostCopy()
  const slow = props.kind === 'slow'

  return (
    <div className={styles.state}>
      <Empty
        action={
          <Button htmlType="button" onClick={props.onRetry}>
            {copy('retry')}
          </Button>
        }
        description={slow ? copy('slowDescription') : copy('errorDescription')}
        icon={FileText}
        title={slow ? copy('slowTitle') : copy('errorTitle')}
      />
    </div>
  )
}
