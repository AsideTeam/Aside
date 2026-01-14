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
import { logger } from '@main/utils/logger'
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
  // NOTE(2026-01): 2-윈도우는 macOS에서 드래그 중 미세 지연/드리프트가 발생해
  // UI(header)와 WebContentsView가 “따로 노는” 느낌이 생긴다.
  // 따라서 단일 BrowserWindow를 생성하고, ViewManager/OverlayController API 호환을 위해
  // uiWindow/contentWindow가 동일 인스턴스를 참조하도록 한다.
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

      // Step 2: 단일 UIWindow 옵션 구성 (React UI + WebContentsView를 동일 윈도우에 호스팅)
      const uiWindowOptions: Electron.BrowserWindowConstructorOptions = {
        x,
        y,
        width,
        height,
        minWidth: 800,
        minHeight: 600,

        frame: false,

        // macOS: customButtonsOnHover (Arc/Zen 스타일)
        // - Native traffic lights가 hover 시에만 자동으로 나타남
        // - 커스텀 버튼 대신 진짜 macOS 신호등 사용
        ...(isMacOS
          ? {
              titleBarStyle: 'customButtonsOnHover',
              trafficLightPosition: macTrafficLights,
            }
          : {}),
        // 단일 윈도우 모드에서는 투명 윈도우가 “아무것도 안 보이는” 상태를 만들기 쉽다.
        // (overlay-mode CSS가 background를 transparent로 만들 수 있음)
        // 따라서 macOS에서도 기본은 불투명으로 유지한다.
        transparent: false,
        hasShadow: false,
        // theme.css --color-bg-primary: rgb(3, 7, 18)
        // Native view resize 지연으로 생기는 빈 영역(white flash)을 테마 배경색으로 숨긴다.
        backgroundColor: '#030712',

        // 바닥창 위에 붙어서 같이 움직이도록
        webPreferences: {
          preload: join(__dirname, '../preload/index.cjs'),
          contextIsolation: true,
          sandbox: Env.isDev ? false : true,
          nodeIntegration: false,
          webSecurity: true,
        },

        show: false,
      }

      this.uiWindow = new BrowserWindow(uiWindowOptions)
      // API 호환을 위해 contentWindow도 같은 인스턴스를 참조.
      this.contentWindow = this.uiWindow

      logger.info('[MainWindow] Windows created', {
        width,
        height,
        platform: process.platform,
      })

      // Step 5: 이벤트 처리
      this.setupWindowEvents()

      // Step 6: show 로직은 반드시 loadURL 이전에 리스너를 달아서 레이스를 방지
      let didShow = false
      const showMain = () => {
        try {
          if (didShow) return
          if (!this.uiWindow) return

          // customButtonsOnHover가 자동으로 traffic lights를 관리함
          this.uiWindow.show()
          this.uiWindow.focus()

          // 단일 윈도우(Views): UI는 BrowserWindow 기본 webContents에서 렌더링된다.
          OverlayController.attach({
            uiWindow: this.uiWindow,
            contentWindow: this.uiWindow,
            uiWebContents: this.uiWindow.webContents,
          })

          didShow = true
          logger.info('[MainWindow] Main window shown (single-window)')
        } catch (error) {
          logger.error('[MainWindow] Failed to show windows:', error)
        }
      }

      this.uiWindow.once('ready-to-show', showMain)

      // Step 7: UI는 BrowserWindow 기본 webContents에서 로드
      const startUrl = this.getStartUrl()
      await this.uiWindow.loadURL(startUrl)
      logger.info('[MainWindow] UI URL loaded (base webContents)', { url: startUrl })

      // Step 8: ready-to-show를 놓치거나 렌더러가 얇게 실패할 때 대비 (fallback)
      setTimeout(() => {
        try {
          if (!this.uiWindow) return
          if (didShow) return

          // ready-to-show가 안 왔어도 실제로는 그려졌을 수 있으니 상태 체크 후 show
          if (!this.uiWindow.isVisible()) {
            logger.warn('[MainWindow] ready-to-show fallback triggered; forcing show')
            showMain()
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

  static getWebContents(): Electron.WebContents | null {
    return this.uiWindow?.webContents ?? null
  }

  static getUiOverlayWebContents(): Electron.WebContents | null {
    // Backward-compatible alias: UI now lives in the base BrowserWindow webContents.
    return this.getWebContents()
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

    // 단일 윈도우 구조: uiWindow/contentWindow는 같은 인스턴스일 수 있다.
    const win = this.uiWindow
    if (win) {
      win.removeAllListeners()
      win.webContents?.removeAllListeners()
      win.destroy()
    }

    this.uiWindow = null
    this.contentWindow = null

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
    }

    // ⭐ 이벤트 리스너 등록
    this.uiWindow.on('moved', syncBoundsAfterMove)
    this.uiWindow.on('resized', syncResize)

    // UI 닫히면 Content도 닫고 앱 종료
    this.uiWindow.on('closed', () => {
      logger.info('[MainWindow] UI window closed')
      try {
        OverlayController.dispose()
        this.uiWindow = null
        this.contentWindow = null
      } finally {
        if (process.platform !== 'darwin') {
          app.quit()
        }
      }
    })

    logger.info('[MainWindow] Event listeners attached (single-window)')
  }

}
