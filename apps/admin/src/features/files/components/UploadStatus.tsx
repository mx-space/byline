import { createStaticStyles, Flexbox, Progress, Text } from '@lobehub/ui'

import type { UploadItem } from '../hooks/useFileUploader'

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    padding-block: 12px;
    padding-inline: 16px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadiusLG};
  `,
  name: css`
    min-width: 0;
    flex: 1;
  `,
  progress: css`
    width: 120px;
    flex-shrink: 0;
  `,
}))

export function UploadStatus(props: {
  doneLabel: string
  errorLabel: (count: number) => string
  items: UploadItem[]
  progressLabel: (count: number) => string
}) {
  if (props.items.length === 0) return null
  const uploading = props.items.filter((item) => item.status === 'uploading')
  const errors = props.items.filter((item) => item.status === 'error')
  const summary =
    uploading.length > 0
      ? props.progressLabel(uploading.length)
      : errors.length > 0
        ? props.errorLabel(errors.length)
        : props.doneLabel

  return (
    <Flexbox aria-live="polite" className={styles.card} gap={8}>
      <Text
        type={
          errors.length > 0 && uploading.length === 0 ? 'danger' : 'secondary'
        }
        weight={500}
      >
        {summary}
      </Text>
      {props.items.map((item) => (
        <Flexbox align="center" gap={12} horizontal key={item.id}>
          <Text className={styles.name} ellipsis>
            {item.name}
          </Text>
          {item.error ? (
            <Text ellipsis type="danger">
              {item.error}
            </Text>
          ) : null}
          <Progress
            className={styles.progress}
            percent={item.progress}
            size="small"
            status={
              item.status === 'error'
                ? 'exception'
                : item.status === 'done'
                  ? 'success'
                  : 'active'
            }
          />
        </Flexbox>
      ))}
    </Flexbox>
  )
}
