import type { CSSProperties } from 'react'

import { bgUrl } from '~/constants/env'

const AMBIENT_LAYERS = [
  'radial-gradient(65% 55% at 12% 6%, rgba(41, 167, 245, 0.42), transparent 70%)',
  'radial-gradient(60% 50% at 90% 95%, rgba(37, 99, 235, 0.34), transparent 70%)',
  'radial-gradient(rgba(186, 230, 253, 0.08) 1px, transparent 1px)',
]

export const authBackdropStyle: CSSProperties = bgUrl
  ? {
      backgroundImage: `linear-gradient(rgba(10,10,10,.42), rgba(10,10,10,.58)), url(${bgUrl})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }
  : {
      backgroundColor: '#06111f',
      backgroundImage: AMBIENT_LAYERS.join(', '),
      backgroundSize: '100% 100%, 100% 100%, 24px 24px',
    }
