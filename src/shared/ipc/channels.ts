/**
 * IPC Channel Names (상수 - 오타 방지)
 *
 * 구조: 네임스페이스로 그룹핑하여 관리 용이하게
 * Main ↔ Renderer 사이의 "API 주소록"
 */

export const IPC_CHANNELS = {
  // ===== APP =====
  APP: {
    READY: 'app:ready',
    QUIT: 'app:quit',
  },

  // ===== WINDOW =====
  WINDOW: {
    MINIMIZE: 'window:minimize',
    MAXIMIZE: 'window:maximize',
    CLOSE: 'window:close',
  },

  // ===== TAB =====
  TAB: {
    CREATE: 'tab:create',
    CLOSE: 'tab:close',
    SWITCH: 'tab:switch',
    UPDATE_URL: 'tab:update-url',
    UPDATED: 'tabs:updated', // Event: tabs 상태 변경 알림
  },

  // ===== NAVIGATION =====
  NAV: {
    NAVIGATE: 'nav:navigate',
    BACK: 'nav:back',
    FORWARD: 'nav:forward',
    RELOAD: 'nav:reload',
    STATE_CHANGED: 'nav:state-changed', // Event: back/forward 가능 여부 변경
  },

  // ===== SIDEBAR =====
  SIDEBAR: {
    TOGGLE: 'sidebar:toggle',
  },
} as const

/**
 * Type-safe channel 타입 (자동완성 용)
 */
export type IPCChannelType =
  | typeof IPC_CHANNELS.APP[keyof typeof IPC_CHANNELS.APP]
  | typeof IPC_CHANNELS.WINDOW[keyof typeof IPC_CHANNELS.WINDOW]
  | typeof IPC_CHANNELS.TAB[keyof typeof IPC_CHANNELS.TAB]
  | typeof IPC_CHANNELS.NAV[keyof typeof IPC_CHANNELS.NAV]
  | typeof IPC_CHANNELS.SIDEBAR[keyof typeof IPC_CHANNELS.SIDEBAR]
