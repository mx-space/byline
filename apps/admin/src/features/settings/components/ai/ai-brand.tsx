import { ModelIcon, ProviderIcon } from '@lobehub/icons'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { findAIProviderPreset } from '../../config/aiProviderPresets'
import type { AIProviderConfig } from '../../types/settings'

const PRESET_ICON: Record<string, string> = {
  googleVertex: 'vertexai',
  siliconflow: 'siliconcloud',
}

const AVATAR_SIZE = 20

const styles = stylex.create({
  avatar: {
    display: 'inline-flex',
    flexGrow: 0,
    flexShrink: 0,
  },
  id: {
    color: cssVar.colorTextTertiary,
    fontSize: cssVar.fontSizeSM,
    marginInlineStart: 8,
  },
  name: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  option: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    minWidth: 0,
  },
  pricing: {
    color: cssVar.colorTextSecondary,
    flexGrow: 0,
    flexShrink: 0,
    fontSize: cssVar.fontSizeSM,
    fontVariantNumeric: 'tabular-nums',
  },
})

export function providerIconKey(
  source: Pick<AIProviderConfig, 'endpoint' | 'name' | 'type'> | string,
) {
  if (typeof source !== 'string') {
    const presetId = findAIProviderPreset(source)?.id
    if (presetId && presetId !== 'custom') {
      return PRESET_ICON[presetId] ?? presetId
    }
    return source.name.trim() || undefined
  }
  if (!source || source === 'custom') return undefined
  return PRESET_ICON[source] ?? source
}

export function AIProviderAvatar(props: {
  provider: Pick<AIProviderConfig, 'endpoint' | 'name' | 'type'> | string
}) {
  return (
    <span aria-hidden {...stylex.props(styles.avatar)}>
      <ProviderIcon
        provider={providerIconKey(props.provider)}
        size={AVATAR_SIZE}
        type="avatar"
      />
    </span>
  )
}

export function AIModelAvatar(props: { model?: string }) {
  return (
    <span aria-hidden {...stylex.props(styles.avatar)}>
      <ModelIcon model={props.model} size={AVATAR_SIZE} type="avatar" />
    </span>
  )
}

export function AIProviderOptionLabel(props: {
  children: ReactNode
  provider: Pick<AIProviderConfig, 'endpoint' | 'name' | 'type'>
}) {
  return (
    <span {...stylex.props(styles.option)}>
      <AIProviderAvatar provider={props.provider} />
      <span {...stylex.props(styles.name)}>{props.children}</span>
    </span>
  )
}

export function AIModelOptionLabel(props: {
  id: string
  name?: string
  pricing?: ReactNode
}) {
  const name = props.name || props.id
  return (
    <span {...stylex.props(styles.option)}>
      <AIModelAvatar model={props.id} />
      <span {...stylex.props(styles.name)}>
        <span>{name}</span>
        {name !== props.id ? (
          <span {...stylex.props(styles.id)}>{props.id}</span>
        ) : null}
      </span>
      {props.pricing ? (
        <span {...stylex.props(styles.pricing)}>{props.pricing}</span>
      ) : null}
    </span>
  )
}
