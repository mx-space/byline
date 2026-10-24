import { Checkbox, Flexbox, Modal, Text, toast } from '@lobehub/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import type { AiOverviewCapability } from '~/api/ai-overview'
import { adminQueryKeys } from '~/query/keys'

import { useAiCopy } from '../copy'
import { CAPABILITY_LABEL } from './capability-label'
import type { MatrixRow } from './coverage'
import { buildFillJobs, countGaps, MATRIX_CAPABILITIES } from './coverage'
import { runFillJobs } from './fill-gaps'

export function FillGapsModal(props: {
  capability?: AiOverviewCapability
  onClose: () => void
  onDone?: () => void
  rows: MatrixRow[]
}) {
  const copy = useAiCopy()
  const queryClient = useQueryClient()
  const counts = useMemo(() => countGaps(props.rows), [props.rows])
  const available = MATRIX_CAPABILITIES.filter(
    (capability) => counts.byCapability[capability].items > 0,
  )
  const [picked, setPicked] = useState<AiOverviewCapability[]>(() =>
    props.capability && available.includes(props.capability)
      ? [props.capability]
      : available,
  )
  const [running, setRunning] = useState(false)

  const jobs = useMemo(
    () => buildFillJobs(props.rows, picked),
    [picked, props.rows],
  )

  const submit = async () => {
    if (!jobs.length) return
    setRunning(true)
    try {
      const result = await runFillJobs(jobs)
      const started = result.created + result.existing
      if (result.failed) {
        toast.warning(
          copy('fillPartial', { created: started, failed: result.failed }),
        )
      } else {
        toast.success(copy('fillStarted', { count: started }))
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.ai.overviewRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.tasks.tasksRoot,
        }),
      ])
      props.onDone?.()
      props.onClose()
    } finally {
      setRunning(false)
    }
  }

  return (
    <Modal
      cancelText={copy('cancel')}
      confirmLoading={running}
      okButtonProps={{ disabled: !jobs.length }}
      okText={copy('fillConfirm')}
      onCancel={() => {
        if (!running) props.onClose()
      }}
      onOk={() => void submit()}
      open
      title={copy('fillTitle', { count: props.rows.length })}
      width="min(440px, 100%)"
    >
      {available.length ? (
        <Flexbox gap={16}>
          <Flexbox gap={12}>
            {available.map((capability) => {
              const count = counts.byCapability[capability]
              return (
                <Checkbox
                  checked={picked.includes(capability)}
                  key={capability}
                  onChange={(checked) =>
                    setPicked((current) =>
                      checked
                        ? [...current, capability]
                        : current.filter((item) => item !== capability),
                    )
                  }
                >
                  <Flexbox gap={8} horizontal>
                    <Text>{copy(CAPABILITY_LABEL[capability])}</Text>
                    <Text type="secondary">
                      {copy('fillLine', {
                        items: count.items,
                        posts: count.posts,
                      })}
                    </Text>
                  </Flexbox>
                </Checkbox>
              )
            })}
          </Flexbox>
          <Text type="secondary">{copy('fillHint')}</Text>
        </Flexbox>
      ) : (
        <Text type="secondary">{copy('fillNothing')}</Text>
      )}
    </Modal>
  )
}
