export type SidebarSection = 'icon' | 'space' | 'tab'

export type SidebarTabItem = {
  id: string
  title?: string
  favicon?: string
  url: string
  isPinned?: boolean
  isFavorite?: boolean
}
