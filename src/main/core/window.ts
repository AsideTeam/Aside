/**
 * MainWindow Management
 *
 * 책임: Electron BrowserWindow 생성 및 설정
 * - React UI 호스팅
 * - 개발/배포 모드별 URL 설정
 * - 창 속성 구성
 *
 * 사용 예:
 *   import { MainWindow } from '@main/core/window'
 *   MainWindow.create()
 *   MainWindow.getWindow() // 반환
 *
 * 참고: 단일 메인 창만 관리 (타브 기반 UI는 ViewManager 담당)
 */

import { BrowserWindow, app, screen } from 'electron'
import { join } from 'node:path'
import { logger } from '@main/utils/Logger'
import { Env } from '@main/config'

/**
 * MainWindow 싱글톤 관리
 *
 * 책임:
 * - BrowserWindow 생성 및 소유권 관리
 * - React 번들(renderer) 렌더링
 * - 창 상태 추적
 */
export class MainWindow {
  // NOTE: Zen/Arc 스타일 오버레이를 위해 2-윈도우 구조를 사용
  // - contentWindow: WebContentsView(웹페이지) 전용
  // - uiWindow: React UI(투명 오버레이) 전용
  private static uiWindow: BrowserWindow | null = null
  private static contentWindow: BrowserWindow | null = null
  private static isCreating = false
  private static overlayTimer: NodeJS.Timeout | null = null

  // Overlay latch states (keyboard/UI toggles)
  private static headerLatched = false
  private static sidebarLatched = false

  static getHeaderLatched(): boolean {
    return this.headerLatched
  }

  static getSidebarLatched(): boolean {
    return this.sidebarLatched
  }

  static toggleHeaderLatched(): boolean {
    this.headerLatched = !this.headerLatched
    try {
      this.uiWindow?.webContents.send('header:latch-changed', {
        latched: this.headerLatched,
        timestamp: Date.now(),
      })
    } catch {
      // ignore
    }
    return this.headerLatched
  }

  static toggleSidebarLatched(): boolean {
    this.sidebarLatched = !this.sidebarLatched
    try {
      this.uiWindow?.webContents.send('sidebar:latch-changed', {
        latched: this.sidebarLatched,
        timestamp: Date.now(),
      })
    } catch {
      // ignore
    }
    return this.sidebarLatched
  }

  /**
   * MainWindow 생성
   *
   * 프로세스:
   * 1. 창 인스턴스 생성 (크기, 위치, preload 스크립트)
   * 2. URL 로드 (개발: localhost:5173, 배포: file://)
   * 3. DevTools 자동 열기 (개발 모드)
   * 4. 창 닫기 → 앱 종료 연결
   *
   * @returns 생성된 BrowserWindow 인스턴스
   * @throws 이미 생성 중이면 예외
   */
  static async create(): Promise<BrowserWindow> {
    if (this.uiWindow && this.contentWindow) {
      logger.warn('[MainWindow] Windows already exist. Returning existing instance.')
      return this.uiWindow
    }

    if (this.isCreating) {
      throw new Error('[MainWindow] Window creation already in progress')
    }

    this.isCreating = true

    try {
      logger.info('[MainWindow] Creating main window...')

      // Step 1: 디스플레이 정보 가져오기 (dock/메뉴바 제외 영역)
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const isMacOS = process.platform === 'darwin'

      // Step 2: ContentWindow(바닥) 옵션 구성 - WebContentsView만 호스팅
      const contentWindowOptions: Electron.BrowserWindowConstructorOptions = {
        width,
        height,
        minWidth: 800,
        minHeight: 600,

        // 바닥창은 웹페이지만 보여주므로 프레임리스
        frame: false,

        webPreferences: {
          // WebContentsView가 별도로 contextIsolation을 사용
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
        },

        // UI 준비될 때까지 숨김
        show: false,

        // 컨텐츠 배경 (투명 금지)
        backgroundColor: '#000000',
      }

      // Step 3: ContentWindow 생성
      this.contentWindow = new BrowserWindow(contentWindowOptions)

      // Step 4: UIWindow(천장) 옵션 구성 - React UI를 투명 오버레이로 렌더
      const uiWindowOptions: Electron.BrowserWindowConstructorOptions = {
        width,
        height,
        minWidth: 800,
        minHeight: 600,

        frame: false,
        transparent: isMacOS,
        hasShadow: false,
        backgroundColor: isMacOS ? '#00000000' : '#1a1a1a',

        // 바닥창 위에 붙어서 같이 움직이도록
        parent: this.contentWindow,

        webPreferences: {
          preload: join(__dirname, '../preload/index.cjs'),
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
        },

        show: false,
      }

      this.uiWindow = new BrowserWindow(uiWindowOptions)

      logger.info('[MainWindow] Windows created', {
        width,
        height,
        platform: process.platform,
      })

      // Step 5: 이벤트 처리
      this.setupWindowEvents()

      // Step 6: show 로직은 반드시 loadURL 이전에 리스너를 달아서 레이스를 방지
      let didShow = false
      const showBoth = () => {
        try {
          if (didShow) return
          if (!this.contentWindow || !this.uiWindow) return

          // 초기 bounds 동기화
          this.contentWindow.setBounds(this.uiWindow.getBounds())

          // Step 1: ContentWindow를 먼저 show하고 최상단에 (WebContentsView 보이게)
          this.contentWindow.show()
          this.contentWindow.moveTop()

          // Step 2: UIWindow를 위에 올리기 (투명 오버레이)
          this.uiWindow.show()
          this.uiWindow.moveTop()

          // 기본은 웹페이지 클릭이 통과하도록
          this.uiWindow.setIgnoreMouseEvents(true, { forward: true })
          this.startOverlayMouseTracker()

          didShow = true
          logger.info('[MainWindow] Content/UI windows shown')
        } catch (error) {
          logger.error('[MainWindow] Failed to show windows:', error)
        }
      }

      this.uiWindow.once('ready-to-show', showBoth)

      // Step 7: React 앱 URL 로드 (UIWindow)
      const startUrl = this.getStartUrl()
      await this.uiWindow.loadURL(startUrl)
      logger.info('[MainWindow] UI URL loaded', { url: startUrl })

      // Step 8: ready-to-show를 놓치거나 렌더러가 얇게 실패할 때 대비 (fallback)
      setTimeout(() => {
        try {
          if (!this.uiWindow || !this.contentWindow) return
          if (didShow) return

          // ready-to-show가 안 왔어도 실제로는 그려졌을 수 있으니 상태 체크 후 show
          if (!this.uiWindow.isVisible() || !this.contentWindow.isVisible()) {
            logger.warn('[MainWindow] ready-to-show fallback triggered; forcing show')
            showBoth()
          }
        } catch (error) {
          logger.error('[MainWindow] Fallback show failed:', error)
        }
      }, 1200)

      // Step 9: 개발 모드 DevTools는 UI에만
      if (Env.isDev) {
        this.uiWindow.webContents.openDevTools({ mode: 'detach' })
        logger.info('[MainWindow] DevTools opened (dev mode, detached)')
      }

      return this.uiWindow
    } catch (error) {
      logger.error('[MainWindow] Creation failed:', error)
      this.uiWindow = null
      this.contentWindow = null
      throw error
    } finally {
      this.isCreating = false
    }
  }

  /**
   * MainWindow 인스턴스 반환
   *
   * @returns BrowserWindow 또는 null
   */
  static getWindow(): BrowserWindow | null {
    return this.uiWindow
  }

  /** 바닥(Content) 윈도우 반환 (WebContentsView 호스팅) */
  static getContentWindow(): BrowserWindow | null {
    return this.contentWindow
  }

  /**
   * MainWindow 파괴
   *
   * 명시적으로 호출하지 말 것 (창 닫기 → 자동 정리)
   * - 이벤트 리스너 정리
   * - 메모리 해제
   */
  static destroy(): void {
    if (this.overlayTimer) {
      clearInterval(this.overlayTimer)
      this.overlayTimer = null
    }

    if (this.uiWindow) {
      this.uiWindow.removeAllListeners()
      this.uiWindow.webContents?.removeAllListeners()
      this.uiWindow.destroy()
      this.uiWindow = null
    }

    if (this.contentWindow) {
      this.contentWindow.removeAllListeners()
      this.contentWindow.webContents?.removeAllListeners()
      this.contentWindow.destroy()
      this.contentWindow = null
    }

    logger.info('[MainWindow] Windows destroyed and cleaned up')
  }

  /**
   * React 앱 URL 결정
   *
   * 개발: http://localhost:5173 (Vite dev server)
   * 배포: file:///path/to/dist/index.html
   *
   * @returns 로드할 URL
   */
  private static getStartUrl(): string {
    if (Env.isDev) {
      // 개발 모드: Vite dev server
      return 'http://localhost:5173/'
    }

    // 배포 모드: 패키징된 HTML
    const rendererDist = join(__dirname, '../../renderer/index.html')
    return `file://${rendererDist}`
  }

  /**
   * 창 이벤트 설정
   *
   * - closed: 창 닫힐 때 인스턴스 정리
   * - closed → app 종료 (단일 창 기반)
   */
  private static setupWindowEvents(): void {
    if (!this.uiWindow || !this.contentWindow) return

    // 동기화: UI 이동/리사이즈 -> Content도 동일하게
    const syncBounds = () => {
      if (!this.uiWindow || !this.contentWindow) return
      const bounds = this.uiWindow.getBounds()
      this.contentWindow.setBounds(bounds)
    }

    this.uiWindow.on('move', syncBounds)
    this.uiWindow.on('resize', syncBounds)

    // UI 닫히면 Content도 닫고 앱 종료
    this.uiWindow.on('closed', () => {
      logger.info('[MainWindow] UI window closed')
      try {
        this.uiWindow = null
        this.contentWindow?.close()
      } finally {
        if (process.platform !== 'darwin') {
          app.quit()
        }
      }
    })

    // Content가 먼저 닫히면 UI도 닫기
    this.contentWindow.on('closed', () => {
      logger.info('[MainWindow] Content window closed')
      this.contentWindow = null
      this.uiWindow?.close()
    })

    logger.info('[MainWindow] Event listeners attached (dual-window)')
  }

  /**
   * 마우스 위치 기반으로 오버레이(사이드바) 인터랙션 영역만 마우스를 받게 함.
   * - 기본: UIWindow는 click-through (ignoreMouseEvents=true)
   * - 커서가 좌측 핫존/사이드바 영역에 들어오면: ignoreMouseEvents=false + sidebar:open
   * - 커서가 영역 밖으로 나가면: sidebar:close + ignoreMouseEvents=true
   */
  private static startOverlayMouseTracker(): void {
    if (this.overlayTimer || !this.uiWindow) return

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

    const ensureOverlayOnTop = (onTop: boolean) => {
      if (!this.uiWindow) return
      if (isOverlayOnTop === onTop) return
      isOverlayOnTop = onTop
      try {
        if (process.platform === 'darwin') {
          this.uiWindow.setAlwaysOnTop(onTop, 'floating')
        } else {
          this.uiWindow.setAlwaysOnTop(onTop)
        }

        if (onTop) {
          this.uiWindow.moveTop()
        }
      } catch {
        // ignore
      }
    }

    const setUIInteractivity = (interactive: boolean) => {
      if (!this.uiWindow) return
      if (isUIInteractive === interactive) return
      isUIInteractive = interactive
      if (interactive) {
        this.uiWindow.setIgnoreMouseEvents(false)
      } else {
        this.uiWindow.setIgnoreMouseEvents(true, { forward: true })
      }
    }

    const openSidebar = () => {
      if (!this.uiWindow) return
      if (!isSidebarOpen) {
        try {
          this.uiWindow.webContents.send('sidebar:open', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isSidebarOpen = true
      closeArmedAt = null
    }

    const closeSidebar = () => {
      if (!this.uiWindow) return
      if (isSidebarOpen) {
        try {
          this.uiWindow.webContents.send('sidebar:close', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isSidebarOpen = false
    }

    const openHeader = () => {
      if (!this.uiWindow) return
      if (!isHeaderOpen) {
        try {
          this.uiWindow.webContents.send('header:open', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isHeaderOpen = true
      closeArmedAt = null
    }

    const closeHeader = () => {
      if (!this.uiWindow) return
      if (isHeaderOpen) {
        try {
          this.uiWindow.webContents.send('header:close', { timestamp: Date.now() })
        } catch {
          // ignore
        }
      }
      isHeaderOpen = false
    }

    const closeAll = () => {
      if (!this.uiWindow) return
      closeSidebar()
      closeHeader()
      closeArmedAt = null
      ensureOverlayOnTop(false)
      setUIInteractivity(false)
    }

    // 기본은 닫힘 상태
    closeAll()

    // Focus gating (event-driven)
    // - 포커스를 잃으면: 오버레이를 닫고(click-through), latch는 유지
    // - 포커스를 얻으면: 오버레이 로직 재개
    // 기존처럼 매 tick마다 BrowserWindow.getFocusedWindow()를 호출하지 않고,
    // focus/blur 이벤트로 상태만 갱신해 로직을 단순화한다.
    let appFocused = true

    const isOurAppFocused = () => {
      try {
        const focused = BrowserWindow.getFocusedWindow()
        if (!focused) return false
        if (focused === this.uiWindow || focused === this.contentWindow) return true
        const parent = focused.getParentWindow?.()
        return parent === this.uiWindow || parent === this.contentWindow
      } catch {
        return false
      }
    }

    let focusRecalcTimer: NodeJS.Timeout | null = null
    const scheduleFocusRecalc = () => {
      if (focusRecalcTimer) clearTimeout(focusRecalcTimer)
      focusRecalcTimer = setTimeout(() => {
        focusRecalcTimer = null
        appFocused = isOurAppFocused()
        if (!appFocused) {
          closeAll()
        }
      }, 60)
    }

    try {
      this.uiWindow.on('focus', scheduleFocusRecalc)
      this.uiWindow.on('blur', scheduleFocusRecalc)
      this.contentWindow?.on('focus', scheduleFocusRecalc)
      this.contentWindow?.on('blur', scheduleFocusRecalc)

      // Some macOS + transparent + click-through combinations can miss per-window blur.
      // App-level events are more reliable when the user switches to another app.
      app.on('browser-window-focus', (_event, win) => {
        if (win === this.uiWindow || win === this.contentWindow) scheduleFocusRecalc()
      })

      app.on('browser-window-blur', (_event, win) => {
        if (win === this.uiWindow || win === this.contentWindow) scheduleFocusRecalc()
      })
    } catch {
      // ignore
    }

    // 초기 상태 계산
    scheduleFocusRecalc()

    // Keyboard toggle: Cmd/Ctrl+L header latch, Cmd/Ctrl+B sidebar latch, Esc closes
    try {
      this.contentWindow?.webContents.on('before-input-event', (event, input) => {
        if (!this.uiWindow) return
        if (input.type !== 'keyDown') return

        const key = (input.key || '').toLowerCase()
        const mod = Boolean(input.control || input.meta)

        if (mod && key === 'l') {
          event.preventDefault()
          this.toggleHeaderLatched()
          closeArmedAt = null
          if (this.headerLatched) {
            openHeader()
            ensureOverlayOnTop(true)
          } else {
            closeHeader()
            // interactivity/top will be recomputed by the next tick
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
            try {
              this.uiWindow?.webContents.send('header:latch-changed', {
                latched: this.headerLatched,
                timestamp: Date.now(),
              })
              this.uiWindow?.webContents.send('sidebar:latch-changed', {
                latched: this.sidebarLatched,
                timestamp: Date.now(),
              })
            } catch {
              // ignore
            }
            closeAll()
          }
        }
      })
    } catch {
      // ignore
    }

    this.overlayTimer = setInterval(() => {
      if (!this.uiWindow) return

      // Do not react to global cursor movement when the app isn't focused.
      // This prevents sidebar/addressbar from popping up while using other apps.
      if (!appFocused) {
        if (isSidebarOpen || isHeaderOpen || isOverlayOnTop || isUIInteractive) {
          closeAll()
        }
        return
      }

      const bounds = this.uiWindow.getBounds()
      const pt = screen.getCursorScreenPoint()

      // 창 가장자리에서 1~2px 정도 판정이 튀는 케이스가 있어 완화
      const EDGE_PAD = 2

      // 상단은 HEADER_HOTZONE_HEIGHT만큼 더 허용하여 macOS 타이틀바 영역까지 커버
      const insideWindow =
        pt.x >= bounds.x - EDGE_PAD &&
        pt.x <= bounds.x + bounds.width + EDGE_PAD &&
        pt.y >= bounds.y - HEADER_HOTZONE_HEIGHT &&
        pt.y <= bounds.y + bounds.height + EDGE_PAD

      if (!insideWindow) {
        // 앱 창 밖으로 나가도 latched면 '보이기'는 유지하고 클릭만 통과
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

      // Keep UIWindow visually above WebContentsView while any overlay is visible
      ensureOverlayOnTop(wantHeaderVisible || wantSidebarVisible)

      // Interactivity should only be enabled when cursor is inside the interactive region,
      // so we don't block clicks on the underlying WebContentsView.
      const wantHeaderInteractive = wantHeaderVisible && relY <= HEADER_HEIGHT
      const wantSidebarInteractive = wantSidebarVisible && relX <= (isSidebarOpen ? SIDEBAR_WIDTH : HOTZONE_WIDTH)
      setUIInteractivity(wantHeaderInteractive || wantSidebarInteractive)

      if (wantHeaderVisible) {
        if (isSidebarOpen && !this.sidebarLatched) closeSidebar()
        openHeader()
        return
      }

      if (wantSidebarVisible) {
        // 헤더 영역(상단)에서 충돌할 수 있어, 상단은 header가 우선.
        if (isHeaderOpen && !this.headerLatched) closeHeader()
        openSidebar()
        return
      }

      if (isSidebarOpen || isHeaderOpen) {
        if (this.headerLatched || this.sidebarLatched) {
          // latched header stays visible; interactivity is handled above
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
