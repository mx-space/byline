import type { SidebarNode } from 'virtual:admin-routes'

export function filterSidebarNode(node: SidebarNode): SidebarNode | null {
  if (node.route.path === '/debug' || node.route.path.startsWith('/debug/')) {
    return null
  }

  if (!node.children?.length) {
    return node
  }

  const children = node.children.flatMap((child) => {
    const visibleChild = filterSidebarNode(child)
    return visibleChild ? [visibleChild] : []
  })

  return {
    ...node,
    children,
  }
}
