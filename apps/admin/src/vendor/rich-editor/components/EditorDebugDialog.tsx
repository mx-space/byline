import { createStaticStyles, toast } from '@lobehub/ui'
import type { ReactNode } from 'react'
import { Fragment, useMemo } from 'react'

import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u00b605d7: css`
    color: ${cssVar.colorInfo};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorInfo};
    }
  `,
  ub09adbd2: css`
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
    }
  `,
  u8654ece3: css`
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  uc3e2ed85: css`
    color: ${cssVar.colorInfo};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorInfo};
    }
  `,
  u456314b9: css`
    display: flex;
    max-height: 80svh;
    width: 100%;
    flex-direction: column;
  `,
  u3e2463bc: css`
    min-height: 0px;
    flex: 1 1 0%;
    overflow: auto;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 1.5rem;
    padding-block: 1rem;
  `,
  u42a08798: css`
    margin: 0px;
    white-space: pre;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.625;
    color: ${cssVar.colorText};
  `,
}))

interface EditorDebugDialogProps {
  editorStateJson: string
}

const JSON_TOKEN_PATTERN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?)|\b(true|false|null)\b/g

function highlightJson(json: string): ReactNode[] {
  const out: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  JSON_TOKEN_PATTERN.lastIndex = 0
  let m: RegExpExecArray | null = JSON_TOKEN_PATTERN.exec(json)
  while (m !== null) {
    if (m.index > lastIndex) out.push(json.slice(lastIndex, m.index))
    const [, str, colon, num, lit] = m
    if (str !== undefined) {
      if (colon !== undefined) {
        out.push(
          <span className={lobeStyles.u00b605d7} key={key++}>
            {str}
          </span>,
          colon,
        )
      } else {
        out.push(
          <span className={lobeStyles.ub09adbd2} key={key++}>
            {str}
          </span>,
        )
      }
    } else if (num !== undefined) {
      out.push(
        <span className={lobeStyles.u8654ece3} key={key++}>
          {num}
        </span>,
      )
    } else if (lit !== undefined) {
      out.push(
        <span className={lobeStyles.uc3e2ed85} key={key++}>
          {lit}
        </span>,
      )
    }
    lastIndex = JSON_TOKEN_PATTERN.lastIndex
    m = JSON_TOKEN_PATTERN.exec(json)
  }
  if (lastIndex < json.length) out.push(json.slice(lastIndex))
  return out
}

function EditorDebugDialog({ editorStateJson }: EditorDebugDialogProps) {
  const modal = useModal<void>()
  const highlighted = useMemo(
    () => highlightJson(editorStateJson),
    [editorStateJson],
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editorStateJson)
      toast.success('已复制至剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([editorStateJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lexical-state-${new Date()
      .toISOString()
      .replaceAll(':', '-')}.json`
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={lobeStyles.u456314b9}>
      <ModalHeader title="调试 · Editor State" />
      <div className={lobeStyles.u3e2463bc}>
        <pre className={lobeStyles.u42a08798}>
          {highlighted.map((node, i) => (
            <Fragment key={i}>{node}</Fragment>
          ))}
        </pre>
      </div>
      <ModalFooter>
        <Button onClick={() => modal.dismiss()} type="button" variant="subtle">
          关闭
        </Button>
        <Button onClick={handleDownload} type="button" variant="secondary">
          下载
        </Button>
        <Button onClick={handleCopy} type="button" variant="primary">
          复制
        </Button>
      </ModalFooter>
    </div>
  )
}

export function presentEditorDebugDialog(editorStateJson: string) {
  return present(
    EditorDebugDialog,
    { editorStateJson },
    {
      modalProps: {
        popupStyle: { width: 'min(92vw, 48rem)', maxHeight: '80svh' },
      },
    },
  )
}
