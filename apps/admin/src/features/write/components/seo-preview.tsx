// lobe-design-ignore-file LOBE-RAW-COLOR: 搜索结果和链接卡片要还原 Google 与 X 的固定品牌色，不能跟随后台主题
import { createStaticStyles, Image } from '@lobehub/ui'

import { WEB_URL } from '~/constants/env'

const styles = createStaticStyles(({ css, cssVar }) => ({
  block: css`
    display: flex;
    flex-direction: column;
    gap: 6px;

    width: 100%;
    min-width: 0;
  `,
  card: css`
    overflow: hidden;

    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    border: 1px solid #2f3336;
    border-radius: 16px;

    background: #000;
  `,
  cardBody: css`
    display: flex;
    flex-direction: column;
    gap: 2px;

    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 12px;
  `,
  cardDomain: css`
    overflow: hidden;

    min-width: 0;
    max-width: 100%;

    font-size: 13px;
    line-height: 16px;
    color: #71767b;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  cardText: css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;

    min-width: 0;
    max-width: 100%;

    font-size: 15px;
    line-height: 20px;
    color: #71767b;
    overflow-wrap: break-word;
  `,
  cardTitle: css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;

    min-width: 0;
    max-width: 100%;

    font-size: 15px;
    font-weight: 700;
    line-height: 20px;
    color: #e7e9ea;
    overflow-wrap: break-word;
  `,
  google: css`
    display: flex;
    flex-direction: column;
    gap: 2px;

    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 12px 16px;
    border-radius: 12px;

    background: #fff;
  `,
  googleSite: css`
    display: flex;
    gap: 8px;
    align-items: center;

    min-width: 0;
    max-width: 100%;
  `,
  googleMark: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 26px;
    height: 26px;
    border-radius: 50%;

    font-size: 15px;
    line-height: 1;
    color: #5f6368;

    background: #f1f3f4;
  `,
  googleSiteName: css`
    overflow: hidden;

    min-width: 0;

    font-size: 15px;
    line-height: 20px;
    color: #202124;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  googleUrl: css`
    overflow: hidden;

    min-width: 0;
    max-width: 100%;

    font-size: 13px;
    line-height: 18px;
    color: #4d5156;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  googleTitle: css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;

    min-width: 0;
    max-width: 100%;

    font-size: 20px;
    font-weight: 400;
    line-height: 26px;
    color: #1a0dab;
    overflow-wrap: break-word;
  `,
  googleText: css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;

    min-width: 0;
    max-width: 100%;

    font-size: 15px;
    line-height: 22px;
    color: #4d5156;
    overflow-wrap: break-word;
  `,
  label: css`
    font-size: ${cssVar.fontSize};
    line-height: ${cssVar.lineHeight};
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  media: css`
    width: 100%;
    aspect-ratio: 1.91 / 1;
    overflow: hidden;

    background: #16181c;

    & img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 16px;

    width: 100%;
    min-width: 0;
  `,
}))

function previewLocation(path: string) {
  const raw = path.trim()
  if (!raw) return { crumbs: '', site: '' }
  const absolute = /^https?:\/\//i.test(raw)
    ? raw
    : `${WEB_URL.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
  try {
    const url = new URL(absolute)
    const site = url.host.replace(/^www\./, '')
    const parts = url.pathname.split('/').filter(Boolean)
    return { crumbs: [site, ...parts].join(' › '), site }
  } catch {
    return { crumbs: raw, site: raw }
  }
}

export function SeoPreviews(props: {
  cardLabel: string
  description: string
  image?: string
  path?: string
  searchLabel: string
  title: string
}) {
  const location = previewLocation(props.path ?? '')
  const mark = (location.site || props.title || '?').slice(0, 1).toUpperCase()

  return (
    <div className={styles.stack}>
      <div className={styles.block}>
        <span className={styles.label}>{props.searchLabel}</span>
        <div className={styles.google}>
          <div className={styles.googleSite}>
            <span aria-hidden className={styles.googleMark}>
              {mark}
            </span>
            <span className={styles.googleSiteName}>
              {location.site || props.title}
            </span>
          </div>
          {location.crumbs ? (
            <span className={styles.googleUrl}>{location.crumbs}</span>
          ) : null}
          <span className={styles.googleTitle}>{props.title}</span>
          <span className={styles.googleText}>{props.description}</span>
        </div>
      </div>
      <div className={styles.block}>
        <span className={styles.label}>{props.cardLabel}</span>
        <div className={styles.card}>
          {props.image ? (
            <div className={styles.media}>
              <Image
                alt=""
                height="100%"
                objectFit="cover"
                preview={false}
                src={props.image}
                variant="borderless"
                width="100%"
              />
            </div>
          ) : null}
          <div className={styles.cardBody}>
            {location.site ? (
              <span className={styles.cardDomain}>{location.site}</span>
            ) : null}
            <span className={styles.cardTitle}>{props.title}</span>
            <span className={styles.cardText}>{props.description}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
