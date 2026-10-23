import { ConfigProvider } from '@lobehub/ui'
import * as motion from 'motion/react-m'
import { createElement, type ReactNode } from 'react'

import { I18nProvider } from '~/i18n'

export function withUi(node: ReactNode) {
  return createElement(ConfigProvider, {
    children: createElement(I18nProvider, null, node),
    motion,
  })
}
