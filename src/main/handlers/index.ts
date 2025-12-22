/**
 * IPC Handlers Registry
 *
 * 책임: 모든 IPC 핸들러 한 곳에서 등록
 * - 앱 제어 (AppHandler)
 * - 탭 제어 (TabHandler)
 *
 * 사용 예:
 *   import { setupIPCHandlers } from '@main/handlers'
 *   setupIPCHandlers()
 */

import { ipcMain } from 'electron'
import { logger } from '@main/utils/Logger'
import { setupAppHandlers } from './AppHandler'
import { setupTabHandlers } from './TabHandler'

/**
 * 모든 IPC 핸들러 등록
 */
export function setupIPCHandlers(): void {
  logger.info('[IPC] Setting up all handlers...')

  try {
    // Step 1: 앱 핸들러 등록
    setupAppHandlers()
    logger.info('[IPC] App handlers registered')

    // Step 2: 탭 핸들러 등록
    setupTabHandlers()
    logger.info('[IPC] Tab handlers registered')

    logger.info('[IPC] All handlers setup completed')
  } catch (error) {
    logger.error('[IPC] Handler setup failed:', error)
    throw error
  }
}

/**
 * 모든 IPC 핸들러 해제 (앱 종료 시)
 */
export function removeAllIPCHandlers(): void {
  logger.info('[IPC] Removing all handlers...')

  try {
    ipcMain.removeAllListeners()
    logger.info('[IPC] All handlers removed')
  } catch (error) {
    logger.error('[IPC] Handler removal failed:', error)
  }
}
