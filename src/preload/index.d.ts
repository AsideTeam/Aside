/**
 * Preload TypeScript Definitions
 *
 * Renderer에서 window.electronAPI 타입 정의
 * src/types/global.d.ts와 연동
 */

export interface ElectronAPIApp {
  quit: () => Promise<{ success: boolean }>
  restart: () => Promise<{ success: boolean }>
  getState: () => Promise<{ success: boolean; state: AppState }>
}

export interface ElectronAPIWindow {
  minimize: () => Promise<{ success: boolean }>
  maximize: () => Promise<{ success: boolean }>
  close: () => Promise<{ success: boolean }>
}

export interface ElectronAPITab {
  create: (url: string) => Promise<{ success: boolean; tabId?: string }>
  close: (tabId: string) => Promise<{ success: boolean }>
  switch: (tabId: string) => Promise<{ success: boolean }>
  list: () => Promise<{ success: boolean; tabs?: TabInfo[] }>
  getActive: () => Promise<{ success: boolean; tabId?: string }>
}

export interface AppState {
  isTrayMode: boolean
  isWindowMinimized: boolean
  isWindowMaximized: boolean
  lastActiveTabId: string | null
}

export interface TabInfo {
  id: string
  url: string
  title: string
  isActive: boolean
}

export interface ElectronAPI {
  app: ElectronAPIApp
  window: ElectronAPIWindow
  tab: ElectronAPITab
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
