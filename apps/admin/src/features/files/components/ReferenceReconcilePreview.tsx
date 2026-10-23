import { createStaticStyles, Flexbox, Text } from '@lobehub/ui'

import type { FileReferenceReconciliationResult } from '~/api/files'

import { useFileCopy } from '../copy'

const styles = createStaticStyles(({ css, cssVar }) => ({
  metrics: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  `,
  value: css`
    font-variant-numeric: tabular-nums;
  `,
  row: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-block: 8px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
}))

export function hasReferenceReconcileChanges(
  result: FileReferenceReconciliationResult,
) {
  return (
    result.missingReferences > 0 ||
    result.statusToActive > 0 ||
    result.statusToPending > 0 ||
    result.usageChanges > 0
  )
}

export async function runReferenceReconcileFlow(input: {
  confirm: (preview: FileReferenceReconciliationResult) => Promise<boolean>
  onUpToDate: (
    preview: FileReferenceReconciliationResult,
  ) => Promise<void> | void
  scan: (apply: boolean) => Promise<FileReferenceReconciliationResult>
}) {
  const preview = await input.scan(false)
  if (!hasReferenceReconcileChanges(preview)) {
    await input.onUpToDate(preview)
    return null
  }
  if (!(await input.confirm(preview))) return null
  return input.scan(true)
}

export function ReferenceReconcilePreview(props: {
  result: FileReferenceReconciliationResult
}) {
  const copy = useFileCopy()
  const metrics = [
    { label: copy('metricScanned'), value: props.result.scannedFiles },
    { label: copy('metricReferenced'), value: props.result.referencedFiles },
    { label: copy('metricIsolated'), value: props.result.isolatedFiles },
    { label: copy('metricUsages'), value: props.result.usages },
  ]
  const changes = [
    { label: copy('changeDiscovered'), value: props.result.missingReferences },
    { label: copy('changeActive'), value: props.result.statusToActive },
    { label: copy('changePending'), value: props.result.statusToPending },
    { label: copy('changeUsages'), value: props.result.usageChanges },
  ].filter((change) => change.value > 0)

  return (
    <Flexbox direction="vertical" gap={16}>
      <div className={styles.metrics}>
        {metrics.map((metric) => (
          <Flexbox direction="vertical" gap={4} key={metric.label}>
            <Text type="secondary">{metric.label}</Text>
            <Text className={styles.value} weight="bold">
              {metric.value}
            </Text>
          </Flexbox>
        ))}
      </div>
      {changes.length > 0 ? (
        <Flexbox direction="vertical" gap={8}>
          <Text type="secondary">{copy('reconcileChanges')}</Text>
          <div>
            {changes.map((change) => (
              <div className={styles.row} key={change.label}>
                <Text>{change.label}</Text>
                <Text className={styles.value}>{change.value}</Text>
              </div>
            ))}
          </div>
        </Flexbox>
      ) : null}
      <Text type="secondary">{copy('reconcileSafety')}</Text>
    </Flexbox>
  )
}
