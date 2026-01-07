/**
 * IPC Payloads - Request/Response 데이터 타입 정의
 *
 * 책임: Main ↔ Renderer 간 통신 데이터 구조만 정의
 * - 구현 로직은 여기에 없음
 * - 각 채널의 요청/응답 형식을 명시적으로 정의
 *
 * 구조화:
 * - 각 채널별 Request/Response 타입 분리
 * - 공통 Response Wrapper (IpcResponse<T>) 사용
 * - 명확한 네이밍 (OperationRequest, OperationResponse)
 *
 * 사용 예:
 *   import { IPC_CHANNELS } from '@shared/ipc/channels';
 *   import type { TabCreateRequest, TabCreateResponse } from '@shared/ipc/payloads';
 *
 *   // Main에서 핸들러 등록
 *   ipcMain.handle(IPC_CHANNELS.TAB.CREATE, (_, payload: TabCreateRequest) => {
 *     // ...
 *     const response: TabCreateResponse = { tabId, url, title };
 *     return { success: true, data: response };
 *   });
 */

/**
 * ===== COMMON TYPES =====
 */

/**
 * 모든 IPC 응답의 기본 형식
 *
 * Main → Renderer로 항상 이 형식을 따름
 * 성공/실패 여부와 데이터/에러 메시지를 포함
 *
 * @template T - 응답 데이터의 타입 (기본값: void)
 *
 * 예:
 *   // 성공 응답
 *   { success: true, data: { tabId: '123' } }
 *
 *   // 실패 응답
 *   { success: false, error: 'No active tab' }
 */
export interface IpcResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * ===== TAB CHANNEL PAYLOADS =====
 */

/**
 * 채널: IPC_CHANNELS.TAB.CREATE
 * 방향: Renderer → Main
 * 설명: 새 탭 생성 요청
 *
 * @param url - 로드할 URL (필수)
 * @param title - 탭 제목 (선택, 기본값: "New Tab")
 * @param active - 활성화 여부 (선택, 기본값: true)
 *
 * 예:
 *   { url: "https://google.com", title: "Google", active: true }
 */
export interface TabCreateRequest {
  url: string
  title?: string
  active?: boolean
}

/**
 * 채널: IPC_CHANNELS.TAB.CREATE (응답)
 * 방향: Main → Renderer
 * 설명: 새 탭 생성 결과
 *
 * @param tabId - 생성된 탭의 고유 ID (UUID)
 * @param url - 탭이 로드한 URL
 * @param title - 탭의 제목
 *
 * 예:
 *   { tabId: "f47ac10b-58cc-4372-a567-0e02b2c3d479", url: "https://google.com", title: "Google" }
 */
export interface TabCreateResponse {
  tabId: string
  url: string
  title: string
}

/**
 * 채널: IPC_CHANNELS.TAB.SWITCH
 * 방향: Renderer → Main
 * 설명: 활성 탭 전환 요청
 *
 * @param tabId - 전환할 탭의 ID
 */
export interface TabSwitchRequest {
  tabId: string
}

/**
 * 채널: IPC_CHANNELS.TAB.CLOSE
 * 방향: Renderer → Main
 * 설명: 탭 종료 요청
 *
 * @param tabId - 종료할 탭의 ID
 */
export interface TabCloseRequest {
  tabId: string
}

/**
 * 채널: IPC_CHANNELS.TAB.UPDATE_URL
 * 방향: Renderer → Main
 * 설명: 활성 탭의 URL 변경 요청
 *
 * @param url - 로드할 새로운 URL
 */
export interface TabUpdateUrlRequest {
  url: string
}

/**
 * 채널: IPC_CHANNELS.TAB.UPDATED (Event)
 * 방향: Main → Renderer (단방향)
 * 설명: 탭 목록이 변경되었음을 알림
 *
 * 탭이 추가/삭제/전환될 때 Main에서 Renderer로 발생
 *
 * @param tabs - 현재 탭 목록
 */
export interface TabsUpdatedEvent {
  tabs: Array<{
    id: string
    url: string
    title: string
    isActive: boolean
  }>
}

/**
 * ===== NAVIGATION CHANNEL PAYLOADS =====
 */

/**
 * 채널: IPC_CHANNELS.NAV.NAVIGATE
 * 방향: Renderer → Main
 * 설명: URL로 이동 요청
 *
 * @param url - 로드할 URL
 *
 * 예:
 *   { url: "https://github.com" }
 */
export interface NavNavigateRequest {
  url: string
}

/**
 * 채널: IPC_CHANNELS.NAV.STATE_CHANGED (Event)
 * 방향: Main → Renderer (단방향)
 * 설명: 네비게이션 상태 변경 (뒤로/앞으로 가기 가능 여부)
 *
 * 페이지가 로드되거나 히스토리가 변경될 때 발생
 *
 * @param canGoBack - 뒤로 가기 가능 여부
 * @param canGoForward - 앞으로 가기 가능 여부
 * @param currentUrl - 현재 URL
 *
 * 예:
 *   { canGoBack: true, canGoForward: false, currentUrl: "https://google.com" }
 */
export interface NavStateChangedEvent {
  canGoBack: boolean
  canGoForward: boolean
  currentUrl: string
}

/**
 * ===== SIDEBAR CHANNEL PAYLOADS =====
 */

/**
 * 채널: IPC_CHANNELS.SIDEBAR.TOGGLE
 * 방향: Renderer → Main
 * 설명: 사이드바 확장/축소 요청
 *
 * @param expanded - true면 확장, false면 축소
 *
 * 예:
 *   { expanded: true }
 */
export interface SidebarToggleRequest {
  expanded: boolean
}

/**
 * ===== WINDOW CHANNEL PAYLOADS =====
 */

/**
 * 채널: IPC_CHANNELS.WINDOW.MINIMIZE
 * 방향: Renderer → Main
 * 설명: 윈도우 최소화 요청
 *
 * 페이로드 없음 (빈 객체도 보낼 필요 없음)
 */
export type WindowMinimizeRequest = Record<string, never>

/**
 * 채널: IPC_CHANNELS.WINDOW.MAXIMIZE
 * 방향: Renderer → Main
 * 설명: 윈도우 최대화/복원 토글 요청
 *
 * 페이로드 없음
 */
export type WindowMaximizeRequest = Record<string, never>

/**
 * 채널: IPC_CHANNELS.WINDOW.CLOSE
 * 방향: Renderer → Main
 * 설명: 윈도우 종료 요청
 *
 * 페이로드 없음
 */
export type WindowCloseRequest = Record<string, never>

/**
 * 채널: IPC_CHANNELS.TAB.MOVE_SECTION
 * 방향: Renderer → Main
 * 설명: 탭을 다른 섹션(Icon/Space/Tab)으로 이동
 *
 * @param tabId - 이동할 탭의 ID
 * @param targetType - 목표 섹션 ('icon' | 'space' | 'tab')
 *
 * 예:
 *   { tabId: "tab-123", targetType: "space" }
 */
export interface TabMoveSectionRequest {
  tabId: string
  targetType: 'icon' | 'space' | 'tab'
}

/**
 * 채널: IPC_CHANNELS.TAB.REORDER
 * 방향: Renderer → Main
 * 설명: 같은 섹션 내에서 탭의 위치 변경
 *
 * @param tabId - 이동할 탭의 ID
 * @param position - 새로운 위치 (0부터 시작)
 *
 * 예:
 *   { tabId: "tab-123", position: 2 }
 */
export interface TabReorderRequest {
  tabId: string
  position: number
}

/**
 * 채널: IPC_CHANNELS.TAB.REORDER_ICON
 * 방향: Renderer → Main
 * 설명: Icon 섹션의 고정 앱 순서 변경
 *
 * @param fromIndex - 원본 인덱스
 * @param toIndex - 목표 인덱스
 *
 * 예:
 *   { fromIndex: 0, toIndex: 2 }
 */
export interface TabReorderIconRequest {
  fromIndex: number
  toIndex: number
}

