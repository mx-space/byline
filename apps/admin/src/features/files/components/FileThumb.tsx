import { Center, createStaticStyles, cx, FileTypeIcon } from '@lobehub/ui'

import { extensionOf, fileKindOf } from '../utils/file-kind'

const styles = createStaticStyles(({ css, cssVar }) => ({
  fill: css`
    width: 100%;
    height: 100%;
  `,
  image: css`
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  `,
  root: css`
    overflow: hidden;
    flex: none;
    border-radius: ${cssVar.borderRadius};
    background: ${cssVar.colorFillTertiary};
  `,
}))

export function FileThumb(props: {
  className?: string
  fill?: boolean
  iconSize?: number
  mime?: null | string
  name: string
  size?: number
  url: string
}) {
  const image = fileKindOf(props.name, props.mime) === 'image'
  const dimension = props.fill ? undefined : (props.size ?? 40)

  return (
    <Center
      className={cx(styles.root, props.fill && styles.fill, props.className)}
      style={dimension ? { height: dimension, width: dimension } : undefined}
    >
      {image ? (
        <img
          alt=""
          className={styles.image}
          decoding="async"
          loading="lazy"
          src={props.url}
        />
      ) : (
        <FileTypeIcon
          filetype={extensionOf(props.name)}
          size={props.iconSize ?? Math.round((dimension ?? 96) * 0.55)}
        />
      )}
    </Center>
  )
}
