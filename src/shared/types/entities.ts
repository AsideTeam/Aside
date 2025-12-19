/**
 * Database Entity Types
 *
 * Prisma schema와 1:1 대응되는 타입들
 * Renderer에서 데이터를 받아서 조작할 때 사용
 */

export interface History {
  id: string
  url: string
  title?: string
  favicon?: string
  visitedAt: Date
}

export interface Bookmark {
  id: string
  url: string
  title?: string
  folder?: string
  createdAt: Date
}

export interface AppSetting {
  key: string
  value: string
  updatedAt: Date
}

export interface SessionTab {
  id: string
  url: string
  title?: string
  isActive: boolean
  position: number
}

/**
 * ===== COMBINED TYPES =====
 */

export interface TabInfo {
  id: string
  url: string
  title: string
  isActive: boolean
  canGoBack: boolean
  canGoForward: boolean
}

export interface NavigationState {
  currentUrl: string
  canGoBack: boolean
  canGoForward: boolean
}
