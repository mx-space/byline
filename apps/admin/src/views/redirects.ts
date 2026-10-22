import type { RedirectEntry } from 'virtual:admin-routes'

import { LegacyTaskDetailRedirect } from '~/lib/legacy-redirects'

const redirects: RedirectEntry[] = [
  { from: '/posts/view', to: '/posts' },
  { from: '/files/list', to: '/files' },
  { from: '/ai', to: '/ai/overview' },
  { from: '/ai/tasks', to: '/tasks' },
  { from: '/ai/tasks/:id', element: LegacyTaskDetailRedirect },
]

export default redirects
