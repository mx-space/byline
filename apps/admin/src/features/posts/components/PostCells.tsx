import {
  ActionIcon,
  Avatar,
  type ContextMenuItem,
  DropdownMenu,
  Icon,
  Tag,
  Text,
  Tooltip,
} from '@lobehub/ui'
import {
  Ellipsis,
  ExternalLink,
  Image as ImageIcon,
  Pencil,
  Pin,
} from 'lucide-react'
import { useState } from 'react'

import { usePostPermalink } from '~/hooks/use-post-permalink'
import { usePostScheduled } from '~/hooks/use-post-scheduled'
import { useI18n } from '~/i18n'
import type { PostModel } from '~/models/post'

import { usePostCopy } from '../copy'
import { bylineNames, postTitle } from './post-format'
import { styles } from './styles'

const MAX_AVATARS = 3

export function PostStatusCell({ post }: { post: PostModel }) {
  const copy = usePostCopy()
  const { format } = useI18n()
  const scheduled = usePostScheduled(post)
  return scheduled ? (
    <Tooltip title={post.publicAt ? format.dateTime(post.publicAt) : undefined}>
      <Tag color="warning">{copy('scheduled')}</Tag>
    </Tooltip>
  ) : post.isPublished ? (
    <Tag color="success">{copy('published')}</Tag>
  ) : (
    <Tag>{copy('draft')}</Tag>
  )
}

function PostCover(props: { src?: string | null }) {
  const src = props.src?.trim() ?? ''
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const show = src.length > 0 && failedSrc !== src
  return (
    <span aria-hidden className={styles.cover}>
      {show ? (
        <img
          alt=""
          className={styles.coverImage}
          decoding="async"
          loading="lazy"
          onError={() => setFailedSrc(src)}
          src={src}
        />
      ) : (
        <Icon className={styles.coverIcon} icon={ImageIcon} size="small" />
      )}
    </span>
  )
}

export function PostTitleCell(props: { post: PostModel }) {
  const copy = usePostCopy()
  const { post } = props
  const title = postTitle(post, copy('untitled'))
  return (
    <div className={styles.titleCell}>
      <PostCover src={post.image} />
      <div className={styles.titleBody}>
        <div className={styles.titleLine}>
          {post.pinAt ? (
            <Icon
              aria-label={copy('pinned')}
              className={styles.pin}
              icon={Pin}
              role="img"
              size="small"
            />
          ) : null}
          <span className={styles.titleText} title={title}>
            {title}
          </span>
        </div>
        <span className={styles.slug}>
          /{post.category?.slug ?? post.categoryId}/{post.slug}
        </span>
      </div>
    </div>
  )
}

export function PostBylineCell(props: { post: PostModel }) {
  const copy = usePostCopy()
  const authors = props.post.authors ?? []
  const names = bylineNames(props.post)
  if (names.length === 0)
    return <Text type="secondary">{copy('emptyValue')}</Text>
  const byline = names.join(copy('authorSeparator'))
  return (
    <div className={styles.byline}>
      <span className={styles.avatarStack}>
        {authors.slice(0, MAX_AVATARS).map((author) => (
          <Avatar
            alt={author.displayName}
            avatar={
              author.avatar || author.displayName.slice(0, 1).toUpperCase()
            }
            key={author.id}
            size={22}
          />
        ))}
      </span>
      <Text ellipsis={{ tooltip: byline }} type="secondary">
        {byline}
      </Text>
    </div>
  )
}

export function PostRowActions(props: {
  menuItems: () => ContextMenuItem[]
  onEdit: () => void
  post: PostModel
}) {
  const copy = usePostCopy()
  const scheduled = usePostScheduled(props.post)
  const { postUrl } = usePostPermalink()
  return (
    <div className={styles.actions} data-row-actions="">
      <ActionIcon
        aria-label={copy('edit')}
        icon={Pencil}
        onClick={props.onEdit}
        size="small"
        title={copy('edit')}
      />
      {props.post.isPublished && !scheduled ? (
        <ActionIcon
          aria-label={copy('openLink')}
          icon={ExternalLink}
          onClick={() =>
            window.open(postUrl(props.post), '_blank', 'noopener,noreferrer')
          }
          size="small"
          title={copy('openLink')}
        />
      ) : null}
      <DropdownMenu items={props.menuItems}>
        <ActionIcon
          aria-label={copy('more')}
          icon={Ellipsis}
          size="small"
          title={copy('more')}
        />
      </DropdownMenu>
    </div>
  )
}
