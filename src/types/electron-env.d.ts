/**
 * Electron Environment Definitions
 *
 * Renderer Process에서 Electron IPC 타입 정의
 * - Main Process 상수 공유
 * - IPC 채널 정의
 * - 요청/응답 페이로드 타입
 */

// ===== App State Types =====
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

// ===== IPC Response Types =====
export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface AppQuitResponse extends IPCResponse {
  success: boolean
}

export interface AppRestartResponse extends IPCResponse {
  success: boolean
}

export interface AppStateResponse extends IPCResponse {
  success: boolean
  data: AppState
}

export interface WindowActionResponse extends IPCResponse {
  success: boolean
}

export interface TabCreateResponse extends IPCResponse {
  success: boolean
  data?: {
    tabId: string
  }
}

export interface TabListResponse extends IPCResponse {
  success: boolean
  data: TabInfo[]
}

// ===== IPC Channels (Discriminated Union) =====
export type IPCChannel =
  | { channel: 'app:quit' }
  | { channel: 'app:restart' }
  | { channel: 'app:state' }
  | { channel: 'window:minimize' }
  | { channel: 'window:maximize' }
  | { channel: 'window:close' }
  | { channel: 'tab:create'; data: { url: string } }
  | { channel: 'tab:close'; data: { tabId: string } }
  | { channel: 'tab:switch'; data: { tabId: string } }
  | { channel: 'tab:list' }
  | { channel: 'tab:active' }

// ===== Main ElectronAPI Type =====
export interface ElectronAPI {
  app: {
    quit: () => Promise<AppQuitResponse>
    restart: () => Promise<AppRestartResponse>
    getState: () => Promise<AppStateResponse>
  }
  window: {
    minimize: () => Promise<WindowActionResponse>
    maximize: () => Promise<WindowActionResponse>
    close: () => Promise<WindowActionResponse>
  }
  tab: {
    create: (_url: string) => Promise<TabCreateResponse>
    close: (_tabId: string) => Promise<IPCResponse>
    switch: (_tabId: string) => Promise<IPCResponse>
    list: () => Promise<TabListResponse>
    getActive: () => Promise<IPCResponse>
  }
  invoke: (_channel: string, ..._args: unknown[]) => Promise<unknown>
}
