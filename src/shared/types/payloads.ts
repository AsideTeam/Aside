/**
 * Main ↔ Renderer 통신 IPC Payloads
 */

// Request Payloads
export interface IPC_TAB_CREATE {
  url: string
  title?: string
}

export interface IPC_TAB_SWITCH {
  tabId: string
}

export interface IPC_TAB_UPDATE_URL {
  tabId: string
  url: string
}

export interface IPC_NAV_NAVIGATE {
  url: string
}

export interface IPC_SIDEBAR_TOGGLE {
  expanded: boolean
}

// Response Payloads (모두 Result<T> 형태)
export interface IPC_Result<T> {
  success: boolean
  data?: T
  error?: string
}

export interface IPC_TAB_CREATE_RESPONSE {
  tabId: string
}
