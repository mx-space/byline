import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'

import { useI18n } from '~/i18n'

import type { RemotePresence } from '../../crdt/collab-presence'
import { type PeersSource, usePeers } from '../../crdt/peers-store'

const VISIBLE = 4

const styles = stylex.create({
  group: {
    display: 'flex',
    alignItems: 'center',
  },
  overlap: {
    marginLeft: '-0.5rem',
  },
  avatar: {
    position: 'relative',
    display: 'inline-flex',
    width: '1.5rem',
    height: '1.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderRadius: 9999,
    backgroundColor: cssVar.colorFillTertiary,
    boxShadow: `0 0 0 2px ${cssVar.colorBgContainer}`,
    color: cssVar.colorText,
    fontSize: cssVar.fontSizeSM,
    fontWeight: 500,
    transitionProperty: 'transform',
    transitionDuration: '150ms',
    transform: {
      default: null,
      ':hover': 'translateY(-2px)',
    },
  },
  peer: (color: string, zIndex: number) => ({
    borderColor: color,
    zIndex: {
      default: zIndex,
      ':hover': 10,
    },
  }),
  more: {
    position: 'relative',
    display: 'inline-flex',
    width: '1.5rem',
    height: '1.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: cssVar.colorFillTertiary,
    boxShadow: `0 0 0 2px ${cssVar.colorBgContainer}`,
    color: cssVar.colorTextSecondary,
    fontSize: cssVar.fontSizeSM,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
})

const onePerPerson = (peers: RemotePresence[]) => {
  const seen = new Set<string>()
  return peers.filter((peer) => {
    if (seen.has(peer.user.id)) return false
    seen.add(peer.user.id)
    return true
  })
}

export function PeerAvatars(props: { peers: PeersSource; selfId: string }) {
  const { t } = useI18n()
  const people = onePerPerson(usePeers(props.peers))
  if (!people.length) return null
  const visible = people.slice(0, VISIBLE)
  const hidden = people.length - visible.length

  return (
    <div
      aria-label={t('write.collab.editing')}
      role="group"
      {...stylex.props(styles.group)}
    >
      {visible.map((peer, index) => {
        const name = peer.user.name || '?'
        const title =
          peer.user.id === props.selfId
            ? t('write.collab.peerOtherTab', { name })
            : name
        return (
          <span
            data-peer={peer.key}
            key={peer.key}
            title={title}
            {...stylex.props(
              styles.avatar,
              index > 0 && styles.overlap,
              styles.peer(peer.color, visible.length - index),
            )}
          >
            <PeerFace avatar={peer.user.avatar} name={name} />
          </span>
        )
      })}
      {hidden > 0 ? (
        <span
          title={t('write.collab.more', { count: hidden })}
          {...stylex.props(styles.more, styles.overlap)}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  )
}

function PeerFace(props: { avatar: string | null; name: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  if (!props.avatar || failed === props.avatar) {
    return <>{props.name.slice(0, 1).toUpperCase()}</>
  }
  return (
    <img
      alt=""
      onError={() => setFailed(props.avatar)}
      src={props.avatar}
      {...stylex.props(styles.image)}
    />
  )
}
