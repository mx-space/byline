import {
  Avatar,
  Button as LobeButton,
  createStaticStyles,
  cx,
  Empty,
  Icon,
  Text,
  Tooltip,
} from '@lobehub/ui'
import { Section } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Languages,
  Minus,
  Search,
  Upload,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { postExternalHref } from '~/features/posts/components/post-format'
import { useI18n } from '~/i18n'
import type { PostModel } from '~/models/post'
import { Button } from '~/ui/site-button'

import { useDashboardCopy } from '../copy'
import {
  latestPublishedQuery,
  postCountsQuery,
  translationCoverageQuery,
} from '../queries'
import {
  aiOverviewArticlePath,
  displayDeskTime,
  newPostPath,
  postSeoChecks,
  postsPath,
  postTranslationCheck,
  type SeoFieldCheck,
} from '../utils/desk'
import { DeskQueryState } from './DeskGroup'
import { SharePostModal } from './SharePostModal'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  cover: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    border-radius: ${cssVar.borderRadiusXS};

    background: ${cssVar.colorFillTertiary};
  `,
  coverFeature: css`
    width: 184px;
    height: 116px;

    ${responsive.lg} {
      width: 120px;
      height: 76px;
    }
  `,
  coverIcon: css`
    color: ${cssVar.colorTextQuaternary};
  `,
  coverImage: css`
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  `,
  coverRow: css`
    width: 88px;
    height: 56px;
  `,
  avatars: css`
    display: flex;
    flex: none;
    align-items: center;

    > * + * {
      margin-inline-start: -4px;
    }

    > * {
      border-radius: 50%;
      box-shadow: 0 0 0 2px ${cssVar.colorBgContainer};
    }
  `,
  copy: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `,
  check: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  `,
  checkLabel: css`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
  `,
  checkMuted: css`
    color: ${cssVar.colorTextTertiary};
  `,
  checkOk: css`
    color: ${cssVar.colorSuccess};
  `,
  checkProgress: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  seoField: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  seoList: css`
    display: flex;
    gap: 12px;
    min-width: 0;
  `,
  seoName: css`
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    white-space: nowrap;
  `,
  checkStatus: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;

    font-size: ${cssVar.fontSizeSM};
    white-space: nowrap;
  `,
  checkWarn: css`
    color: ${cssVar.colorWarning};
  `,
  checks: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;

    min-width: 0;
    padding-inline-start: 24px;
    border-inline-start: 1px solid ${cssVar.colorBorderSecondary};

    ${responsive.lg} {
      padding-block-start: 16px;
      padding-inline-start: 0;
      border-block-start: 1px solid ${cssVar.colorBorderSecondary};
      border-inline-start: 0;
    }
  `,
  feature: css`
    display: grid;
    grid-template-columns: 184px minmax(0, 1fr);
    gap: 16px;
    align-items: center;

    ${responsive.lg} {
      grid-template-columns: 120px minmax(0, 1fr);
    }
  `,
  featureRow: css`
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
    align-items: center;

    ${responsive.lg} {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  featureCover: css`
    color: inherit;
    text-decoration: none;
  `,
  featureBody: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  `,
  featureText: css`
    display: flex;
    flex-direction: column;
    gap: 6px;

    min-width: 0;
    max-width: 100%;

    color: inherit;
    text-decoration: none;
  `,
  featureTitle: css`
    overflow: hidden;

    font-size: ${cssVar.fontSizeLG};
    font-weight: 500;
    line-height: 1.4;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  liveActions: css`
    display: flex;
    align-items: center;
    gap: 16px;
  `,
  shareButton: css`
    color: ${cssVar.colorBgContainer} !important;
    background: ${cssVar.colorText} !important;
    border-color: transparent !important;

    &:hover {
      opacity: 0.88;
    }
  `,
  link: css`
    display: flex;
    align-items: center;
    gap: 16px;

    min-width: 0;
    padding-block: 4px;
    padding-inline: 0 12px;
    border-radius: ${cssVar.borderRadius};

    color: inherit;
    text-decoration: none;

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  meta: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
  `,
  metaText: css`
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))

function PostCover(props: { featured?: boolean; src?: string | null }) {
  const src = props.src?.trim() ?? ''
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const show = src.length > 0 && failedSrc !== src
  return (
    <span
      aria-hidden
      className={cx(
        styles.cover,
        props.featured ? styles.coverFeature : styles.coverRow,
      )}
    >
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

function postTitle(post: PostModel, untitled: string) {
  const title = post.title.trim()
  return title || untitled
}

function PublishedPostLink(props: { featured?: boolean; post: PostModel }) {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const { post } = props
  const authors = (post.authors ?? []).filter((author) =>
    author.displayName.trim(),
  )
  const names = authors.map((author) => author.displayName.trim())
  const category = post.category?.name.trim() ?? ''
  const publishedAt = post.createdAt
  const when = publishedAt
    ? displayDeskTime(format.relativeTime(publishedAt))
    : ''
  const meta = [names.join(copy('authorSeparator')), category, when]
    .filter((part) => part.length > 0)
    .join(' · ')

  return (
    <Link
      className={styles.link}
      to={`/posts/edit?id=${encodeURIComponent(post.id)}`}
    >
      <PostCover featured={props.featured} src={post.image} />
      <span className={styles.copy}>
        {props.featured ? (
          <span className={styles.featureTitle}>
            {postTitle(post, copy('untitled'))}
          </span>
        ) : (
          <Text ellipsis={{ tooltipWhenOverflow: true }} weight={500}>
            {postTitle(post, copy('untitled'))}
          </Text>
        )}
        {authors.length || meta ? (
          <span className={styles.meta}>
            {authors.length ? (
              <span className={styles.avatars}>
                {authors.slice(0, 3).map((author) => (
                  <Avatar
                    alt={author.displayName}
                    avatar={
                      author.avatar ||
                      author.displayName.trim().slice(0, 1).toUpperCase()
                    }
                    key={author.id}
                    size={props.featured ? 22 : 16}
                  />
                ))}
              </span>
            ) : null}
            {meta ? (
              <Tooltip
                title={
                  publishedAt
                    ? new Date(publishedAt).toLocaleString()
                    : undefined
                }
              >
                <span className={styles.metaText}>{meta}</span>
              </Tooltip>
            ) : null}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

function CheckStatus(props: {
  done: number
  pending?: boolean
  state: 'done' | 'gap' | 'unset'
  total: number
}) {
  const copy = useDashboardCopy()
  if (props.pending) {
    return <span className={cx(styles.checkStatus, styles.checkMuted)}>--</span>
  }
  const tone =
    props.state === 'done'
      ? styles.checkOk
      : props.state === 'gap'
        ? styles.checkWarn
        : styles.checkMuted
  return (
    <span className={cx(styles.checkStatus, tone)}>
      <Icon
        icon={
          props.state === 'done'
            ? CircleCheck
            : props.state === 'gap'
              ? CircleDashed
              : Minus
        }
        size="small"
      />
      {props.state === 'unset'
        ? copy('checkUnset')
        : props.state === 'gap'
          ? copy('checkMissing', { count: props.total - props.done })
          : copy('checkDone')}
      {props.total > 1 ? (
        <span className={styles.checkProgress}>
          {copy('checkProgress', { done: props.done, total: props.total })}
        </span>
      ) : null}
    </span>
  )
}

const SEO_FIELD_LABEL = {
  description: 'checkSeoDescription',
  image: 'checkSeoCover',
  title: 'checkSeoTitle',
} as const

function SeoFieldStatus(props: { field: SeoFieldCheck }) {
  const copy = useDashboardCopy()
  const { field } = props
  const tone =
    field.state === 'ok'
      ? styles.checkOk
      : field.state === 'long'
        ? styles.checkWarn
        : styles.checkMuted
  const status = (
    <span className={cx(styles.checkStatus, tone)}>
      <Icon
        icon={
          field.state === 'ok'
            ? CircleCheck
            : field.state === 'long'
              ? CircleAlert
              : Minus
        }
        size="small"
      />
      {field.state === 'ok'
        ? copy('checkDone')
        : field.state === 'long'
          ? copy('checkSeoLong')
          : copy('checkSeoAbsent')}
    </span>
  )
  if (field.state !== 'long' || !field.limit) return status
  return (
    <Tooltip
      title={copy('checkProgress', { done: field.used, total: field.limit })}
    >
      {status}
    </Tooltip>
  )
}

function FeaturedPost(props: { onShare: () => void; post: PostModel }) {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const { post } = props
  const authors = (post.authors ?? []).filter((author) =>
    author.displayName.trim(),
  )
  const names = authors.map((author) => author.displayName.trim())
  const category = post.category?.name.trim() ?? ''
  const publishedAt = post.createdAt
  const when = publishedAt
    ? displayDeskTime(format.relativeTime(publishedAt))
    : ''
  const meta = [names.join(copy('authorSeparator')), category, when]
    .filter((part) => part.length > 0)
    .join(' · ')
  const editPath = `/posts/edit?id=${encodeURIComponent(post.id)}`

  const coverage = useQuery(translationCoverageQuery)
  const translation = postTranslationCheck(
    coverage.data?.find((row) => row.article.id === post.id)?.coverage
      .translation,
  )
  const seoChecks = postSeoChecks(post)

  return (
    <div className={styles.featureRow}>
      <div className={styles.feature}>
        <Link className={styles.featureCover} to={editPath}>
          <PostCover featured src={post.image} />
        </Link>
        <div className={styles.featureBody}>
          <Link className={styles.featureText} to={editPath}>
            <span className={styles.featureTitle}>
              {postTitle(post, copy('untitled'))}
            </span>
            {authors.length || meta ? (
              <span className={styles.meta}>
                {authors.length ? (
                  <span className={styles.avatars}>
                    {authors.slice(0, 3).map((author) => (
                      <Avatar
                        alt={author.displayName}
                        avatar={
                          author.avatar ||
                          author.displayName.trim().slice(0, 1).toUpperCase()
                        }
                        key={author.id}
                        size={22}
                      />
                    ))}
                  </span>
                ) : null}
                {meta ? <span className={styles.metaText}>{meta}</span> : null}
              </span>
            ) : null}
          </Link>
          <div className={styles.liveActions}>
            <LobeButton
              className={styles.shareButton}
              icon={Upload}
              onClick={props.onShare}
              shape="round"
              type="default"
            >
              {copy('share')}
            </LobeButton>
            <LobeButton
              icon={ExternalLink}
              onClick={() =>
                window.open(
                  postExternalHref(post),
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              type="text"
            >
              {copy('viewLive')}
            </LobeButton>
          </div>
        </div>
      </div>
      <div className={styles.checks}>
        <Link className={styles.check} to={editPath}>
          <span className={styles.checkLabel}>
            <Icon icon={Search} size="small" />
            {copy('checkSeo')}
          </span>
          <span className={styles.seoList}>
            {seoChecks.map((field) => (
              <span className={styles.seoField} key={field.key}>
                <span className={styles.seoName}>
                  {copy(SEO_FIELD_LABEL[field.key])}
                </span>
                <SeoFieldStatus field={field} />
              </span>
            ))}
          </span>
        </Link>
        <Link className={styles.check} to={aiOverviewArticlePath(post.id)}>
          <span className={styles.checkLabel}>
            <Icon icon={Languages} size="small" />
            {copy('checkTranslation')}
          </span>
          <CheckStatus
            done={translation.done}
            pending={coverage.isPending}
            state={translation.state}
            total={translation.total}
          />
        </Link>
      </div>
    </div>
  )
}

export function LatestPublished() {
  const copy = useDashboardCopy()
  const navigate = useNavigate()
  const query = useQuery(latestPublishedQuery)
  const latest = query.data?.[0]
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <Section title={copy('latestPublishedTitle')} variant="card">
      <DeskQueryState
        errorMessage={copy('latestPublishedError')}
        query={query}
        rows={1}
      >
        {latest ? (
          <>
            <FeaturedPost onShare={() => setShareOpen(true)} post={latest} />
            <SharePostModal
              onClose={() => setShareOpen(false)}
              open={shareOpen}
              post={latest}
            />
          </>
        ) : (
          <Empty
            action={
              <Button onClick={() => navigate(newPostPath)}>
                {copy('writePost')}
              </Button>
            }
            icon={FileText}
            title={copy('latestPublishedEmpty')}
          />
        )}
      </DeskQueryState>
    </Section>
  )
}

export function RecentPublished() {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const query = useQuery(latestPublishedQuery)
  const counts = useQuery(postCountsQuery)
  const posts = query.data ?? []
  const recent = posts.slice(1)
  const publishedTotal = counts.data?.published ?? 0

  return (
    <Section
      more={
        publishedTotal > posts.length
          ? copy('viewPosts', { count: format.number(publishedTotal) })
          : undefined
      }
      moreLink={publishedTotal > posts.length ? postsPath : undefined}
      title={copy('recentPublishedTitle')}
      variant="card"
    >
      <DeskQueryState
        errorMessage={copy('recentPublishedError')}
        query={query}
        rows={6}
      >
        {recent.length === 0 ? (
          <Empty icon={FileText} title={copy('recentPublishedEmpty')} />
        ) : (
          recent.map((post) => <PublishedPostLink key={post.id} post={post} />)
        )}
      </DeskQueryState>
    </Section>
  )
}
