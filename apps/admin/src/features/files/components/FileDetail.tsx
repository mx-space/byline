import {
  createStaticStyles,
  Descriptions,
  Drawer,
  Flexbox,
  Text,
  toast,
  useImagePreview,
} from '@lobehub/ui'
import { Copy, Download, ExternalLink, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'

import { Button } from '~/ui/site-button'

import { useFileCopy } from '../copy'
import { fileKindOf } from '../utils/file-kind'
import { FileThumb } from './FileThumb'

const styles = createStaticStyles(({ css, cssVar }) => ({
  image: css`
    display: block;
    max-width: 100%;
    max-height: 360px;
    margin-inline: auto;
    object-fit: contain;
  `,
  media: css`
    width: 100%;
  `,
  preview: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 200px;
    padding: 16px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadiusLG};

    background: ${cssVar.colorFillQuaternary};
  `,
  previewButton: css`
    display: block;
    width: 100%;
    padding: 0;
    border: 0;

    background: transparent;

    cursor: zoom-in;

    &:focus-visible {
      outline: 2px solid ${cssVar.colorPrimary};
      outline-offset: 2px;
    }
  `,
  section: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  sectionTitle: css`
    font-weight: 600;
    color: ${cssVar.colorText};
  `,
  status: css`
    flex-shrink: 0;
  `,
  url: css`
    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    word-break: break-all;
  `,
}))

export interface FileFact {
  key: string
  label: string
  value: ReactNode
}

export function FileDrawer(props: {
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  title: ReactNode
}) {
  return (
    <Drawer
      footer={props.footer}
      onClose={props.onClose}
      open
      placement="right"
      title={props.title}
      width="min(100vw, 520px)"
    >
      {props.children}
    </Drawer>
  )
}

export async function copyFileLink(
  url: string,
  messages: { failed: string; success: string },
) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(messages.success)
  } catch {
    toast.error(messages.failed)
  }
}

function downloadFile(url: string, name: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.rel = 'noreferrer'
  anchor.target = '_blank'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export function FileDetailState(props: {
  children: ReactNode
  onClose: () => void
  title: ReactNode
}) {
  return (
    <FileDrawer onClose={props.onClose} title={props.title}>
      {props.children}
    </FileDrawer>
  )
}

export function FileDetail(props: {
  deleteDisabled?: boolean
  facts: FileFact[]
  meta?: ReactNode
  mime?: null | string
  name: string
  onClose: () => void
  onDelete: () => void
  references: ReactNode
  status?: ReactNode
  url: string
}) {
  const copy = useFileCopy()
  const [dimensions, setDimensions] = useState<string | null>(null)
  const kind = fileKindOf(props.name, props.mime)

  const facts = dimensions
    ? [
        {
          key: 'dimensions',
          label: copy('fieldDimensions'),
          value: dimensions,
        },
        ...props.facts,
      ]
    : props.facts

  return (
    <FileDrawer
      footer={
        <Flexbox gap={8} horizontal justify="flex-end">
          <Button
            danger
            disabled={props.deleteDisabled}
            icon={Trash2}
            onClick={props.onDelete}
          >
            {copy('deleteFile')}
          </Button>
          <Button
            icon={Download}
            onClick={() => downloadFile(props.url, props.name)}
          >
            {copy('download')}
          </Button>
          <Button
            icon={Copy}
            onClick={() =>
              void copyFileLink(props.url, {
                failed: copy('copyFailed'),
                success: copy('copied'),
              })
            }
            type="primary"
          >
            {copy('copyLink')}
          </Button>
        </Flexbox>
      }
      onClose={props.onClose}
      title={
        <Flexbox gap={2} style={{ minWidth: 0 }}>
          <Flexbox align="center" gap={8} horizontal style={{ minWidth: 0 }}>
            <Text
              ellipsis={{ tooltipWhenOverflow: true }}
              style={{ flex: '0 1 auto', minWidth: 0 }}
            >
              {props.name}
            </Text>
            {props.status ? (
              <span className={styles.status}>{props.status}</span>
            ) : null}
          </Flexbox>
          {props.meta ? (
            <Text type="secondary">
              <Flexbox gap={8} horizontal>
                {props.meta}
              </Flexbox>
            </Text>
          ) : null}
        </Flexbox>
      }
    >
      <Flexbox gap={24}>
        <div className={styles.preview}>
          {kind === 'image' ? (
            <ImagePreview
              onDimensions={setDimensions}
              src={props.url}
              zoomLabel={copy('viewLarge')}
            />
          ) : kind === 'audio' ? (
            <audio
              className={styles.media}
              controls
              preload="metadata"
              src={props.url}
            />
          ) : kind === 'video' ? (
            <video
              className={styles.media}
              controls
              preload="metadata"
              src={props.url}
            />
          ) : (
            <Flexbox align="center" gap={12}>
              <FileThumb name={props.name} size={96} url={props.url} />
              <Button
                href={props.url}
                icon={ExternalLink}
                rel="noreferrer"
                target="_blank"
                type="text"
              >
                {copy('openFile')}
              </Button>
            </Flexbox>
          )}
        </div>
        <section className={styles.section}>
          <Text className={styles.sectionTitle}>{copy('detailsTitle')}</Text>
          <Descriptions
            column={1}
            items={[
              ...facts.map((fact) => ({
                children: fact.value,
                key: fact.key,
                label: fact.label,
              })),
              {
                children: (
                  <Text className={styles.url} type="secondary">
                    {props.url}
                  </Text>
                ),
                key: 'url',
                label: copy('fieldUrl'),
              },
            ]}
          />
        </section>
        <section className={styles.section}>
          <Text className={styles.sectionTitle}>{copy('referencesTitle')}</Text>
          {props.references}
        </section>
      </Flexbox>
    </FileDrawer>
  )
}

function ImagePreview(props: {
  onDimensions: (value: string) => void
  src: string
  zoomLabel: string
}) {
  const imageRef = useRef<HTMLImageElement>(null)
  const preview = useImagePreview(imageRef, { src: props.src })

  return (
    <>
      <button
        aria-label={props.zoomLabel}
        className={styles.previewButton}
        onClick={() => preview.open()}
        title={props.zoomLabel}
        type="button"
      >
        <img
          alt=""
          className={styles.image}
          onLoad={(event) => {
            const image = event.currentTarget
            if (image.naturalWidth > 0) {
              props.onDimensions(
                `${image.naturalWidth} × ${image.naturalHeight}`,
              )
            }
          }}
          ref={imageRef}
          src={props.src}
        />
      </button>
      {preview.outlet}
    </>
  )
}
