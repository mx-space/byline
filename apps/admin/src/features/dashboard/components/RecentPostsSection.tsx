import { Button, Empty, Tag, Text, Tooltip } from '@lobehub/ui'
import { Section } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useI18n } from '~/i18n'

import { useDashboardCopy } from '../copy'
import { recentPostsQuery } from '../queries'
import { displayDeskTime, newPostPath, postsPath } from '../utils/desk'
import { DeskQueryState } from './DeskGroup'
import { DeskRecordLink } from './DeskRecordLink'

export function RecentPostsSection() {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const navigate = useNavigate()
  const query = useQuery(recentPostsQuery)
  const posts = query.data?.data ?? []
  const total = query.data?.pagination.total ?? 0

  return (
    <Section
      gap={4}
      more={
        total > posts.length
          ? copy('viewPosts', { count: format.number(total) })
          : undefined
      }
      moreLink={total > posts.length ? postsPath : undefined}
      title={copy('recentTitle')}
      variant="card"
    >
      <DeskQueryState errorMessage={copy('recentError')} query={query}>
        {posts.length === 0 ? (
          <Empty
            action={
              <Button onClick={() => navigate(newPostPath)}>
                {copy('writePost')}
              </Button>
            }
            icon={FileText}
            title={copy('recentEmptyTitle')}
          />
        ) : (
          posts.map((post) => {
            const updated = post.modifiedAt || post.createdAt
            return (
              <DeskRecordLink
                key={post.id}
                meta={
                  <>
                    {post.isPublished ? null : (
                      <Tag size="small">{copy('unpublished')}</Tag>
                    )}
                    <Tooltip title={new Date(updated).toLocaleString()}>
                      <Text as="span" type="secondary">
                        {displayDeskTime(format.relativeTime(updated))}
                      </Text>
                    </Tooltip>
                  </>
                }
                subtitle={
                  post.category?.name ? (
                    <Text as="span" ellipsis type="secondary">
                      {post.category.name}
                    </Text>
                  ) : null
                }
                title={post.title || copy('untitled')}
                to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
              />
            )
          })
        )}
      </DeskQueryState>
    </Section>
  )
}
