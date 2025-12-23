import { BrowserWindow, app, screen } from 'electron'
import { overlayStore } from '@main/state/overlayStore'
import {
  OverlayFocusChangedEventSchema,
  OverlayLatchChangedEventSchema,
  OverlayOpenCloseEventSchema,
} from '@shared/validation/schemas'

type AttachArgs = {
  uiWindow: BrowserWindow
  contentWindow: BrowserWindow
}

export class OverlayController {
  private static uiWindow: BrowserWindow | null = null
  private static contentWindow: BrowserWindow | null = null

  private static overlayTimer: NodeJS.Timeout | null = null

  // listeners for cleanup
  private static cleanupFns: Array<() => void> = []

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

  static attach({ uiWindow, contentWindow }: AttachArgs): void {
    // idempotent
    if (this.uiWindow === uiWindow && this.contentWindow === contentWindow && this.overlayTimer) return

    this.dispose()

    this.uiWindow = uiWindow
    this.contentWindow = contentWindow

    this.startMouseTracker()
  }

  static dispose(): void {
    if (this.overlayTimer) {
      clearInterval(this.overlayTimer)
      this.overlayTimer = null
    }

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

  private static startMouseTracker(): void {
    if (!this.uiWindow || !this.contentWindow) return
    if (this.overlayTimer) return

    const uiWindow = this.uiWindow
    const contentWindow = this.contentWindow

    const HOTZONE_WIDTH = 6
    const SIDEBAR_WIDTH = 256 // theme.css: 16rem
    const CLOSE_DELAY_MS = 180

    const HEADER_HOTZONE_HEIGHT = 40 // includes macOS titlebar
    const HEADER_HEIGHT = 64

    let isSidebarOpen = false
    let isHeaderOpen = false
    let closeArmedAt: number | null = null

    let isOverlayOnTop = false
    let isUIInteractive = false

    // focus state (event-driven)
    let appFocused = true

    const ensureOverlayOnTop = (onTop: boolean) => {
      if (isOverlayOnTop === onTop) return
      isOverlayOnTop = onTop
      try {
        if (process.platform === 'darwin') {
          uiWindow.setAlwaysOnTop(onTop, 'floating')
        } else {
          uiWindow.setAlwaysOnTop(onTop)
        }

        if (onTop) {
          uiWindow.moveTop()
        }
      } catch {
        // ignore
      }
    }

    const setUIInteractivity = (interactive: boolean) => {
      if (isUIInteractive === interactive) return
      isUIInteractive = interactive
      try {
        if (interactive) {
          uiWindow.setIgnoreMouseEvents(false)
        } else {
          uiWindow.setIgnoreMouseEvents(true, { forward: true })
        }
      } catch {
        // ignore
      }
    }

    const openSidebar = () => {
      if (!isSidebarOpen) {
        try {
          const payload = OverlayOpenCloseEventSchema.parse({ timestamp: Date.now() })
          uiWindow.webContents.send('sidebar:open', payload)
        } catch {
          // ignore
        }
      }
      isSidebarOpen = true
      overlayStore.getState().setSidebarOpen(true)
      closeArmedAt = null
    }

    const closeSidebar = () => {
      if (isSidebarOpen) {
        try {
          const payload = OverlayOpenCloseEventSchema.parse({ timestamp: Date.now() })
          uiWindow.webContents.send('sidebar:close', payload)
        } catch {
          // ignore
        }
      }
      isSidebarOpen = false
      overlayStore.getState().setSidebarOpen(false)
    }

    const openHeader = () => {
      if (!isHeaderOpen) {
        try {
          const payload = OverlayOpenCloseEventSchema.parse({ timestamp: Date.now() })
          uiWindow.webContents.send('header:open', payload)
        } catch {
          // ignore
        }
      }
      isHeaderOpen = true
      overlayStore.getState().setHeaderOpen(true)
      closeArmedAt = null
    }

    const closeHeader = () => {
      if (isHeaderOpen) {
        try {
          const payload = OverlayOpenCloseEventSchema.parse({ timestamp: Date.now() })
          uiWindow.webContents.send('header:close', payload)
        } catch {
          // ignore
        }
      }
      isHeaderOpen = false
      overlayStore.getState().setHeaderOpen(false)
    }

    const closeAll = () => {
      closeSidebar()
      closeHeader()
      closeArmedAt = null
      ensureOverlayOnTop(false)
      setUIInteractivity(false)
    }

    const isOurAppFocused = () => {
      try {
        const focused = BrowserWindow.getFocusedWindow()
        if (!focused) return false
        if (focused === uiWindow || focused === contentWindow) return true
        const parent = focused.getParentWindow?.()
        return parent === uiWindow || parent === contentWindow
      } catch {
        return false
      }
    }

    const computeAppFocused = () => {
      try {
        const maybe = app as unknown as { isFocused?: () => boolean }
        if (typeof maybe.isFocused === 'function') {
          if (!maybe.isFocused()) return false
        }
      } catch {
        // ignore
      }
      return isOurAppFocused()
    }

    let lastFocusSent: boolean | null = null

    const broadcastWindowFocus = (focused: boolean) => {
      if (lastFocusSent === focused) return
      lastFocusSent = focused
      try {
        const payload = OverlayFocusChangedEventSchema.parse(focused)
        uiWindow.webContents.send('window:focus-changed', payload)
      } catch {
        // ignore
      }
    }

    const addCleanup = (fn: () => void) => {
      this.cleanupFns.push(fn)
    }

    // Initial state
    closeAll()
    // Send initial focus state immediately so renderer doesn't rely on any polling.
    try {
      appFocused = computeAppFocused()
      overlayStore.getState().setFocused(appFocused)
      broadcastWindowFocus(appFocused)
      if (!appFocused) closeAll()
    } catch {
      // ignore
    }

    // Focus events (best-effort)
    try {
      const emitNow = () => {
        const nextFocused = computeAppFocused()
        if (appFocused !== nextFocused) {
          appFocused = nextFocused
          overlayStore.getState().setFocused(appFocused)
          broadcastWindowFocus(appFocused)
          if (!appFocused) closeAll()
        }
      }

      const onUiFocus = () => emitNow()
      const onUiBlur = () => emitNow()
      const onContentFocus = () => emitNow()
      const onContentBlur = () => emitNow()

      uiWindow.on('focus', onUiFocus)
      uiWindow.on('blur', onUiBlur)
      contentWindow.on('focus', onContentFocus)
      contentWindow.on('blur', onContentBlur)

      addCleanup(() => {
        uiWindow.removeListener('focus', onUiFocus)
        uiWindow.removeListener('blur', onUiBlur)
        contentWindow.removeListener('focus', onContentFocus)
        contentWindow.removeListener('blur', onContentBlur)
      })

      const onAppWinFocus = (_event: Electron.Event, win: BrowserWindow) => {
        if (win === uiWindow || win === contentWindow) emitNow()
      }
      const onAppWinBlur = (_event: Electron.Event, win: BrowserWindow) => {
        if (win === uiWindow || win === contentWindow) emitNow()
      }

      app.on('browser-window-focus', onAppWinFocus)
      app.on('browser-window-blur', onAppWinBlur)
      addCleanup(() => {
        app.removeListener('browser-window-focus', onAppWinFocus)
        app.removeListener('browser-window-blur', onAppWinBlur)
      })
    } catch {
      // ignore
    }

    // Keyboard toggle parity (Cmd/Ctrl+L header latch, Cmd/Ctrl+B sidebar latch, Esc closes)
    try {
      const onBeforeInput = (event: Electron.Event, input: Electron.Input) => {
        if (input.type !== 'keyDown') return

        const key = (input.key || '').toLowerCase()
        const mod = Boolean((input as unknown as { control?: boolean; meta?: boolean }).control || (input as unknown as { meta?: boolean }).meta)

        if (mod && key === 'l') {
          event.preventDefault()
          this.toggleHeaderLatched()
          closeArmedAt = null
          if (overlayStore.getState().headerLatched) {
            openHeader()
            ensureOverlayOnTop(true)
          } else {
            closeHeader()
          }
        }

        if (mod && key === 'b') {
          event.preventDefault()
          this.toggleSidebarLatched()
          closeArmedAt = null

          if (overlayStore.getState().sidebarLatched) {
            openSidebar()
            ensureOverlayOnTop(true)
          } else {
            closeSidebar()
          }
        }

        if (key === 'escape') {
          const { headerLatched, sidebarLatched } = overlayStore.getState()
          if (headerLatched || sidebarLatched || isHeaderOpen || isSidebarOpen) {
            event.preventDefault()
            overlayStore.getState().setHeaderLatched(false)
            overlayStore.getState().setSidebarLatched(false)
            this.broadcastLatch('header:latch-changed', false)
            this.broadcastLatch('sidebar:latch-changed', false)
            closeAll()
          }
        }
      }

      contentWindow.webContents.on('before-input-event', onBeforeInput)
      addCleanup(() => {
        try {
          contentWindow.webContents.removeListener('before-input-event', onBeforeInput)
        } catch {
          // ignore
        }
      })
    } catch {
      // ignore
    }

    this.overlayTimer = setInterval(() => {
      if (uiWindow.isDestroyed() || contentWindow.isDestroyed()) {
        try {
          this.dispose()
        } catch {
          // ignore
        }
        return
      }

      // Hard gate: even if blur events are missed, do not allow overlay while another app is focused.
      const nextFocused = computeAppFocused()
      if (appFocused !== nextFocused) {
        appFocused = nextFocused
        overlayStore.getState().setFocused(appFocused)
        broadcastWindowFocus(appFocused)
        if (!appFocused) closeAll()
      }

      if (!appFocused) {
        if (isSidebarOpen || isHeaderOpen || isOverlayOnTop || isUIInteractive) {
          closeAll()
        }
        return
      }

      const bounds = uiWindow.getBounds()
      const pt = screen.getCursorScreenPoint()

      const EDGE_PAD = 2

      const insideWindow =
        pt.x >= bounds.x - EDGE_PAD &&
        pt.x <= bounds.x + bounds.width + EDGE_PAD &&
        pt.y >= bounds.y - HEADER_HOTZONE_HEIGHT &&
        pt.y <= bounds.y + bounds.height + EDGE_PAD

      if (!insideWindow) {
        const { headerLatched, sidebarLatched } = overlayStore.getState()
        if (headerLatched || sidebarLatched) {
          ensureOverlayOnTop(true)
          setUIInteractivity(false)
          return
        }

        if (isSidebarOpen || isHeaderOpen) closeAll()
        return
      }

      const relX = pt.x - bounds.x
      const relY = pt.y - bounds.y

      const sidebarWidth = isSidebarOpen ? SIDEBAR_WIDTH : HOTZONE_WIDTH
      const headerHotzoneHeight = isHeaderOpen ? HEADER_HEIGHT : HEADER_HOTZONE_HEIGHT

      const wantHeaderHover = relY <= headerHotzoneHeight
      const { headerLatched, sidebarLatched } = overlayStore.getState()
      const wantHeaderVisible = headerLatched || wantHeaderHover
      const wantSidebarVisible = sidebarLatched || (!wantHeaderVisible && relX <= sidebarWidth)

      ensureOverlayOnTop(wantHeaderVisible || wantSidebarVisible)

      const wantHeaderInteractive = wantHeaderVisible && relY <= HEADER_HEIGHT
      const wantSidebarInteractive = wantSidebarVisible && relX <= (isSidebarOpen ? SIDEBAR_WIDTH : HOTZONE_WIDTH)
      setUIInteractivity(wantHeaderInteractive || wantSidebarInteractive)

      if (wantHeaderVisible) {
        if (isSidebarOpen && !overlayStore.getState().sidebarLatched) closeSidebar()
        openHeader()
        return
      }

      if (wantSidebarVisible) {
        if (isHeaderOpen && !overlayStore.getState().headerLatched) closeHeader()
        openSidebar()
        return
      }

      if (isSidebarOpen || isHeaderOpen) {
        const { headerLatched: hl, sidebarLatched: sl } = overlayStore.getState()
        if (hl || sl) {
          return
        }
        if (closeArmedAt === null) {
          closeArmedAt = Date.now()
          return
        }

        if (Date.now() - closeArmedAt >= CLOSE_DELAY_MS) {
          closeAll()
        }
      }
    }, 33)
  }
}
