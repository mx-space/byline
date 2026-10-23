import { Button, Empty } from '@lobehub/ui'
import { FileText, Plus } from 'lucide-react'

import { usePostCopy } from '../copy'
import { styles } from './styles'

export function PostsEmpty(props: {
  kind: 'filter' | 'first' | 'page'
  onBack: () => void
  onClear: () => void
  onWrite: () => void
}) {
  const copy = usePostCopy()
  const title =
    props.kind === 'first'
      ? copy('firstEmptyTitle')
      : props.kind === 'page'
        ? copy('pageEmptyTitle')
        : copy('filterEmptyTitle')
  const description =
    props.kind === 'first'
      ? copy('firstEmptyDescription')
      : props.kind === 'page'
        ? copy('pageEmptyDescription')
        : copy('filterEmptyDescription')

  return (
    <div className={styles.state}>
      <Empty
        action={
          props.kind === 'first' ? (
            <Button htmlType="button" icon={Plus} onClick={props.onWrite}>
              {copy('write')}
            </Button>
          ) : (
            <Button
              htmlType="button"
              onClick={props.kind === 'page' ? props.onBack : props.onClear}
            >
              {props.kind === 'page'
                ? copy('backToFirst')
                : copy('clearFilters')}
            </Button>
          )
        }
        description={description}
        icon={FileText}
        title={title}
      />
    </div>
  )
}
