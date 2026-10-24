import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import { media } from '@lobehub/ui/stylex/media.stylex'
import * as stylex from '@stylexjs/stylex'
import { describe, expect, it } from 'vitest'

const styles = stylex.create({
  title: {
    color: cssVar.colorText,
    fontSize: { default: 16, [media.sm]: 14 },
  },
})

describe('@lobehub/ui StyleX tokens', () => {
  it('compiles theme tokens and media queries into class names', () => {
    expect(stylex.props(styles.title).className).toMatch(/\S/)
  })
})
