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
import { OverlayController } from '@main/core/OverlayController'

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

      // Step 1: 디스플레이 정보 가져오기
      // NOTE: workAreaSize를 쓰면 macOS 메뉴바 높이만큼 상단이 비어 보일 수 있다.
      // UI/AddressBar를 화면 최상단까지 “꽉 채우기” 위해 display bounds를 사용한다.
      const { x, y, width, height } = screen.getPrimaryDisplay().bounds
      const isMacOS = process.platform === 'darwin'

      // Arc/Zen 스타일 헤더(44px)에 맞춘 traffic lights 오프셋
      // 필요하면 여기 숫자만 미세 조정하면 됨.
      const macTrafficLights = { x: 12, y: 11 }             

      // Step 2: ContentWindow(바닥) 옵션 구성 - WebContentsView만 호스팅
      const contentWindowOptions: Electron.BrowserWindowConstructorOptions = {
        x,
        y,
        width,
        height,
        minWidth: 800,
        minHeight: 600,

        // 바닥창은 웹페이지만 보여주므로 프레임리스
        frame: false,

        // macOS: Hidden Titlebar (Arc/Zen 스타일)
        // - 콘텐츠가 창의 (0,0)부터 그려지도록 함
        // - traffic lights는 contentWindow에만 표시 (parent-child 관계에서 중복 방지)
        ...(isMacOS
          ? {
              titleBarStyle: 'hidden',
              trafficLightPosition: macTrafficLights,
            }
          : {}),

        webPreferences: {
          // WebContentsView가 별도로 contextIsolation을 사용
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
        },

        // UI 준비될 때까지 숨김
        show: false,

        // 컨텐츠 배경 (투명 금지)
        // Renderer 테마의 --color-bg-secondary (rgb(17, 24, 39))와 맞춰
        // sidebar 그림자/투명 합성에서 언더레이가 튀며 seam처럼 보이는 현상을 줄인다.
        backgroundColor: '#111827',
      }

      // Step 3: ContentWindow 생성
      this.contentWindow = new BrowserWindow(contentWindowOptions)

      // Step 4: UIWindow(천장) 옵션 구성 - React UI를 투명 오버레이로 렌더
      const uiWindowOptions: Electron.BrowserWindowConstructorOptions = {
        x,
        y,
        width,
        height,
        minWidth: 800,
        minHeight: 600,

        frame: false,

        // macOS: UI 오버레이 (parent)는 traffic lights를 표시하지 않음
        // - parent-child 관계에서 child(contentWindow)만 traffic lights를 표시
        // - titleBarStyle은 hidden으로 유지하되 trafficLightPosition은 설정하지 않음
        ...(isMacOS
          ? {
              titleBarStyle: 'hidden',
              // ⚠️ trafficLightPosition 제거 - parent는 traffic lights를 표시하지 않음
            }
          : {}),
        transparent: isMacOS,
        hasShadow: false,
        backgroundColor: isMacOS ? '#00000000' : '#1a1a1a',

        // 바닥창 위에 붙어서 같이 움직이도록
        webPreferences: {
          preload: join(__dirname, '../preload/index.cjs'),
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
        },

        show: false,
      }

      this.uiWindow = new BrowserWindow(uiWindowOptions)

      // NOTE: parent/child 바인딩은 플랫폼별 z-order가 달라 UI 오버레이가 가려질 수 있어 사용하지 않는다.
      // 대신 uiWindow(드래그 주체)를 OS가 움직이고, contentWindow가 그 위치를 실시간으로 따라가도록 동기화한다.

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

          // macOS: traffic lights는 contentWindow에만 표시
          if (isMacOS) {
            try {
              this.contentWindow.setWindowButtonVisibility(false)
              this.uiWindow.setWindowButtonVisibility(false)
            } catch {
              // ignore
            }
          }

          // ⭐ contentWindow와 uiWindow를 정확히 정렬
          const bounds = this.uiWindow.getBounds()
          this.contentWindow.setBounds(bounds, false)

          // Step 1: ContentWindow를 먼저 show하고 최상단에 (WebContentsView 보이게)
          this.contentWindow.show()
          this.contentWindow.moveTop()

          // Step 2: UIWindow를 위에 올리기 (투명 오버레이)
          this.uiWindow.show()
          this.uiWindow.moveTop()

          // macOS: contentWindow에 focus를 주더라도 UI 오버레이가 뒤로 밀리지 않게 고정
          if (isMacOS) {
            try {
              this.uiWindow.setAlwaysOnTop(true, 'floating')
            } catch {
              // ignore
            }
          }

          // 기본은 웹페이지 클릭이 통과하도록
          this.uiWindow.setIgnoreMouseEvents(true, { forward: true })
          OverlayController.attach({ uiWindow: this.uiWindow, contentWindow: this.contentWindow })

          // 실제 사용자 포커스는 contentWindow에 있어야 함 (uiWindow는 click-through)
          this.contentWindow.focus()

          // focus로 z-order가 바뀌는 케이스 방지 (특히 macOS)
          try {
            this.uiWindow.moveTop()
          } catch {
            // ignore
          }

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
    OverlayController.dispose()

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
   * 핵심: CSS의 -webkit-app-region: drag가 OS 수준에서 창 이동 처리
   * - moved: 드래그 완료 후 (OverlayController 호버 판정 업데이트)
   * - resized: 창 크기 변경 시 [브라우저 View만 크기 맞춤]
   */
  private static setupWindowEvents(): void {
    if (!this.uiWindow || !this.contentWindow) return

    // One-way follow (UI -> Content) to keep the two-window illusion during native OS drag.
    // - DO NOT set bounds on uiWindow here (avoid feedback loops / double-drag).
    let lastSyncedPos: { x: number; y: number } | null = null
    let moveSyncScheduled = false
    let lastHoverBoundsUpdateAt = 0

    const scheduleMoveSync = () => {
      if (moveSyncScheduled) return
      moveSyncScheduled = true

      setImmediate(() => {
        moveSyncScheduled = false
        if (!this.uiWindow || !this.contentWindow) return

        const bounds = this.uiWindow.getBounds()
        const x = bounds.x
        const y = bounds.y

        if (!lastSyncedPos || lastSyncedPos.x !== x || lastSyncedPos.y !== y) {
          lastSyncedPos = { x, y }
          try {
            this.contentWindow.setPosition(x, y, false)
          } catch (error) {
            logger.error('[MainWindow] syncMoveContent failed:', error)
          }
        }

        // Keep hover coordinates roughly accurate while dragging, without spamming.
        const now = Date.now()
        if (now - lastHoverBoundsUpdateAt >= 50) {
          lastHoverBoundsUpdateAt = now
          OverlayController.onWindowMoved(bounds)
        }
      })
    }

    // ⭐ 드래그 완료 후 호버 판정 업데이트
    const syncBoundsAfterMove = () => {
      if (!this.uiWindow) return
      const bounds = this.uiWindow.getBounds()
      OverlayController.onWindowMoved(bounds)
    }

    const syncResize = () => {
      if (!this.uiWindow || !this.contentWindow) return
      const bounds = this.uiWindow.getBounds()
      OverlayController.onWindowResized(bounds)

      try {
        this.contentWindow.setBounds(bounds, false)
      } catch (error) {
        logger.error('[MainWindow] syncResizeContent failed:', error)
      }
    }

    // ⭐ 이벤트 리스너 등록
    this.uiWindow.on('move', scheduleMoveSync)
    this.uiWindow.on('moved', syncBoundsAfterMove)
    this.uiWindow.on('resized', syncResize)

    // UI 닫히면 Content도 닫고 앱 종료
    this.uiWindow.on('closed', () => {
      logger.info('[MainWindow] UI window closed')
      try {
        OverlayController.dispose()
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
      OverlayController.dispose()
      this.contentWindow = null
      this.uiWindow?.close()
    })

    logger.info('[MainWindow] Event listeners attached (CSS-only drag + real-time view sync)')
  }

}
