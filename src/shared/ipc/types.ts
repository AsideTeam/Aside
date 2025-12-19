/**
 * IPC Payload Types (요청/응답 데이터 구조)
 *
 * Main ↔ Renderer 사이의 데이터 형식 정의
 * 이 파일이 "API 명세서"가 됨
 */

/**
 * Generic Response Wrapper
 * 모든 IPC 응답은 이 형태를 따름
 */
export interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * ===== TAB OPERATIONS =====
 */

export interface TabCreateRequest {
  url: string
  title?: string
  active?: boolean
}

export interface TabCreateResponse {
  tabId: string
  url: string
  title: string
}

export interface TabSwitchRequest {
  tabId: string
}

export interface TabCloseRequest {
  tabId: string
}

export interface TabUpdateUrlRequest {
  tabId: string
  url: string
}

/**
 * ===== NAVIGATION =====
 */

export interface NavNavigateRequest {
  url: string
}

export interface NavStateChangedEvent {
  canGoBack: boolean
  canGoForward: boolean
  currentUrl: string
}

/**
 * ===== SIDEBAR =====
 */

export interface SidebarToggleRequest {
  expanded: boolean
}

/**
 * ===== WINDOW =====
 */

export interface WindowMinimizeRequest {
  // No payload needed
}

export interface WindowMaximizeRequest {
  // No payload needed
}

export interface WindowCloseRequest {
  // No payload needed
}

/**
 * ===== EVENTS (Renderer → Main 이벤트 리슨) =====
 */

export interface TabsUpdatedEvent {
  tabs: Array<{
    id: string
    url: string
    title: string
    isActive: boolean
  }>
}
