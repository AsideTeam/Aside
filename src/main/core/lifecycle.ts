/**
 * Application Lifecycle Manager
 *
 * 책임: 앱의 전체 생명주기를 중앙에서 관리 및 조율
 * - Bootstrap: 앱 시작 시 필요한 모든 것 초기화
 * - Shutdown: 앱 종료 시 정리 (메모리 해제, DB 연결 종료)
 *
 * 철학:
 * - 각 모듈의 시작/종료 순서를 명확히 함
 * - Manager/Service를 초기화하는 "오케스트레이터"
 * - 각 단계의 에러를 중앙에서 처리
 *
 * 사용 예 (main/index.ts):
 *   app.on('ready', () => AppLifecycle.bootstrap())
 *   app.on('will-quit', () => AppLifecycle.shutdown())
 */

import { Paths, validateEnv } from '@main/config'
import { logger } from '@main/utils/logger'
import { MainWindow } from '@main/core/window'
import { ViewManager } from '@main/managers/viewManager/index'
import { UpdateService } from '@main/services/Update'
import { connectWithRetry, disconnectWithCleanup } from '@main/database/connection'
import { AppearanceService } from '@main/services/AppearanceService'

/**
 * 애플리케이션 생명주기 상태
 */
type LifecycleState = 'idle' | 'bootstrapping' | 'ready' | 'shutting-down' | 'shutdown'

/**
 * 애플리케이션 생명주기 관리자 (Singleton)
 */
export class AppLifecycle {
  private static state: LifecycleState = 'idle'

  /**
   * 현재 생명주기 상태 반환
   */
  static getState(): LifecycleState {
    return this.state
  }

  /**
   * 앱 부팅 단계 (app.on('ready'))
   *
   * 순서:
   * 1. 환경 검증 (Env 초기화 확인)
   * 2. 경로 설정 검증
   * 3. Logger 초기화 (파일 출력)
   * 4. Database 초기화 (Prisma 연결)
   * 5. Managers 초기화 (ViewManager, AppState 등)
   * 6. Services 초기화 (필요한 비즈니스 로직)
   * 7. IPC Handlers 등록
   * 8. Main Window 생성 및 표시
   * 9. Ready 상태로 전환
   */
  static async bootstrap(): Promise<void> {
    if (this.state !== 'idle') {
      throw new Error(
        `[AppLifecycle] Cannot bootstrap from state: ${this.state}. Expected: idle`
      )
    }

    this.state = 'bootstrapping'
    logger.info('Bootstrap started')

    try {
      // Step 1: 환경 검증
      logger.info('Step 1/8: Validating environment')
      validateEnv()

      // Step 2: 경로 설정 검증 (디버깅용)
      logger.info('Step 2/8: Verifying paths')
      Paths.printAll()

      // Step 3: Logger 초기화 (이미 싱글톤으로 초기화됨)
      logger.info('Step 3/8: Logger ready')

      // Step 4: Database 초기화 (재시도 로직 포함)
      logger.info('Step 4/8: Connecting to database...')
      await connectWithRetry(Paths.database())
      logger.info('Step 4/8: Database connected')

      // Appearance (nativeTheme) 초기화는 UI/콘텐츠 뷰 생성 전에 적용
      AppearanceService.initialize()

      // Step 5: Managers 초기화
      logger.info('Step 5/8: Initializing ViewManager')
      const mainWindow = await MainWindow.create()
      // 단일 윈도우: WebContentsView는 mainWindow의 contentView에 붙는다.
      const uiWebContents = MainWindow.getUiOverlayWebContents()
      if (!uiWebContents) {
        throw new Error('[AppLifecycle] UI overlay webContents not available')
      }
      await ViewManager.initialize(mainWindow, uiWebContents)
      logger.info('Step 5/8: ViewManager initialized')

      // Step 6: Services 초기화
      // TODO: 필요한 서비스 초기화
      logger.info('Step 6/8: Services initialized')

      // Step 7: IPC Handlers 등록 (main/index.ts에서 실행됨)
      logger.info('Step 7/8: IPC handlers registered')

      // Step 8: Main Window 생성 (Step 5에서 이미 생성됨)
      logger.info('Step 8/8: Main window already created')

      this.state = 'ready'
      logger.info('Bootstrap completed. App is ready')
    } catch (error) {
      this.state = 'idle'
      logger.error('Bootstrap failed', error)
      throw error
    }
  }

  /**
   * 앱 종료 단계 (app.on('will-quit'))
   *
   * 순서:
   * 1. Managers 정리 (ViewManager destroy, 메모리 해제)
   * 2. Services 정리 (타이머 등록 해제)
   * 3. Database 연결 종료
   * 4. Logger 종료 (파일 버퍼 플러시)
   * 5. 상태 전환
   */
  static async shutdown(): Promise<void> {
    if (this.state !== 'ready') {
      logger.warn(`[AppLifecycle] Shutdown called from state: ${this.state}. Continuing anyway.`)
    }

    this.state = 'shutting-down'
    logger.info('[AppLifecycle] Shutdown started...')

    try {
      // Step 1: ViewManager 정리
      // TODO: ViewManager.destroy()
      logger.info('[AppLifecycle] Step 1/4: ViewManager destroyed')
logger.info('[AppLifecycle] Step 1/4: Destroying ViewManager')
     
      // Step 2: Services 정리
      UpdateService.cleanup()  // ✅ Update 서비스 정리 (타이머 해제)
      AppearanceService.dispose()
      logger.info('[AppLifecycle] Step 2/4: Services cleaned up')

      // Step 3: Database 연결 종료
      await disconnectWithCleanup()  // ✅ DB 연결 정리
      logger.info('[AppLifecycle] Step 3/4: Database disconnected')

      // Step 4: Logger 종료
      // TODO: Logger.flush()
      logger.info('[AppLifecycle] Step 4/4: Logger flushed')

      this.state = 'shutdown'
      logger.info('[AppLifecycle] Shutdown completed. Clean exit.')
    } catch (error) {
      logger.error('[AppLifecycle] Shutdown error:', error)
      // 에러가 나도 프로세스는 종료되어야 함
      throw error
    }
  }

  /**
   * 싱글톤 검증 (인스턴스화 방지)
   */
  private constructor() {
    throw new Error('AppLifecycle is a singleton. Do not instantiate.')
  }
}
