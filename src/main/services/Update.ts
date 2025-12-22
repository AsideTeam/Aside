/**
 * Auto Update Service
 *
 * 책임: 자동 업데이트 로직
 * - 새 버전 확인
 * - 업데이트 다운로드/설치
 * - 업데이트 알림
 *
 * 사용 예:
 *   import { UpdateService } from '@main/services/Update'
 *   UpdateService.initialize()
 */

import { logger } from '@main/utils/Logger'

/**
 * Update Service 싱글톤
 */
export class UpdateService {
  private static isCheckingUpdate = false
  private static updateCheckInterval: NodeJS.Timeout | null = null

  /**
   * Update Service 초기화
   *
   * 프로세스:
   * 1. 초기 업데이트 확인
   * 2. 주기적 확인 스케줄 설정 (24시간마다)
   */
  static initialize(): void {
    logger.info('[UpdateService] Initializing...')

    try {
      // Step 1: 초기 확인
      this.checkForUpdates()

      // Step 2: 24시간마다 확인
      this.updateCheckInterval = setInterval(() => {
        this.checkForUpdates()
      }, 24 * 60 * 60 * 1000)

      logger.info('[UpdateService] Initialization completed')
    } catch (error) {
      logger.error('[UpdateService] Initialization failed:', error)
    }
  }

  /**
   * 업데이트 확인
   */
  private static async checkForUpdates(): Promise<void> {
    if (this.isCheckingUpdate) {
      logger.warn('[UpdateService] Update check already in progress')
      return
    }

    this.isCheckingUpdate = true

    try {
      logger.info('[UpdateService] Checking for updates...')

      // TODO: electron-updater 또는 커스텀 업데이트 로직
      // const hasUpdate = await autoUpdater.checkForUpdates()

      logger.info('[UpdateService] Update check completed')
    } catch (error) {
      logger.error('[UpdateService] Update check failed:', error)
    } finally {
      this.isCheckingUpdate = false
    }
  }

  /**
   * 즉시 업데이트 확인
   */
  static async checkNow(): Promise<void> {
    logger.info('[UpdateService] Immediate update check requested')
    await this.checkForUpdates()
  }

  /**
   * 업데이트 정지
   */
  static stop(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
    }
    logger.info('[UpdateService] Update service stopped')
  }
}
