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
  private static window: BrowserWindow | null = null
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
    if (this.window) {
      logger.warn('[MainWindow] Window already exists. Returning existing instance.')
      return this.window
    }

    if (this.isCreating) {
      throw new Error('[MainWindow] Window creation already in progress')
    }

    this.isCreating = true

    try {
      logger.info('[MainWindow] Creating main window...')

      // Step 1: 디스플레이 정보 가져오기 (dock/메뉴바 제외 영역)
      const { width, height } = screen.getPrimaryDisplay().workAreaSize

      // Step 2: BrowserWindow 인스턴스 생성
      this.window = new BrowserWindow({
        width,
        height,
        minWidth: 800,
        minHeight: 600,
        
        // 네이티브 타이틀바 사용 (macOS 신호등 버튼)
        // titleBarStyle: 'hiddenInset',
        // trafficLightPosition: { x: 12, y: 12 },
        titleBarStyle: 'default',

        // preload 스크립트 (IPC 통신용)
        webPreferences: {
          preload: join(__dirname, '../preload/index.cjs'),
          contextIsolation: true, // 보안: 메인 ↔ 렌더러 격리
          // NOTE: Dev에서는 Vite/HMR/CSS 주입 이슈를 피하기 위해 sandbox를 끔
          sandbox: Env.isDev ? false : true,
        },

        // 창 로드 전 숨김 (깜빡임 방지)
        show: false,
        
        // 배경색 (깜빡임 방지)
        backgroundColor: '#1a1a1a',
      })

      logger.info('[MainWindow] BrowserWindow instance created', {
        width,
        height,
      })

      // Step 2: 초기 상태 이벤트 처리
      this.setupWindowEvents()

      // Step 3: React 앱 URL 로드
      const startUrl = this.getStartUrl()
      await this.window.loadURL(startUrl)
      logger.info('[MainWindow] URL loaded', { url: startUrl })

      // Step 4: 창 표시
      this.window.show()
      logger.info('[MainWindow] Window shown')

      // Step 5: 개발 모드에서만 DevTools 자동 열기 (별도 창으로)
      if (Env.isDev) {
        this.window.webContents.openDevTools({ mode: 'detach' })
        logger.info('[MainWindow] DevTools opened (dev mode, detached)')
      }

      return this.window
    } catch (error) {
      logger.error('[MainWindow] Creation failed:', error)
      this.window = null
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
    return this.window
  }

  /**
   * MainWindow 파괴
   *
   * 명시적으로 호출하지 말 것 (창 닫기 → 자동 정리)
   * - 이벤트 리스너 정리
   * - 메모리 해제
   */
  static destroy(): void {
    if (this.window) {
      // ✅ 이벤트 리스너 정리 (메모리 누수 방지)
      this.window.removeAllListeners()
      if (this.window.webContents) {
        this.window.webContents.removeAllListeners()
      }
      this.window.destroy()
      this.window = null
      logger.info('[MainWindow] Window destroyed and cleaned up')
    }
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
    if (!this.window) return

    // 창 닫기 → 앱 종료
    this.window.on('closed', () => {
      this.window = null
      logger.info('[MainWindow] Closed event received')

      // 단일 메인 창 기반이므로 앱 전체 종료
      // (다중 창이면 이 로직 제거)
      if (process.platform !== 'darwin') {
        // macOS 제외 (menubar 앱 패턴 유지)
        app.quit()
      }
    })

    // 렌더러 프로세스 이벤트
    this.window.webContents.on('before-input-event', (event) => {
      // TODO: 커스텀 단축키 처리
      void event
    })

    logger.info('[MainWindow] Event listeners attached')
  }
}
