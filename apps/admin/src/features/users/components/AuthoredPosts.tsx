import { Alert, createStaticStyles, Empty, Flexbox, Text } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { emptyOr, ListSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { getPostsByAuthor } from '../api'
import { useUsersCopy } from '../copy'
import { bylinePlace } from '../utils/users'

const styles = createStaticStyles(({ css, cssVar }) => ({
  link: css`
    min-width: 0;
    color: ${cssVar.colorText};
    text-decoration: none;
  `,
}))

export function AuthoredPosts(props: { userId: string }) {
  const copy = useUsersCopy()
  const postsQuery = useQuery({
    queryFn: () => getPostsByAuthor(props.userId),
    queryKey: ['users', 'authored-posts', props.userId],
  })

  if (postsQuery.isLoading) {
    return <ListSkeleton label={copy('loading')} rows={3} />
  }

  if (postsQuery.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void postsQuery.refetch()}>
            {copy('retry')}
          </Button>
        }
        title={copy('postsError')}
        type="error"
      />
    )
  }

  const posts = postsQuery.data?.data ?? []
  if (posts.length === 0) {
    return <Empty title={copy('postsEmptyTitle')} />
  }

  const total = postsQuery.data?.pagination.total ?? posts.length
  const remaining = Math.max(total - posts.length, 0)

  return (
    <Flexbox gap={8}>
      <Text as="h2" weight="bold">
        {copy('postsTitle')}
      </Text>
      {posts.map((post) => {
        const place = bylinePlace(post.authors, props.userId)
        return (
          <Flexbox gap={4} key={post.id}>
            <Link
              className={styles.link}
              to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
            >
              <Text ellipsis={{ tooltipWhenOverflow: true }}>
                {emptyOr(post.title)}
              </Text>
            </Link>
            {place ? (
              <Text type="secondary">{copy('bylinePlace', { place })}</Text>
            ) : null}
          </Flexbox>
        )
      })}
      {remaining > 0 ? (
        <Text type="secondary">{copy('postsMore', { count: remaining })}</Text>
      ) : null}
    </Flexbox>
  )
}
