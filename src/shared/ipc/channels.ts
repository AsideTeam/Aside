/**
 * IPC Channel Names - Main ↔ Renderer 통신 채널 정의
 *
 * 책임: IPC 채널 상수만 정의 (오타 방지, 타입 안전성)
 * - 구현 로직은 여기에 없음
 * - 각 채널의 요청/응답 타입은 payloads.ts에서 정의
 *
 * 구조화:
 * - 네임스페이스로 그룹핑 (APP, WINDOW, TAB, NAV, SIDEBAR)
 * - 각 채널 간 이름 중복 방지 (채널명 + 의도가 명확)
 * - `as const`로 리터럴 타입 보장
 *
 * 사용 예:
 *   import { IPC_CHANNELS } from '@shared/ipc';
 *   ipcMain.handle(IPC_CHANNELS.TAB.CREATE, handler);
 */

/**
 * IPC 채널 상수
 *
 * 네이밍 규칙: 도메인:작업
 * - tab:create (탭 생성)
 * - nav:navigate (URL로 이동)
 * - sidebar:toggle (사이드바 토글)
 *
 * Event 채널 (Main → Renderer 단방향):
 * - tabs:updated (탭 목록이 바뀜)
 * - nav:state-changed (앞/뒤로 가기 가능 상태 변경)
 *
 * Request/Response 채널 (양방향):
 * - tab:create → request에 URL, response에 tabId
 * - nav:navigate → request에 URL, response에 성공/실패
 */
export const IPC_CHANNELS = {
  // ===== APP 영역 =====
  APP: {
    /** 앱이 준비됨 (모든 초기화 완료) */
    READY: 'app:ready',
    /** 앱 종료 요청 */
    QUIT: 'app:quit',
    /** 앱 재시작 요청 */
    RESTART: 'app:restart',
    /** 앱 상태 조회 */
    STATE: 'app:state',
  },

  // ===== WINDOW 영역 (Renderer에서 Main으로 요청) =====
  WINDOW: {
    /** 윈도우 최소화 */
    MINIMIZE: 'window:minimize',
    /** 윈도우 최대화/복원 토글 */
    MAXIMIZE: 'window:maximize',
    /** 윈도우 닫기 */
    CLOSE: 'window:close',
  },

  // ===== TAB 영역 (탭 관리 - Request/Response) =====
  TAB: {
    /** 새 탭 생성 (Request: URL, Response: tabId) */
    CREATE: 'tab:create',
    /** 탭 닫기 (Request: tabId) */
    CLOSE: 'tab:close',
    /** 탭 전환 (Request: tabId) */
    SWITCH: 'tab:switch',
    /** 탭 URL 변경 (Request: tabId, url) */
    UPDATE_URL: 'tab:update-url',
    /** 탭 목록 조회 */
    LIST: 'tab:list',
    /** 활성 탭 ID 조회 */
    ACTIVE: 'tab:active',
    /** 현재 탭 네비게이션 */
    NAVIGATE: 'tab:navigate',
    /** 뒤로 가기 */
    BACK: 'tab:back',
    /** 앞으로 가기 */
    FORWARD: 'tab:forward',
    /** 새로고침 */
    RELOAD: 'tab:reload',
    /** [Event] 탭 목록 업데이트 (Main → Renderer) */
    UPDATED: 'tabs:updated',
  },

  // ===== NAVIGATION 영역 (브라우징 네비게이션) =====
  NAV: {
    /** URL로 이동 (Request: url) */
    NAVIGATE: 'nav:navigate',
    /** 뒤로 가기 */
    BACK: 'nav:back',
    /** 앞으로 가기 */
    FORWARD: 'nav:forward',
    /** 새로고침 */
    RELOAD: 'nav:reload',
    /** [Event] 네비게이션 상태 변경 (뒤/앞 가능 여부 변경) */
    STATE_CHANGED: 'nav:state-changed',
  },

  // ===== SIDEBAR 영역 =====
  SIDEBAR: {
    /** 사이드바 토글 (확장/축소) */
    TOGGLE: 'sidebar:toggle',
  },

  // ===== VIEW 영역 (WebContentsView 관리 - Zen Layout) =====
  VIEW: {
    /** WebContentsView 크기/위치 조절 (Request: bounds) */
    RESIZE: 'view:resize',
    /** WebContentsView로 네비게이션 (Request: url) */
    NAVIGATE: 'view:navigate',
    /** Settings 페이지 열림/닫힘 토글 */
    SETTINGS_TOGGLED: 'view:settings-toggled',
    /** [Event] WebContentsView 로드 완료 */
    LOADED: 'view:loaded',
    /** [Event] WebContentsView 네비게이션 완료 */
    NAVIGATED: 'view:navigated',
  },

  // ===== SETTINGS 영역 =====
  SETTINGS: {
    GET_ALL: 'settings:get-all',
    GET: 'settings:get',
    UPDATE: 'settings:update',
    UPDATE_MULTIPLE: 'settings:update-multiple',
    RESET: 'settings:reset',
  },

  // ===== OVERLAY 영역 (UI overlay latch/toggles) =====
  OVERLAY: {
    TOGGLE_HEADER_LATCH: 'overlay:toggle-header-latch',
    TOGGLE_SIDEBAR_LATCH: 'overlay:toggle-sidebar-latch',
    SET_INTERACTIVE: 'overlay:set-interactive',
    /** [Event] Ghost 상태에서 edge hover 감지 (Main → Renderer) */
    EDGE_HOVER: 'overlay:edge-hover',
    /** [Event] WebView에서 마우스 다운/업 발생 (Main → Renderer) */
    CONTENT_POINTER: 'overlay:content-pointer',
    DEBUG: 'overlay:debug',
  },
} as const

/**
 * IPC 채널 타입 (TypeScript)
 *
 * 모든 채널 문자열의 합집합 (Union Type)
 * IDE 자동완성과 타입 체킹에 사용됨
 */
export type IPCChannelType =
  | typeof IPC_CHANNELS.APP[keyof typeof IPC_CHANNELS.APP]
  | typeof IPC_CHANNELS.WINDOW[keyof typeof IPC_CHANNELS.WINDOW]
  | typeof IPC_CHANNELS.TAB[keyof typeof IPC_CHANNELS.TAB]
  | typeof IPC_CHANNELS.NAV[keyof typeof IPC_CHANNELS.NAV]
  | typeof IPC_CHANNELS.SIDEBAR[keyof typeof IPC_CHANNELS.SIDEBAR]
  | typeof IPC_CHANNELS.VIEW[keyof typeof IPC_CHANNELS.VIEW]
  | typeof IPC_CHANNELS.SETTINGS[keyof typeof IPC_CHANNELS.SETTINGS]
  | typeof IPC_CHANNELS.OVERLAY[keyof typeof IPC_CHANNELS.OVERLAY]
