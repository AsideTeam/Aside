// IPC 채널명 상수
export enum IPCChannels {
  // Tab 관련
  TAB_CREATE = 'tab:create',
  TAB_CLOSE = 'tab:close',
  TAB_SWITCH = 'tab:switch',
  TAB_UPDATE_URL = 'tab:update-url',
  TABS_UPDATED = 'tabs:updated',
  
  // Navigation 관련
  NAVIGATE = 'nav:navigate',
  GO_BACK = 'nav:back',
  GO_FORWARD = 'nav:forward',
  RELOAD = 'nav:reload',
  NAV_STATE_CHANGED = 'nav:state-changed',
  
  // Sidebar 관련
  SIDEBAR_TOGGLE = 'sidebar:toggle',
  
  // Window 관련
  WINDOW_MINIMIZE = 'window:minimize',
  WINDOW_MAXIMIZE = 'window:maximize',
  WINDOW_CLOSE = 'window:close'
}

export type IPCChannelKey = keyof typeof IPCChannels
