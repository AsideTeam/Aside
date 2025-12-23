import { BrowserWindow, app, screen } from 'electron'

type AttachArgs = {
  uiWindow: BrowserWindow
  contentWindow: BrowserWindow
}

export class OverlayController {
  private static uiWindow: BrowserWindow | null = null
  private static contentWindow: BrowserWindow | null = null

  private static headerLatched = false
  private static sidebarLatched = false

  private static overlayTimer: NodeJS.Timeout | null = null

  // listeners for cleanup
  private static cleanupFns: Array<() => void> = []

  static getHeaderLatched(): boolean {
    return this.headerLatched
  }

  static getSidebarLatched(): boolean {
    return this.sidebarLatched
  }

  static toggleHeaderLatched(): boolean {
    this.headerLatched = !this.headerLatched
    this.broadcastLatch('header:latch-changed', this.headerLatched)
    return this.headerLatched
  }

  static toggleSidebarLatched(): boolean {
    this.sidebarLatched = !this.sidebarLatched
    this.broadcastLatch('sidebar:latch-changed', this.sidebarLatched)
    return this.sidebarLatched
  }

  private static broadcastLatch(channel: 'header:latch-changed' | 'sidebar:latch-changed', latched: boolean) {
    try {
      this.uiWindow?.webContents.send(channel, { latched, timestamp: Date.now() })
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

    // focus state (event-driven + low-frequency poll)
    let appFocused = true
    let lastFocusPollAt = 0
    const FOCUS_POLL_MS = 250

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
          uiWindow.webContents.send('sidebar:open', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isSidebarOpen = true
      closeArmedAt = null
    }

    const closeSidebar = () => {
      if (isSidebarOpen) {
        try {
          uiWindow.webContents.send('sidebar:close', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isSidebarOpen = false
    }

    const openHeader = () => {
      if (!isHeaderOpen) {
        try {
          uiWindow.webContents.send('header:open', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isHeaderOpen = true
      closeArmedAt = null
    }

    const closeHeader = () => {
      if (isHeaderOpen) {
        try {
          uiWindow.webContents.send('header:close', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isHeaderOpen = false
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

    let focusRecalcTimer: NodeJS.Timeout | null = null
    let lastFocusSent: boolean | null = null

    const broadcastWindowFocus = (focused: boolean) => {
      if (lastFocusSent === focused) return
      lastFocusSent = focused
      try {
        uiWindow.webContents.send('window:focus-changed', {
          focused,
          timestamp: Date.now(),
        })
      } catch {
        // ignore
      }
    }

    const scheduleFocusRecalc = () => {
      if (focusRecalcTimer) clearTimeout(focusRecalcTimer)
      focusRecalcTimer = setTimeout(() => {
        focusRecalcTimer = null
        const nextFocused = isOurAppFocused()
        if (appFocused !== nextFocused) {
          appFocused = nextFocused
          broadcastWindowFocus(appFocused)
          if (!appFocused) closeAll()
        }
      }, 60)
    }

    const addCleanup = (fn: () => void) => {
      this.cleanupFns.push(fn)
    }

    // Initial state
    closeAll()
    scheduleFocusRecalc()

    // Focus events (best-effort)
    try {
      const onUiFocus = () => scheduleFocusRecalc()
      const onUiBlur = () => scheduleFocusRecalc()
      const onContentFocus = () => scheduleFocusRecalc()
      const onContentBlur = () => scheduleFocusRecalc()

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
        if (win === uiWindow || win === contentWindow) scheduleFocusRecalc()
      }
      const onAppWinBlur = (_event: Electron.Event, win: BrowserWindow) => {
        if (win === uiWindow || win === contentWindow) scheduleFocusRecalc()
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
          if (this.headerLatched) {
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

          if (this.sidebarLatched) {
            openSidebar()
            ensureOverlayOnTop(true)
          } else {
            closeSidebar()
          }
        }

        if (key === 'escape') {
          if (this.headerLatched || this.sidebarLatched || isHeaderOpen || isSidebarOpen) {
            event.preventDefault()
            this.headerLatched = false
            this.sidebarLatched = false
            this.broadcastLatch('header:latch-changed', this.headerLatched)
            this.broadcastLatch('sidebar:latch-changed', this.sidebarLatched)
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
      // low-frequency focus poll to guard against missed blur
      const now = Date.now()
      if (now - lastFocusPollAt >= FOCUS_POLL_MS) {
        lastFocusPollAt = now
        const nextFocused = isOurAppFocused()
        if (appFocused !== nextFocused) {
          appFocused = nextFocused
          broadcastWindowFocus(appFocused)
          if (!appFocused) closeAll()
        }
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
        if (this.headerLatched || this.sidebarLatched) {
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
      const wantHeaderVisible = this.headerLatched || wantHeaderHover
      const wantSidebarVisible = this.sidebarLatched || (!wantHeaderVisible && relX <= sidebarWidth)

      ensureOverlayOnTop(wantHeaderVisible || wantSidebarVisible)

      const wantHeaderInteractive = wantHeaderVisible && relY <= HEADER_HEIGHT
      const wantSidebarInteractive = wantSidebarVisible && relX <= (isSidebarOpen ? SIDEBAR_WIDTH : HOTZONE_WIDTH)
      setUIInteractivity(wantHeaderInteractive || wantSidebarInteractive)

      if (wantHeaderVisible) {
        if (isSidebarOpen && !this.sidebarLatched) closeSidebar()
        openHeader()
        return
      }

      if (wantSidebarVisible) {
        if (isHeaderOpen && !this.headerLatched) closeHeader()
        openSidebar()
        return
      }

      if (isSidebarOpen || isHeaderOpen) {
        if (this.headerLatched || this.sidebarLatched) {
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

    addCleanup(() => {
      if (focusRecalcTimer) clearTimeout(focusRecalcTimer)
    })
  }
}
