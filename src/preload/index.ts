import { contextBridge, ipcRenderer } from 'electron'
import type { TabInfo, NavigationState } from '@shared/types/models'

/**
 * Preload Script: Main ↔ Renderer 안전한 통신 브리지
 */

const electronAPI = {
  // Tab 관련
  createTab: (url: string) => ipcRenderer.invoke('tab:create', url),
  closeTab: (tabId: string) => ipcRenderer.invoke('tab:close', tabId),
  switchTab: (tabId: string) => ipcRenderer.invoke('tab:switch', tabId),
  updateTabUrl: (tabId: string, url: string) =>
    ipcRenderer.invoke('tab:update-url', { tabId, url }),

  // Navigation
  navigate: (url: string) => ipcRenderer.invoke('nav:navigate', url),
  goBack: () => ipcRenderer.invoke('nav:back'),
  goForward: () => ipcRenderer.invoke('nav:forward'),
  reload: () => ipcRenderer.invoke('nav:reload'),

  // Sidebar
  toggleSidebar: (expanded: boolean) =>
    ipcRenderer.invoke('sidebar:toggle', expanded),

  // Listeners
  onTabsUpdated: (callback: (tabs: TabInfo[]) => void) => {
    ipcRenderer.on('tabs:updated', (_event, tabs) => callback(tabs))
  },
  onNavStateChanged: (callback: (state: NavigationState) => void) => {
    ipcRenderer.on('nav:state-changed', (_event, state) => callback(state))
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
