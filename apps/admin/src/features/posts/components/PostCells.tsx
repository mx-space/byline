import {
  ActionIcon,
  Avatar,
  type ContextMenuItem,
  DropdownMenu,
  Icon,
  Text,
} from '@lobehub/ui'
import { Ellipsis, ExternalLink, Pencil, Pin } from 'lucide-react'

import type { PostModel } from '~/models/post'

import { usePostCopy } from '../copy'
import { bylineNames, postExternalHref, postTitle } from './post-format'
import { styles } from './styles'

const MAX_AVATARS = 3

export function PostTitleCell(props: { post: PostModel }) {
  const copy = usePostCopy()
  const { post } = props
  const title = postTitle(post, copy('untitled'))
  return (
    <div className={styles.titleCell}>
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
  return (
    <div className={styles.actions} data-row-actions="">
      <ActionIcon
        aria-label={copy('edit')}
        icon={Pencil}
        onClick={props.onEdit}
        size="small"
        title={copy('edit')}
      />
      {props.post.isPublished ? (
        <ActionIcon
          aria-label={copy('openLink')}
          icon={ExternalLink}
          onClick={() =>
            window.open(
              postExternalHref(props.post),
              '_blank',
              'noopener,noreferrer',
            )
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
