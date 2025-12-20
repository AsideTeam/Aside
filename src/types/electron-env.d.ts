/* eslint-disable no-unused-vars */
export interface ElectronAPI {
  // 탭 관리
  createTab: (url: string) => Promise<string>
  closeTab: (tabId: string) => Promise<void>
  switchTab: (tabId: string) => Promise<void>
  updateTabUrl: (tabId: string, url: string) => Promise<void>
  
  // 네비게이션
  navigate: (url: string) => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  
  // 사이드바
  toggleSidebar: (expanded: boolean) => Promise<void>
  
  // 리스너
  onTabsUpdated: (callback: (tabs: TabInfo[]) => void) => void
  onNavStateChanged: (callback: (state: NavigationState) => void) => void
}

export interface TabInfo {
  id: string
  title: string
  url: string
  favicon?: string
  isActive: boolean
}

export interface NavigationState {
  canGoBack: boolean
  canGoForward: boolean
  currentUrl: string
}
