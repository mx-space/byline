import {
  Alert,
  Button,
  createStaticStyles,
  Flexbox,
  SkeletonText,
  Text,
} from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { getPostsByAuthor } from '../api'
import { useUsersCopy } from '../copy'
import { bylinePlace, showValue } from '../utils/users'

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

  if (postsQuery.isLoading) return <SkeletonText />

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
  if (posts.length === 0) return null

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
                {showValue(post.title)}
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
