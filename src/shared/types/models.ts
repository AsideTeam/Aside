// Prisma 모델의 타입
export interface HistoryEntry {
  id: string
  url: string
  title: string
  favicon?: string
  timestamp: Date
}

export interface BookmarkItem {
  id: string
  url: string
  title: string
  favicon?: string
  folder: string
  createdAt: Date
}

export interface TabInfo {
  id: string
  title: string
  url: string
  favicon?: string
  position?: number
  isActive: boolean
  createdAt?: Date
}

export interface TabModel extends TabInfo {
  position: number
  createdAt: Date
}

export interface NavigationState {
  canGoBack: boolean
  canGoForward: boolean
  currentUrl: string
}

export interface AppSetting {
  key: string
  value: string
  updatedAt: Date
}
