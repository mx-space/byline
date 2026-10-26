import {
  Button as LobeButton,
  createStaticStyles,
  Flexbox,
  Modal,
  toast,
} from '@lobehub/ui'
import { Link2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { usePostPermalink } from '~/hooks/use-post-permalink'
import type { PostModel } from '~/models/post'

import { useDashboardCopy } from '../copy'

const styles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    align-items: center;
    gap: 4px;
  `,
  copyLink: css`
    margin-inline-start: auto;
  `,
  body: css`
    padding: 0 20px 20px;
  `,
  copyLinkButton: css`
    color: ${cssVar.colorBgContainer} !important;
    background: ${cssVar.colorText} !important;
    border-color: transparent !important;

    &:hover {
      opacity: 0.88;
    }
  `,
  authors: css`
    font-weight: 600;
  `,
  cover: css`
    display: block;
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: ${cssVar.colorFill};
  `,
  header: css`
    padding: 20px 20px 16px;
  `,
  headline: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  lead: css`
    font-size: ${cssVar.fontSizeLG};
    font-weight: 600;
    line-height: 1.3;
    color: ${cssVar.colorSuccess};
  `,
  preview: css`
    overflow: hidden;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorFillQuaternary};
  `,
  postTitle: css`
    font-size: ${cssVar.fontSizeXL};
    font-weight: 700;
    line-height: 1.35;
  `,
  previewBody: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px;
  `,
  social: css`
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 50%;

    color: ${cssVar.colorText};

    background: transparent;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  spread: css`
    font-size: ${cssVar.fontSizeHeading3};
    font-weight: 700;
    line-height: 1.25;
    color: ${cssVar.colorText};
  `,
  summary: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    color: ${cssVar.colorTextSecondary};
  `,
}))

function encode(value: string) {
  return encodeURIComponent(value)
}

function SocialButton(props: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={props.label}
      className={styles.social}
      onClick={props.onClick}
      title={props.label}
      type="button"
    >
      {props.children}
    </button>
  )
}

function Mark(props: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      fill="currentColor"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      {props.children}
    </svg>
  )
}

export function SharePostModal(props: {
  onClose: () => void
  open: boolean
  post: PostModel
}) {
  const copy = useDashboardCopy()
  const { post } = props
  const { postUrl } = usePostPermalink()
  const href = postUrl(post)
  const title = post.title.trim() || copy('untitled')
  const summary = post.summary?.trim() ?? ''
  const authors = (post.authors ?? [])
    .map((author) => author.displayName.trim())
    .filter((name) => name.length > 0)
  const message = `${title} ${href}`
  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const targets = [
    {
      label: copy('shareOnX'),
      mark: (
        <Mark>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.874L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </Mark>
      ),
      url: `https://twitter.com/intent/tweet?text=${encode(title)}&url=${encode(href)}`,
    },
    {
      label: copy('shareOnThreads'),
      mark: (
        <Mark>
          <path d="M16.293 10.68c.10.1.1.5.1.84 0 2.47-1.34 5.22-4.89 5.22-2.2 0-3.55-1.12-3.9-2.52l1.72-.72c.18.72.9 1.56 2.18 1.56 1.78 0 2.92-1.32 2.92-3.24 0-.24-.02-.46-.05-.66-1.02.58-2.16.9-3.32.9-2.72 0-4.78-2.18-4.78-4.92S9.233 3.22 12 3.22c1.5 0 2.62.58 3.32 1.5l-1.48 1.02c-.38-.5-.98-.82-1.84-.82-1.62 0-2.78 1.28-2.78 2.96 0 1.64 1.12 2.88 2.7 2.88.7 0 1.32-.22 1.82-.58-.02-.16-.04-.32-.04-.5 0-1.08.88-1.96 1.96-1.96.54 0 1.02.22 1.38.56l.18-.28h.01Z" />
        </Mark>
      ),
      url: `https://www.threads.net/intent/post?text=${encode(message)}`,
    },
    {
      label: copy('shareOnFacebook'),
      mark: (
        <Mark>
          <path d="M14.5 8.5V6.8c0-.7.5-1 1.1-1h1.4V3h-2.2C11.9 3 11 4.4 11 6.6v1.9H9v2.8h2V21h3.5v-9.7h2.3l.4-2.8h-2.7Z" />
        </Mark>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encode(href)}`,
    },
    {
      label: copy('shareOnLinkedIn'),
      mark: (
        <Mark>
          <path d="M6.5 9H3.7v11h2.8V9ZM5.1 3.6A1.7 1.7 0 1 0 5.1 7a1.7 1.7 0 0 0 0-3.4ZM20.3 13.2c0-3-1.6-4.4-3.7-4.4-1.7 0-2.5.9-2.9 1.6V9H11v11h2.8v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.8 2 3.3V20h2.8v-6.8Z" />
        </Mark>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(href)}`,
    },
    {
      label: copy('shareOnBluesky'),
      mark: (
        <Mark>
          <path d="M12 11.2c-1.4-2.7-5.2-7.7-8.7-10.1C1.6.2.8 1.5 2.2 3.1 3.8 5 6.4 7.2 8 8.2 4.6 8.8 1.8 8.2.8 7.2c-.4 2.4.4 5 2.6 6.8-1.2.4-2.2 1.1-2.6 2.4-.2 2.6 3.2 3.6 5.5 3.1 1.6 1.1 3.3 1.6 5.7.2 2.4 1.4 4.1.9 5.7-.2 2.3.5 5.7-.5 5.5-3.1-.4-1.3-1.4-2-2.6-2.4 2.2-1.8 3-4.4 2.6-6.8-1 .9-3.8 1.6-7.2 1-1.6-1-4.2-3.2-5.8-5.1C11.2 2.5 10.4.2 8.7 1.1 6.8 2.2 4.2 5.2 3.3 6.6 5.4 8.4 8.6 11.2 12 11.2Z" />
        </Mark>
      ),
      url: `https://bsky.app/intent/compose?text=${encode(message)}`,
    },
  ]

  return (
    <Modal
      classNames={{ body: styles.body, header: styles.header }}
      footer={false}
      onCancel={props.onClose}
      open={props.open}
      title={
        <span className={styles.headline}>
          <span className={styles.lead}>{copy('sharePublished')}</span>
          <span className={styles.spread}>{copy('shareSpread')}</span>
        </span>
      }
      width={480}
    >
      <Flexbox gap={16}>
        <div className={styles.preview}>
          {post.image ? (
            <img alt="" className={styles.cover} src={post.image} />
          ) : null}
          <div className={styles.previewBody}>
            <span className={styles.postTitle}>{title}</span>
            {summary ? <span className={styles.summary}>{summary}</span> : null}
            {authors.length ? (
              <span className={styles.authors}>
                {authors.join(copy('authorSeparator'))}
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.actions}>
          {targets.map((target) => (
            <SocialButton
              key={target.label}
              label={target.label}
              onClick={() => openShare(target.url)}
            >
              {target.mark}
            </SocialButton>
          ))}
          <span className={styles.copyLink}>
            <LobeButton
              className={styles.copyLinkButton}
              icon={Link2}
              onClick={() => {
                void navigator.clipboard.writeText(href).then(
                  () => toast.success(copy('shareCopied')),
                  () => toast.error(copy('shareCopyFailed')),
                )
              }}
            >
              {copy('shareCopyLink')}
            </LobeButton>
          </span>
        </div>
      </Flexbox>
    </Modal>
  )
}
