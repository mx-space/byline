// Ported from lobe-chat src/styles/sx.ts.
import type {
  CompiledStyles,
  InlineStyles,
  StyleXArray,
} from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import type { CSSProperties } from 'react'

type SxStyles = StyleXArray<
  | CompiledStyles
  | boolean
  | null
  | undefined
  | Readonly<[CompiledStyles, InlineStyles]>
>

// StyleX rules carry raised specificity, so a caller's plain className cannot
// override them; it is appended only to reach descendants or lobe-ui layers.
export const sx = (
  styles: SxStyles,
  className?: string,
  style?: CSSProperties,
) => {
  const props = stylex.props(styles)
  const mergedClassName = [props.className, className].filter(Boolean).join(' ')
  return {
    className: mergedClassName || undefined,
    style: props.style || style ? { ...props.style, ...style } : undefined,
  }
}
