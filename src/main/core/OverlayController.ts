/**
 * OverlayController - Clean Focus-Only Architecture
 *
 * 책임:
 * 1. Window focus 상태를 Renderer로 broadcast
 * 2. Latch 상태 toggle IPC 핸들링
 * 3. Keyboard shortcut 처리
 *
 * ❌ 하지 않는 것:
 * - 마우스 위치 추적 (Renderer가 처리)
 * - Hotzone 계산 (Renderer가 처리)
 * - setInterval 폴링 (이벤트 기반)
 * - UI 열고 닫기 (Renderer가 CSS로 처리)
 *
 * 이 구조는 Electron 공식 문서의 overlay window 패턴을 따릅니다:
 * https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions
 * - Main: focus 이벤트만 broadcast
 * - Renderer: mousemove로 hover 감지
 */

import { BrowserWindow } from 'electron'
import { logger } from '@main/utils/Logger'
import { overlayStore } from '@main/state/overlayStore'
import { OverlayLatchChangedEventSchema } from '@shared/validation/schemas'

type AttachArgs = {
  uiWindow: BrowserWindow
  contentWindow: BrowserWindow
}

export class OverlayController {
  private static uiWindow: BrowserWindow | null = null
  private static contentWindow: BrowserWindow | null = null
  private static cleanupFns: Array<() => void> = []
  private static lastInteractive: boolean | null = null

  // Latch state getters/toggles (for IPC handlers)
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
   * Set UI window interactivity
   * 
   * Renderer의 hover 감지에 따라 uiWindow의 마우스 이벤트를 활성화/비활성화
   * - interactive=true: 마우스 이벤트 받음 (hover 상태)
   * - interactive=false: 마우스 이벤트 투과 (click-through)
   */
  static setInteractive(interactive: boolean): void {
    if (!this.uiWindow) return

    if (this.lastInteractive === interactive) return
    this.lastInteractive = interactive

    try {
      if (interactive) {
        this.uiWindow.setIgnoreMouseEvents(false)
      } else {
        this.uiWindow.setIgnoreMouseEvents(true, { forward: true })
      }

      logger.debug('[OverlayController] setInteractive', {
        interactive,
        windowId: this.uiWindow.id,
      })
    } catch {
      // ignore
    }
  }

  /**
   * Attach controller to windows
   * - Setup focus/blur event listeners
   * - Setup keyboard shortcuts
   */
  static attach({ uiWindow, contentWindow }: AttachArgs): void {
    if (this.uiWindow === uiWindow && this.contentWindow === contentWindow) return

    this.dispose()
    this.uiWindow = uiWindow
    this.contentWindow = contentWindow

    this.setupFocusTracking()
    this.setupKeyboardShortcuts()
  }

  static dispose(): void {
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
   * Focus tracking - Main의 유일한 "상태 감지" 책임
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

      logger.debug('[OverlayController] focus changed', {
        focused,
        contentWindowId: contentWindow.id,
        uiWindowId: uiWindow.id,
      })
    }

    const onAnyFocusBlur = () => {
      broadcastFocus(computeFocused())
    }

    // IMPORTANT:
    // 사용자가 주소창/사이드바(UIWindow)를 클릭하면 contentWindow는 blur 되지만
    // 앱은 여전히 포커스 상태여야 한다. 따라서 둘 중 하나라도 focused면 true.
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

    logger.debug('[OverlayController] focus tracking attached', {
      uiWindowId: uiWindow.id,
      contentWindowId: contentWindow.id,
      initialFocused: computeFocused(),
    })
  }

  /**
   * Keyboard shortcuts - contentWindow에서 처리
   * 
   * - Cmd/Ctrl + L: Header latch toggle
   * - Cmd/Ctrl + B: Sidebar latch toggle
   * - Esc: Close all latched overlays
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
