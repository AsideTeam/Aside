/**
 * Preload TypeScript Definitions
 *
 * Renderer에서 window.electronAPI 타입 정의
 * src/types/global.d.ts와 연동
 */

export interface IpcResponse<T = {}> {
  success: boolean
  error?: string
  data?: T
}

export interface ElectronAPIApp {
  quit: () => Promise<IpcResponse>
  restart: () => Promise<IpcResponse>
  getState: () => Promise<IpcResponse<{ state: AppState }>>
}

export interface ElectronAPIWindow {
  minimize: () => Promise<IpcResponse>
  maximize: () => Promise<IpcResponse>
  close: () => Promise<IpcResponse>
}

export interface ElectronAPITab {
  create: (url: string) => Promise<IpcResponse<{ tabId: string }>>
  close: (tabId: string) => Promise<IpcResponse>
  switch: (tabId: string) => Promise<IpcResponse>
  list: () => Promise<IpcResponse<{ tabs: TabInfo[] }>>
  getActive: () => Promise<IpcResponse<{ tabId: string }>>
}

export interface ElectronAPIDevTools {
  open: () => Promise<void>
  close: () => Promise<void>
}

export interface ElectronAPIEvents {
  on: (channel: string, listener: (data: any) => void) => void
  off: (channel: string, listener: (data: any) => void) => void
  once: (channel: string, listener: (data: any) => void) => void
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

export interface ElectronAPI extends ElectronAPIEvents {
  app: ElectronAPIApp
  window: ElectronAPIWindow
  tab: ElectronAPITab
  devtools: ElectronAPIDevTools
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
