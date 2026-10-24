import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'

export const styles = stylex.create({
  caption: {
    color: cssVar.colorTextTertiary,
    fontSize: 11,
    lineHeight: '14px',
    whiteSpace: 'nowrap',
  },
  logo: {
    flex: 'none',
    lineHeight: 1,
  },
})
