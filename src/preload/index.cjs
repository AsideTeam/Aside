/**
 * Preload Script (index.cjs)
 *
 * 책임: Main Process와 Renderer Process 간의 안전한 IPC 브리지
 * - contextBridge를 통해 제한된 API만 노출
 * - 보안: contextIsolation과 함께 사용
 * - CommonJS 형식 (.cjs) - Node.js 호환성
 *
 * 보안 원칙:
 * 1. 필요한 채널만 노출
 * 2. ipcRenderer.invoke만 허용 (안전한 요청-응답)
 * 3. 직접 Node.js API 접근 금지
 * 4. 모든 호출에 타입 체크
 */

const { contextBridge, ipcRenderer } = require('electron')

// Keep track of wrapped IPC listeners so `off(channel, originalListener)` works.
// Map<channel, WeakMap<originalListenerFn, wrappedListenerFn>>
const __listenerWrappers = new Map()

const getWrappedListener = (channel, listener) => {
  let channelMap = __listenerWrappers.get(channel)
  if (!channelMap) {
    channelMap = new WeakMap()
    __listenerWrappers.set(channel, channelMap)
  }

  const existing = channelMap.get(listener)
  if (existing) return existing

  const wrapped = (_event, data) => listener(data)
  channelMap.set(listener, wrapped)
  return wrapped
}

const allowedEventChannels = [
  // Main -> Renderer broadcast channels (to be implemented in Main)
  'tabs:updated',
  'nav:state-changed',
  'app:ready',
  'navigate-to-settings', // Protocol handler: about:settings interception
  'view:loaded', // WebContentsView 로드 완료
  'view:navigated', // WebContentsView 네비게이션 완료
  'sidebar:open',
  'sidebar:close',
  'header:open',
  'header:close',
  'header:latch-changed',
  'sidebar:latch-changed',

  // Overlay edge hover fallback (Main -> Renderer)
  'overlay:edge-hover',
  'overlay:content-pointer',

  // Window focus state (Main -> Renderer)
  'window:focus-changed',
]

/**
 * ElectronAPI: Renderer에서 접근 가능한 IPC 메서드들
 * - window.electronAPI를 통해 노출됨
 * - 모든 메서드는 비동기 (Promise 반환)
 */
const electronAPI = {
  // ===== App Control =====
  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
    restart: () => ipcRenderer.invoke('app:restart'),
    getState: () => ipcRenderer.invoke('app:state'),
  },

  // ===== Window Control =====
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // ===== Tab Management =====
  tab: {
    create: (url) => ipcRenderer.invoke('tab:create', { url }),
    close: (tabId) => ipcRenderer.invoke('tab:close', { tabId }),
    switch: (tabId) => ipcRenderer.invoke('tab:switch', { tabId }),
    list: () => ipcRenderer.invoke('tab:list'),
    getActive: () => ipcRenderer.invoke('tab:active'),
    navigate: (url) => ipcRenderer.invoke('tab:navigate', { url }),
    back: () => ipcRenderer.invoke('tab:back'),
    forward: () => ipcRenderer.invoke('tab:forward'),
    reload: () => ipcRenderer.invoke('tab:reload'),
  },

  // ===== Settings Management =====
  settings: {
    getSettings: () => ipcRenderer.invoke('settings:get-all'),
    updateSetting: (key, value) => ipcRenderer.invoke('settings:update', { key, value }),
  },

  // ===== View Management (WebContentsView - Zen Layout) =====
  view: {
    /**
     * WebContentsView의 크기와 위치 조절
     * @param {Object} bounds - { x, y, width, height, margin? }
     */
    resize: (bounds) => ipcRenderer.send('view:resize', bounds),
    
    /**
     * WebContentsView로 URL 네비게이션
     * @param {string} url - 네비게이션할 URL
     * @returns {Promise<Object>} { success, url, error? }
     */
    navigate: (url) => ipcRenderer.invoke('view:navigate', { url }),
  },

  // ===== Main -> Renderer Events (safe wrapper) =====
  on: (channel, listener) => {
    if (!allowedEventChannels.includes(channel)) {
      throw new Error(`Event channel '${channel}' is not allowed`)
    }
    ipcRenderer.on(channel, getWrappedListener(channel, listener))
  },
  once: (channel, listener) => {
    if (!allowedEventChannels.includes(channel)) {
      throw new Error(`Event channel '${channel}' is not allowed`)
    }
    ipcRenderer.once(channel, getWrappedListener(channel, listener))
  },
  off: (channel, listener) => {
    if (!allowedEventChannels.includes(channel)) {
      throw new Error(`Event channel '${channel}' is not allowed`)
    }
    const wrapped = __listenerWrappers.get(channel)?.get(listener)
    if (wrapped) {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },

  // ===== Utility Functions =====
  /**
   * IPC 채널에 직접 invoke (유연성)
   * @param {string} channel - IPC 채널명
   * @param {...any} args - 인자들
   * @returns {Promise<any>}
   */
  invoke: (channel, ...args) => {
    // 허용된 채널만 invoke 가능 (보안)
    const allowedChannels = [
      // App
      'app:quit',
      'app:restart',
      'app:state',
      
      // Window
      'window:minimize',
      'window:maximize',
      'window:close',
      
      
      // View (WebContentsView)
      'view:navigate',
      // Tab
      'tab:create',
      'tab:close',
      'tab:switch',
      'tab:list',
      'tab:active',
      'tab:navigate',
      'tab:back',
      'tab:forward',
      'tab:reload',
      
      // Settings
      'settings:get-all',
      'settings:get',
      'settings:update',
      'settings:reset',

      // Overlay toggles
      'overlay:toggle-header-latch',
      'overlay:toggle-sidebar-latch',
      'overlay:set-interactive',
      'overlay:update-hover-metrics',
      'overlay:debug',
    ]

    if (!allowedChannels.includes(channel)) {
      return Promise.reject(new Error(`Channel '${channel}' is not allowed`))
    }

    return ipcRenderer.invoke(channel, ...args)
  },
}

/**
 * contextBridge.exposeInMainWorld
 * - Renderer의 window 객체에 electronAPI 추가
 * - contextIsolation이 true일 때만 안전함
 * - Main Process의 객체는 직접 접근 불가 (복사본만 전달)
 */
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  console.log('[Preload] ElectronAPI exposed to renderer')
} catch (error) {
  console.error('[Preload] Failed to expose ElectronAPI:', error)
}

/**
 * 주의: 다음은 노출하면 안 됨
 * - require() 함수
 * - fs, path, os 등 Node.js 모듈
 * - ipcRenderer 직접 노출 (invoke는 래핑된 형태만)
 * - process 객체
 * - __dirname, __filename
 */
