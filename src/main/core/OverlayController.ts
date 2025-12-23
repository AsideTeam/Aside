/**
 * OverlayController - Arc/Zen Browser Style
 *
 * Arc/Zen의 3단계 state-gate 구현:
 * 1. Window focus 상태 (blur → 즉시 닫힘)
 * 2. 마우스가 window bounds 안에 있는지 (밖이면 즉시 닫힘)
 * 3. Hover zone 안에 있는지 (zone 판정)
 *
 * 핵심 원칙:
 * - close 조건은 Main에서 global하게 판단 (Renderer mouseleave 신뢰 불가)
 * - focus=false OR insideWindow=false → 무조건 close
 * - ignoreMouseEvents(true)는 renderer 이벤트를 죽이므로 hover-out은 Main 처리
 * - Renderer는 open/close animation만 담당
 */

import { BrowserWindow, screen } from 'electron'
import { logger } from '@main/utils/Logger'
import { overlayStore } from '@main/state/overlayStore'
import {
  OverlayLatchChangedEventSchema,
} from '@shared/validation/schemas'

type AttachArgs = {
  uiWindow: BrowserWindow
  contentWindow: BrowserWindow
}

type OverlayState = {
  headerOpen: boolean
  sidebarOpen: boolean
}

export class OverlayController {
  private static uiWindow: BrowserWindow | null = null
  private static contentWindow: BrowserWindow | null = null
  private static cleanupFns: Array<() => void> = []
  
  // Arc 스타일 global mouse tracking
  private static hoverTrackingTimer: ReturnType<typeof setInterval> | null = null
  private static currentState: OverlayState = { headerOpen: false, sidebarOpen: false }

  // Edge hotzone 크기 (Arc/Zen과 동일)
  private static readonly EDGE_SIDEBAR_PX = 24
  private static readonly EDGE_HEADER_PX = 32
  private static readonly TRACKING_INTERVAL_MS = 16 // 60fps (Arc와 동일)

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

  private static broadcastLatch(channel: 'header:latch-changed' | 'sidebar:latch-changed', latched: boolean) {
    try {
      const payload = OverlayLatchChangedEventSchema.parse({ latched, timestamp: Date.now() })
      this.uiWindow?.webContents.send(channel, payload)
    } catch {
      // ignore
    }
  }

  /**
   * Attach controller to windows
   */
  static attach({ uiWindow, contentWindow }: AttachArgs): void {
    if (this.uiWindow === uiWindow && this.contentWindow === contentWindow) return

    this.dispose()
    this.uiWindow = uiWindow
    this.contentWindow = contentWindow

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
        uiWindow.webContents.send('window:focus-changed', focused)
      } catch {
        // ignore
      }

      // Arc 핵심: blur되면 즉시 모든 hover UI 닫음 (latch 제외)
      if (!focused) {
        this.closeNonLatchedOverlays()
      }

      logger.debug('[OverlayController] focus changed', {
        focused,
        contentWindowId: contentWindow.id,
        uiWindowId: uiWindow.id,
      })
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

    this.hoverTrackingTimer = setInterval(() => {
      this.trackMouseAndUpdateState()
    }, this.TRACKING_INTERVAL_MS)

    this.cleanupFns.push(() => {
      this.stopGlobalMouseTracking()
    })

    logger.debug('[OverlayController] Global mouse tracking started')
  }

  private static stopGlobalMouseTracking(): void {
    if (this.hoverTrackingTimer) {
      clearInterval(this.hoverTrackingTimer)
      this.hoverTrackingTimer = null
    }
  }

  private static trackMouseAndUpdateState(): void {
    if (!this.uiWindow || !this.contentWindow) return

    // Arc Step 1: Window focused인가?
    const windowFocused = overlayStore.getState().focused
    if (!windowFocused) {
      this.closeNonLatchedOverlays()
      this.setUIWindowGhost()
      return
    }

    // Arc Step 2: 마우스가 window bounds 안에 있는가?
    const { x: mouseX, y: mouseY } = screen.getCursorScreenPoint()
    const bounds = this.uiWindow.getBounds()

    const insideWindow =
      mouseX >= bounds.x &&
      mouseX < bounds.x + bounds.width &&
      mouseY >= bounds.y &&
      mouseY < bounds.y + bounds.height

    if (!insideWindow) {
      this.closeNonLatchedOverlays()
      this.setUIWindowGhost()
      return
    }

    // Arc Step 3: Hover zone 판정 (window 안에 있을 때만)
    const relativeX = Math.max(0, Math.floor(mouseX - bounds.x))
    const relativeY = Math.max(0, Math.floor(mouseY - bounds.y))

    const { headerLatched, sidebarLatched } = overlayStore.getState()

    // Edge hotzone 판정
    const inSidebarZone = relativeX <= this.EDGE_SIDEBAR_PX
    const inHeaderZone = relativeY <= this.EDGE_HEADER_PX

    const wantHeaderOpen = headerLatched || inHeaderZone
    const wantSidebarOpen = sidebarLatched || inSidebarZone

    // State 변경이 있으면 broadcast + interactive 갱신
    if (
      this.currentState.headerOpen !== wantHeaderOpen ||
      this.currentState.sidebarOpen !== wantSidebarOpen
    ) {
      this.currentState = { headerOpen: wantHeaderOpen, sidebarOpen: wantSidebarOpen }
      this.broadcastOverlayState(this.currentState)

      // Solid: zone 위에 있거나 latch된 경우
      const shouldBeSolid = wantHeaderOpen || wantSidebarOpen
      if (shouldBeSolid) {
        this.setUIWindowSolid()
      } else {
        this.setUIWindowGhost()
      }
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
    }
  }

  /**
   * Renderer에 overlay open/close 상태 전송
   */
  private static broadcastOverlayState(state: OverlayState): void {
    if (!this.uiWindow) return

    try {
      if (state.headerOpen) {
        this.uiWindow.webContents.send('header:open', { timestamp: Date.now() })
      } else {
        this.uiWindow.webContents.send('header:close', { timestamp: Date.now() })
      }

      if (state.sidebarOpen) {
        this.uiWindow.webContents.send('sidebar:open', { timestamp: Date.now() })
      } else {
        this.uiWindow.webContents.send('sidebar:close', { timestamp: Date.now() })
      }
    } catch {
      // ignore
    }
  }

  /**
   * UI Window를 Ghost (click-through) 모드로 전환
   */
  private static setUIWindowGhost(): void {
    if (!this.uiWindow) return
    try {
      this.uiWindow.setIgnoreMouseEvents(true, { forward: true })
    } catch {
      // ignore
    }
  }

  /**
   * UI Window를 Solid (interactive) 모드로 전환
   */
  private static setUIWindowSolid(): void {
    if (!this.uiWindow) return
    try {
      this.uiWindow.setIgnoreMouseEvents(false)
    } catch {
      // ignore
    }
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
