import { useI18n } from '~/i18n'
import type { PostModel } from '~/models/post'
import { relativeTimeFromNow } from '~/utils/time'

import { DeskItem, DeskRailSection } from './DeskSection'

export function DeskRecentPostsCard(props: {
  className?: string
  posts: PostModel[]
}) {
  const { t } = useI18n()

  return (
    <DeskRailSection
      className={props.className}
      title={t('dashboard.desk.recentPosts.title')}
    >
      {props.posts.length === 0 ? (
        <p className="text-sm text-fg-muted">
          {t('dashboard.desk.recentPosts.empty')}
        </p>
      ) : (
        props.posts.map((post) => (
          <DeskItem
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2.5 py-2.5"
            key={post.id}
            to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
          >
            <span className="truncate text-sm text-fg transition-colors group-hover:text-accent">
              {post.title || t('dashboard.desk.untitled')}
            </span>
            <span className="whitespace-nowrap text-xs tabular-nums text-fg-subtle">
              {post.isPublished
                ? relativeTimeFromNow(post.modifiedAt || post.createdAt)
                : t('dashboard.desk.recentPosts.unpublished')}
            </span>
          </DeskItem>
        ))
      )}
    </DeskRailSection>
  )
}
