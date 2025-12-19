import { app } from 'electron'
import path from 'path'
import { Config } from './env'
import { createLogger } from '@main/utils/logger'

const logger = createLogger('lifecycle')

/**
 * 앱 생명주기 관리 (Lifecycle Orchestrator)
 *
 * 책임:
 * 1. Bootstrap: 앱 시작 시 필요한 모든 리소스 초기화 순서 보장
 * 2. Shutdown: 앱 종료 시 안전한 정리 순서 보장
 * 3. Error Recovery: 부팅 중 에러 발생 시 graceful 처리
 *
 * 단계:
 * Bootstrap:
 *   1. Config Load
 *   2. Logger Init
 *   3. Database Connection
 *   4. Service Initialization
 *   5. Window Creation (Main)
 *   6. Ready
 *
 * Shutdown:
 *   1. Save State
 *   2. Cleanup Views
 *   3. Disconnect DB
 *   4. Cleanup Files
 *   5. Quit
 */

export class AppLifecycle {
  private static instance: AppLifecycle
  private isBootstrapped = false
  private isShuttingDown = false

  private constructor() {}

  static getInstance(): AppLifecycle {
    if (!AppLifecycle.instance) {
      AppLifecycle.instance = new AppLifecycle()
    }
    return AppLifecycle.instance
  }

  /**
   * 부팅 단계
   */
  async bootstrap(): Promise<void> {
    if (this.isBootstrapped) {
      logger.warn('Bootstrap already called')
      return
    }

    try {
      logger.info('=== BOOTSTRAP START ===')

      // 1. Config Load
      logger.info('Step 1: Config Load')
      const config = Config.getInstance()
      config.load()

      // 2. Logger Init (이미 된 상태)
      logger.info('Step 2: Logger initialized')

      // 3. Database Connection
      logger.info('Step 3: Database Connection')
      const { getPrismaClient } = await import('@main/services/database')
      const db = getPrismaClient()
      // 연결 테스트
      await db.$queryRaw`SELECT 1`
      logger.info('Database connected')

      // 4. Service Initialization
      logger.info('Step 4: Service Initialization')
      const { initializeServices } = await import('@main/services')
      await initializeServices(db)

      // 5. Window Creation은 app.on('ready')에서 처리됨

      this.isBootstrapped = true
      logger.info('=== BOOTSTRAP COMPLETE ===')
    } catch (error) {
      logger.error('Bootstrap failed', error)
      this.isBootstrapped = false
      throw error
    }
  }

  /**
   * 종료 단계
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress')
      return
    }

    this.isShuttingDown = true

    try {
      logger.info('=== SHUTDOWN START ===')

      // 1. Save State
      logger.info('Step 1: Save State')
      // TODO: 마지막 탭 정보 저장

      // 2. Cleanup Views
      logger.info('Step 2: Cleanup Views')
      const { ViewManager } = await import('@main/managers/view-manager')
      const viewManager = ViewManager.getInstance()
      if (viewManager) {
        viewManager.destroy()
      }

      // 3. Disconnect DB
      logger.info('Step 3: Disconnect DB')
      const { closePrismaClient } = await import('@main/services/database')
      await closePrismaClient()

      // 4. Cleanup Files
      logger.info('Step 4: Cleanup Files')
      // TODO: 임시 파일 삭제 등

      logger.info('=== SHUTDOWN COMPLETE ===')
    } catch (error) {
      logger.error('Shutdown error', error)
      // 에러가 있어도 계속 진행 (최대한 정리)
    } finally {
      this.isShuttingDown = false
    }
  }

  isReady(): boolean {
    return this.isBootstrapped
  }
}

export default AppLifecycle.getInstance()
