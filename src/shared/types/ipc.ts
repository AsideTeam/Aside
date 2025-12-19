export interface IPCRequest {
  type: string
  payload?: unknown
}

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Tab 관련 페이로드
export interface CreateTabPayload {
  url: string
}

export interface SwitchTabPayload {
  tabId: string
}

export interface UpdateTabUrlPayload {
  tabId: string
  url: string
}

// Navigation 관련 페이로드
export interface NavigatePayload {
  url: string
}

export interface SidebarTogglePayload {
  expanded: boolean
}
