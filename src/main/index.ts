/**
 * Main Process Entry Point
 *
 * 책임: Electron 앱의 메인 프로세스 시작
 * - Lifecycle 관리 (bootstrap, shutdown)
 * - Electron 이벤트 리스닝
 * - IPC 설정
 *
 * 흐름:
 * 1. app.ready → AppLifecycle.bootstrap()
 * 2. 앱 실행 중 → IPC 통신
 * 3. app.will-quit → AppLifecycle.shutdown()
 */

import { app } from 'electron'
import Store from 'electron-store'
import { logger } from '@main/utils/Logger'
import { AppLifecycle } from '@main/core/lifecycle'
import { SessionManager } from '@main/core/Session'
import { UpdateService } from '@main/services/Update'
import { setupIPCHandlers, removeAllIPCHandlers } from '@main/handlers'
import { setupProtocolHandlers, setupNavigationInterceptors } from '@main/handlers/ProtocolHandler'

// 앱 이름 설정 (userData 경로에 영향을 줌)
app.name = 'aside'

// 프로토콜 핸들러 등록 (app.ready 전에 호출 필요)
setupProtocolHandlers()

// 싱글 인스턴스 잠금 (두 번 실행 방지)
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  logger.warn('[Main] App already running. Exiting.')
  app.quit()
} else {
  /**
   * app.ready 이벤트
   * 
   * Electron이 초기화를 완료하고 BrowserWindow를 생성할 준비가 됨
   * 모든 앱 초기화는 여기서 시작
   */
  app.on('ready', async () => {
    logger.info('[Main] App ready event triggered')

    try {
      // Step 1: electron-store Renderer 접근 활성화
      logger.info('[Main] Step 1/5: Initializing electron-store...')
      Store.initRenderer()

      // Step 2: Session 설정 (CSP, 권한 등)
      logger.info('[Main] Step 2/5: Setting up session...')
      SessionManager.setup()

      // Step 2.5: Navigation interceptors 설정
      logger.info('[Main] Step 2.5/5: Setting up navigation interceptors...')
      setupNavigationInterceptors()

      // Step 3: IPC 핸들러 등록
      logger.info('[Main] Step 3/5: Setting up IPC handlers...')
      setupIPCHandlers()

      // Step 4: 서비스 초기화
      logger.info('[Main] Step 4/5: Initializing services...')
      UpdateService.initialize()

      // Step 5: 메인 앱 부트스트랩
      logger.info('[Main] Step 5/5: Bootstrapping application...')
      await AppLifecycle.bootstrap()

      logger.info('[Main] App ready. All systems online.')
    } catch (error) {
      logger.error('[Main] App ready failed:', error)
      app.quit()
    }
  })

  /**
   * app.window-all-closed 이벤트
   * 
   * 모든 창이 닫혔을 때
   * macOS에서는 보통 앱을 종료하지 않음 (메뉴바 남김)
   */
  app.on('window-all-closed', () => {
    logger.info('[Main] All windows closed')

    if (process.platform !== 'darwin') {
      logger.info('[Main] Quitting app (non-macOS)')
      app.quit()
    } else {
      logger.info('[Main] Keeping app running (macOS)')
    }
  })

  /**
   * app.activate 이벤트
   * 
   * macOS에서 Dock 아이콘을 클릭했을 때
   */
  app.on('activate', () => {
    logger.info('[Main] App activated')

    // TODO: 최소화된 창 복원 또는 새 창 생성
    // const windows = BrowserWindow.getAllWindows()
    // if (windows.length === 0) {
    //   createWindow()
    // }
  })

  /**
   * app.will-quit 이벤트
   * 
   * 앱이 종료될 때 (마지막 체크 포인트)
   * 리소스 정리 로직 실행
   */
  app.on('will-quit', async () => {
    logger.info('[Main] App will-quit event triggered')

    try {
      // Step 1: 앱 Shutdown
      logger.info('[Main] Step 1/3: Running shutdown...')
      await AppLifecycle.shutdown()

      // Step 2: 업데이트 서비스 정지
      logger.info('[Main] Step 2/3: Stopping update service...')
      UpdateService.stop()

      // Step 3: IPC 핸들러 정리
      logger.info('[Main] Step 3/3: Removing IPC handlers...')
      removeAllIPCHandlers()

      logger.info('[Main] App shutdown completed. Goodbye.')
    } catch (error) {
      logger.error('[Main] App shutdown failed:', error)
    }
  })

  /**
   * 처리되지 않은 예외 캐치
   */
  process.on('uncaughtException', (error) => {
    logger.error('[Main] Uncaught exception:', error)
  })

  /**
   * 처리되지 않은 Promise rejection
   */
  process.on('unhandledRejection', (reason) => {
    logger.error('[Main] Unhandled rejection:', reason)
  })
}
