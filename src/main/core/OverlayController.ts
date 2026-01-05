/**
 * OverlayController - Arc/Zen Browser Style
 *
 * Arc/Zen의 3단계 state-gate 구현:
 * 1. Window focus 상태 (blur → 즉시 닫힘)
 * 2. 마우스가 window bounds 안에 있는지 (밖이면 즉시 닫힘)
 * 3. Hover zone 안에 있는지 (zone 판정)
 *
 * 핵심 원칙:
 * - Main에서 모든 hover/focus 판정 (Renderer는 신뢰 불가)
 * - Window move/resize 시 즉시 bounds 캐시 업데이트
 * - Renderer는 animation만 담당
 */

import { BrowserWindow, WebContents, screen } from 'electron'
import { logger } from '@main/utils/logger'
import { overlayStore } from '@main/state/overlayStore'
import { OverlayLatchChangedEventSchema } from '@shared/validation/schemas'
import { ViewManager } from '@main/managers/ViewManager'

// ===== Types =====
type OverlayHoverMetrics = {
  sidebarRightPx?: number
  headerBottomPx?: number
  titlebarHeightPx?: number
  dpr: number
  timestamp: number
}

type OverlayState = {
  headerOpen: boolean
  sidebarOpen: boolean
}

type AttachArgs = {
  uiWindow: BrowserWindow
  contentWindow: BrowserWindow
  uiWebContents?: WebContents
}

// ===== Constants =====
const TRACKING_INTERVAL_MS = 16 // ~60fps (hover 반응성)
const MAX_METRICS_AGE_MS = 10000 // 10초로 확대 (Liveness check용)
const STATE_UPDATE_THROTTLE_MS = 16 // 기본 throttle (~60fps)
const WINDOW_ADJUST_THROTTLE_MS = 80 // 이동/크기조절 중 throttle (과도한 jitter 방지)
const WINDOW_ADJUST_DEBOUNCE_MS = 100 // 이동/크기조절 완료 debounce

export class OverlayController {
  // ===== Window References =====
  private static uiWindow: BrowserWindow | null = null
  private static contentWindow: BrowserWindow | null = null
  private static uiWebContents: WebContents | null = null
  private static cleanupFns: Array<() => void> = []
  
  // ===== State =====
  private static currentState: OverlayState = { headerOpen: false, sidebarOpen: false }
  private static hoverMetrics: OverlayHoverMetrics | null = null
  private static cachedWindowBounds: Electron.Rectangle | null = null
  
  // ===== Flags =====
  private static isWindowMoving = false
  private static isWindowResizing = false
  
  // ===== Timers & Tracking =====
  private static hoverTrackingTimer: ReturnType<typeof setInterval> | null = null
  private static lastStateUpdateTime = 0

  // Prevent rapid open/close flicker near the edge hotzones.
  private static lastHeaderOpenedAt = 0
  private static lastSidebarOpenedAt = 0
  private static lastHeaderInZoneAt = 0
  private static lastSidebarInZoneAt = 0

  /**
   * ⭐ Zen 방식: Window가 이동할 때 호출 (moved 이벤트)
   * Main Process가 window 위치를 즉시 업데이트하여 좌표계 불일치 해결
   */
  static onWindowMoved(bounds: Electron.Rectangle): void {
    // ⭐ 실시간 bounds 캐싱 (호버 판정에 즉시 반영)
    this.cachedWindowBounds = bounds
    this.isWindowMoving = true
    setTimeout(() => {
      this.isWindowMoving = false
      // ⭐ 이동 완료 후 즉시 상태 업데이트 (throttle 무시)
      this.lastStateUpdateTime = 0
    }, WINDOW_ADJUST_DEBOUNCE_MS)
  }

  static onWindowResized(bounds: Electron.Rectangle): void {
    this.cachedWindowBounds = bounds
    this.isWindowResizing = true
    setTimeout(() => {
      this.isWindowResizing = false
      // ⭐ 크기 조절 완료 후 즉시 상태 업데이트 (throttle 무시)
      this.lastStateUpdateTime = 0
    }, WINDOW_ADJUST_DEBOUNCE_MS)
    
    try {
      ;(this.uiWebContents ?? this.uiWindow?.webContents)?.send('window:resized', { timestamp: Date.now() })
    } catch { /* ignore */ }
  }

  static updateHoverMetrics(metrics: OverlayHoverMetrics): void {
    
    // Validation
    if (!Number.isFinite(metrics.dpr) || metrics.dpr <= 0 || !Number.isFinite(metrics.timestamp)) {
      logger.warn('[OverlayController] Invalid dpr or timestamp, skipping')
      return
    }

    const current = this.hoverMetrics
    if (!current) {
      this.hoverMetrics = { ...metrics, timestamp: metrics.timestamp || Date.now() }
      logger.info('[OverlayController] Initial metrics received')
      return
    }

    // Partial update
    if (metrics.sidebarRightPx !== undefined && Number.isFinite(metrics.sidebarRightPx)) {
      current.sidebarRightPx = Math.max(0, metrics.sidebarRightPx)
    }

    if (metrics.headerBottomPx !== undefined && Number.isFinite(metrics.headerBottomPx)) {
      current.headerBottomPx = Math.max(0, metrics.headerBottomPx)
    }

    if (metrics.titlebarHeightPx !== undefined && Number.isFinite(metrics.titlebarHeightPx)) {
      current.titlebarHeightPx = Math.max(0, metrics.titlebarHeightPx)
    }

    current.dpr = metrics.dpr
    current.timestamp = metrics.timestamp || Date.now()
    
    // logger.debug('[OverlayController] Hover metrics updated')
  }

  // Latch state (pinned)
  static getHeaderLatched(): boolean {
    return overlayStore.getState().headerLatched
  }

  static getSidebarLatched(): boolean {
    return overlayStore.getState().sidebarLatched
  }

  static toggleHeaderLatched(): boolean {
    const latched = overlayStore.getState().toggleHeaderLatched()
    this.broadcastLatch('header:latch-changed', latched)
    return latched
  }

  static toggleSidebarLatched(): boolean {
    const latched = overlayStore.getState().toggleSidebarLatched()
    this.broadcastLatch('sidebar:latch-changed', latched)
    return latched
  }

  private static broadcastLatch(channel: 'header:latch-changed' | 'sidebar:latch-changed', latched: boolean): void {
    try {
      const payload = OverlayLatchChangedEventSchema.parse({ latched, timestamp: Date.now() })
      ;(this.uiWebContents ?? this.uiWindow?.webContents)?.send(channel, payload)
    } catch { /* ignore */ }
  }

  /**
   * Attach controller to windows
   */
  static attach({ uiWindow, contentWindow, uiWebContents }: AttachArgs): void {
    if (this.uiWindow === uiWindow && this.contentWindow === contentWindow && this.uiWebContents === (uiWebContents ?? null)) return

    this.dispose()
    this.uiWindow = uiWindow
    this.contentWindow = contentWindow
    this.uiWebContents = uiWebContents ?? null

    // Arc 스타일: focus tracking + global mouse tracking + keyboard shortcuts
    this.setupFocusTracking()
    this.startGlobalMouseTracking()
    this.setupKeyboardShortcuts()

    logger.info('[OverlayController] Attached (Arc/Zen style)')
  }

  static dispose(): void {
    this.stopGlobalMouseTracking()
    
    for (const fn of this.cleanupFns.splice(0)) {
      try {
        fn()
      } catch {
        // ignore
      }
    }
    
    this.uiWindow = null
    this.contentWindow = null
    this.uiWebContents = null
  }

  /**
   * Arc 스타일 Step 1: Window Focus Tracking
   * - blur되면 즉시 닫힘 (최우선 조건)
   */
  private static setupFocusTracking(): void {
    if (!this.uiWindow || !this.contentWindow) return

    const uiWindow = this.uiWindow
    const contentWindow = this.contentWindow

    const computeFocused = (): boolean => {
      try {
        return Boolean(uiWindow.isFocused() || contentWindow.isFocused())
      } catch {
        return false
      }
    }

    const broadcastFocus = (focused: boolean) => {
      overlayStore.getState().setFocused(focused)
      
      try {
        const target = this.uiWebContents ?? uiWindow.webContents
        target.send('window:focus-changed', focused)
      } catch {
        // ignore
      }

      // Arc 핵심: blur되면 즉시 모든 hover UI 닫음 (latch 제외)
      if (!focused) {
        this.closeNonLatchedOverlays()
      }
    }

    const onAnyFocusBlur = () => {
      broadcastFocus(computeFocused())
    }

    uiWindow.on('focus', onAnyFocusBlur)
    uiWindow.on('blur', onAnyFocusBlur)
    contentWindow.on('focus', onAnyFocusBlur)
    contentWindow.on('blur', onAnyFocusBlur)

    this.cleanupFns.push(() => {
      uiWindow.removeListener('focus', onAnyFocusBlur)
      uiWindow.removeListener('blur', onAnyFocusBlur)
      contentWindow.removeListener('focus', onAnyFocusBlur)
      contentWindow.removeListener('blur', onAnyFocusBlur)
    })

    // Send initial state
    broadcastFocus(computeFocused())
  }

  /**
   * Arc 스타일 Step 2+3: Global Mouse Tracking
   * - 마우스가 window bounds 밖이면 즉시 닫힘
   * - hover zone 판정 (edge hotzone)
   */
  private static startGlobalMouseTracking(): void {
    if (!this.uiWindow || !this.contentWindow) return

    this.hoverTrackingTimer = setInterval(() => this.trackMouseAndUpdateState(), TRACKING_INTERVAL_MS)
    this.cleanupFns.push(() => this.stopGlobalMouseTracking())
  }

  private static stopGlobalMouseTracking(): void {
    if (this.hoverTrackingTimer) {
      clearInterval(this.hoverTrackingTimer)
      this.hoverTrackingTimer = null
    }
  }

  private static trackMouseAndUpdateState(): void {
    if (!this.uiWindow || !this.contentWindow) return

    // ⭐ Arc Step 1: Window focused인가?
    const windowFocused = overlayStore.getState().focused
    if (!windowFocused) {
      this.closeNonLatchedOverlays()
      return
    }

    // Arc Step 2: 마우스가 window bounds 안에 있는가?
    const { x: mouseX, y: mouseY } = screen.getCursorScreenPoint()
    // ⭐ Zen 방식: cached bounds 우선 사용 (move 중에도 정확한 좌표)
    const bounds = this.cachedWindowBounds || this.uiWindow.getBounds()
    
    // ⭐ Window 이동/크기조절 중에는 hysteresis 적용 (빠른 상태 변경 방지)
    const isAdjusting = this.isWindowMoving || this.isWindowResizing

    const insideWindow =
      mouseX >= bounds.x &&
      mouseX < bounds.x + bounds.width &&
      mouseY >= bounds.y &&
      mouseY < bounds.y + bounds.height

    if (!insideWindow) {
      this.closeNonLatchedOverlays()
      return
    }

    // Metrics stale check
    const metricsAgeMs = this.hoverMetrics ? Date.now() - this.hoverMetrics.timestamp : Number.POSITIVE_INFINITY
    if (!Number.isFinite(metricsAgeMs) || metricsAgeMs > MAX_METRICS_AGE_MS) {
      this.closeNonLatchedOverlays()
      return
    }

    // Arc Step 3: Hover zone 판정 (window 안에 있을 때만)
    // ⭐ 핵심: screen coordinates로 모든 계산 수행
    const relativeX = Math.max(0, Math.floor(mouseX - bounds.x))
    const relativeY = Math.max(0, Math.floor(mouseY - bounds.y))

    const { headerLatched, sidebarLatched } = overlayStore.getState()

    // ⭐ Zone 판정: Electron의 getBounds()는 logical pixels를 반환
    // - macOS: getBounds()는 DPR과 무관하게 항상 logical coordinates
    // - Renderer의 getBoundingClientRect()도 CSS logical pixels
    // - 따라서 DPR 변환 불필요!
    const metrics = this.hoverMetrics
    
    // CSS logical pixels 그대로 사용 (DPR 변환 불필요)
    const sidebarZoneRight = Math.floor(metrics?.sidebarRightPx ?? 0)
    const headerZoneBottom = Math.floor((metrics?.headerBottomPx ?? 0) + (metrics?.titlebarHeightPx ?? 0))

    // Bounds를 넘지 않도록 clamp
    const effectiveSidebarZoneRight = Math.min(Math.max(0, sidebarZoneRight), bounds.width)
    const effectiveHeaderZoneBottom = Math.min(Math.max(0, headerZoneBottom), bounds.height)

    const inSidebarZone = relativeX <= effectiveSidebarZoneRight
    const inHeaderZone = relativeY <= effectiveHeaderZoneBottom

    // Hysteresis: prevent too fast flickering
    const nowMs = Date.now()
    if (inHeaderZone) this.lastHeaderInZoneAt = nowMs
    if (inSidebarZone) this.lastSidebarInZoneAt = nowMs

    // Determine intended states with hysteresis
    let finalHeaderOpen = headerLatched || inHeaderZone
    let finalSidebarOpen = sidebarLatched || inSidebarZone

    const minOpenMs = 400
    const closeDelayMs = 250

    // Header hysteresis
    if (!headerLatched) {
      if (finalHeaderOpen) {
        this.lastHeaderOpenedAt = nowMs
      } else if (this.currentState.headerOpen) {
        // Keep open if within min duration or grace period
        const isStayingOpen = nowMs - this.lastHeaderOpenedAt < minOpenMs
        const isWithinGracePeriod = nowMs - this.lastHeaderInZoneAt < closeDelayMs
        if (isStayingOpen || isWithinGracePeriod) {
          finalHeaderOpen = true
        }
      }
    }

    // Sidebar hysteresis
    if (!sidebarLatched) {
      if (finalSidebarOpen) {
        this.lastSidebarOpenedAt = nowMs
      } else if (this.currentState.sidebarOpen) {
        const isStayingOpen = nowMs - this.lastSidebarOpenedAt < minOpenMs
        const isWithinGracePeriod = nowMs - this.lastSidebarInZoneAt < closeDelayMs
        if (isStayingOpen || isWithinGracePeriod) {
          finalSidebarOpen = true
        }
      }
    }

    // ⭐ DEBUG: 좌표 변환 확인
    if (Math.random() < 0.02) { // 2% 확률로 로깅
      logger.debug('[OverlayController] Coordinate Debug', {
        mouse: { screenX: mouseX, screenY: mouseY, relativeX, relativeY },
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        metrics: {
          sidebarRightPx: metrics?.sidebarRightPx,
          headerBottomPx: metrics?.headerBottomPx,
          titlebarHeightPx: metrics?.titlebarHeightPx,
          sidebarZoneRight,
          headerZoneBottom,
        },
        zones: { inSidebarZone, inHeaderZone },
        state: { headerOpen: finalHeaderOpen, sidebarOpen: finalSidebarOpen },
      })
    }

    // ⭐ Interactivity: 마우스가 UI 영역에 있으면 UI를 상단으로, 아니면 컨텐츠를 상단으로
    // 그래야 WebContentsView(구글 등)의 클릭이 막히지 않음.
    if (inHeaderZone || inSidebarZone) {
      ViewManager.ensureUITopmost()
    } else {
      ViewManager.ensureContentTopmost()
    }

    // Throttle state updates
    const now = Date.now()
    const timeSinceLastUpdate = now - this.lastStateUpdateTime
    const throttleMs = isAdjusting ? WINDOW_ADJUST_THROTTLE_MS : STATE_UPDATE_THROTTLE_MS
    
    const shouldUpdate = 
      this.currentState.headerOpen !== finalHeaderOpen ||
      this.currentState.sidebarOpen !== finalSidebarOpen

    // ⭐ State 변경이 필요하고 throttle 시간이 지났거나 강제 업데이트(lastStateUpdateTime=0)인 경우
    if (shouldUpdate && (timeSinceLastUpdate >= throttleMs || this.lastStateUpdateTime === 0)) {
      this.lastStateUpdateTime = now
      this.currentState = { headerOpen: finalHeaderOpen, sidebarOpen: finalSidebarOpen }
      this.broadcastOverlayState(this.currentState)
      // customButtonsOnHover가 자동으로 traffic lights를 관리함
    }
  }

  /**
   * Arc 핵심: focus=false OR insideWindow=false일 때 호출
   * latch되지 않은 overlay는 즉시 닫음
   */
  private static closeNonLatchedOverlays(): void {
    const { headerLatched, sidebarLatched } = overlayStore.getState()

    const newState: OverlayState = {
      headerOpen: headerLatched,
      sidebarOpen: sidebarLatched,
    }

    if (
      this.currentState.headerOpen !== newState.headerOpen ||
      this.currentState.sidebarOpen !== newState.sidebarOpen
    ) {
      this.currentState = newState
      this.broadcastOverlayState(newState)
      // customButtonsOnHover가 자동으로 traffic lights를 관리함
    }
  }

  private static broadcastOverlayState(state: OverlayState): void {
    if (!this.uiWindow) return
    
    const timestamp = Date.now()
    try {
      const target = this.uiWebContents ?? this.uiWindow.webContents
      target.send(state.headerOpen ? 'header:open' : 'header:close', { timestamp })
      target.send(state.sidebarOpen ? 'sidebar:open' : 'sidebar:close', { timestamp })
    } catch { /* ignore */ }
  }

  /**
   * Keyboard shortcuts - contentWindow에서 처리
   */
  private static setupKeyboardShortcuts(): void {
    if (!this.contentWindow) return

    const contentWindow = this.contentWindow

    const onBeforeInput = (event: Electron.Event, input: Electron.Input) => {
      if (input.type !== 'keyDown') return

      const key = (input.key || '').toLowerCase()
      const mod = Boolean(
        (input as unknown as { control?: boolean; meta?: boolean }).control ||
          (input as unknown as { meta?: boolean }).meta
      )

      // Cmd/Ctrl + L: Header latch
      if (mod && key === 'l') {
        event.preventDefault()
        this.toggleHeaderLatched()
      }

      // Cmd/Ctrl + B: Sidebar latch
      if (mod && key === 'b') {
        event.preventDefault()
        this.toggleSidebarLatched()
      }

      // Esc: Close all
      if (key === 'escape') {
        const { headerLatched, sidebarLatched } = overlayStore.getState()
        if (headerLatched || sidebarLatched) {
          event.preventDefault()
          overlayStore.getState().setHeaderLatched(false)
          overlayStore.getState().setSidebarLatched(false)
          this.broadcastLatch('header:latch-changed', false)
          this.broadcastLatch('sidebar:latch-changed', false)
        }
      }
    }

    contentWindow.webContents.on('before-input-event', onBeforeInput)

    this.cleanupFns.push(() => {
      try {
        contentWindow.webContents.removeListener('before-input-event', onBeforeInput)
      } catch {
        // ignore
      }
    })
  }
}
