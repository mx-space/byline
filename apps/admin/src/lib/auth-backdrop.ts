import type { CSSProperties } from 'react'

import { bgUrl } from '~/constants/env'

const AMBIENT_LAYERS = [
  'radial-gradient(60% 50% at 15% 8%, rgba(99, 102, 241, 0.28), transparent 70%)',
  'radial-gradient(55% 45% at 88% 92%, rgba(20, 184, 166, 0.2), transparent 70%)',
  'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
]

export const authBackdropStyle: CSSProperties = bgUrl
  ? {
      backgroundImage: `linear-gradient(rgba(10,10,10,.42), rgba(10,10,10,.58)), url(${bgUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }
  : {
      backgroundImage: AMBIENT_LAYERS.join(', '),
      backgroundSize: '100% 100%, 100% 100%, 24px 24px',
    }
