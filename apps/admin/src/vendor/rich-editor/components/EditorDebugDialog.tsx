import { Flexbox, Highlighter, Modal, toast } from '@lobehub/ui'

import { Button } from '~/ui/site-button'

export function EditorDebugDialog(props: {
  json: string | null
  onClose: () => void
}) {
  const json = props.json ?? ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      toast.success('已复制 Editor State')
    } catch {
      toast.error('复制失败')
    }
  }

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lexical-state-${new Date().toISOString().replaceAll(':', '-')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      footer={
        <Flexbox gap={8} horizontal justify="flex-end">
          <Button onClick={props.onClose} type="text">
            关闭
          </Button>
          <Button onClick={download}>下载</Button>
          <Button onClick={() => void copy()} type="primary">
            复制
          </Button>
        </Flexbox>
      }
      onCancel={props.onClose}
      open={props.json != null}
      title="调试 · Editor State"
      width={720}
    >
      <Highlighter
        language="json"
        style={{ maxHeight: 'min(60vh, 32rem)', overflow: 'auto' }}
        variant="filled"
        wrap
      >
        {json}
      </Highlighter>
    </Modal>
  )
}
