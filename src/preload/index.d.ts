/**
 * Preload TypeScript Definitions
 *
 * Renderer에서 window.electronAPI 타입 정의
 * src/types/global.d.ts와 연동
 */

export interface ElectronAPIApp {
  quit: () => Promise<{ success: boolean; error?: string }>
  restart: () => Promise<{ success: boolean; error?: string }>
  getState: () => Promise<{ success: boolean; state?: AppState; error?: string }>
}

export interface ElectronAPIWindow {
  minimize: () => Promise<{ success: boolean; error?: string }>
  maximize: () => Promise<{ success: boolean; error?: string }>
  close: () => Promise<{ success: boolean; error?: string }>
}

export interface ElectronAPITab {
  create: (url: string) => Promise<{ success: boolean; tabId?: string; error?: string }>
  close: (tabId: string) => Promise<{ success: boolean; error?: string }>
  switch: (tabId: string) => Promise<{ success: boolean; error?: string }>
  list: () => Promise<{ success: boolean; tabs?: TabInfo[]; error?: string }>
  getActive: () => Promise<{ success: boolean; tabId?: string; error?: string }>
  navigate: (url: string) => Promise<{ success: boolean; error?: string }>
  back: () => Promise<{ success: boolean; error?: string }>
  forward: () => Promise<{ success: boolean; error?: string }>
  reload: () => Promise<{ success: boolean; error?: string }>
}

export interface ElectronAPISettings {
  getSettings: () => Promise<Record<string, any>>
  updateSetting: (key: string, value: any) => Promise<boolean>
}

export interface ElectronAPIEvents {
  on: (channel: string, listener: (data: unknown) => void) => void
  off: (channel: string, listener: (data: unknown) => void) => void
  once: (channel: string, listener: (data: unknown) => void) => void
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
  settings: ElectronAPISettings
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
