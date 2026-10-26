import * as stylex from '@stylexjs/stylex'
import { LogIn } from 'lucide-react'
import { useState } from 'react'

const styles = stylex.create({
  icon: { display: 'block', objectFit: 'contain', flexShrink: 0 },
})

export function OauthProviderIcon({
  src,
  size = 24,
}: {
  src?: string
  size?: number
}) {
  const [failedSrc, setFailedSrc] = useState<string>()
  return src && failedSrc !== src ? (
    <img
      {...stylex.props(styles.icon)}
      alt=""
      aria-hidden
      height={size}
      onError={() => setFailedSrc(src)}
      src={src}
      width={size}
    />
  ) : (
    <LogIn aria-hidden size={size} />
  )
}
