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

import { logger } from '@main/utils/logger'
import { setupAppHandlers } from './AppHandler'
import { setupDefaultBrowserHandlers } from './DefaultBrowserHandler'
import { setupExtensionsHandlers } from './ExtensionsHandler'
import { setupTabHandlers } from './TabHandler'
import { setupSettingsHandlers } from './SettingsHandler'
import { setupViewHandlers } from './ViewHandler'
import { IpcRegistry } from './IpcRegistry'

let registry: IpcRegistry | null = null

/**
 * 모든 IPC 핸들러 등록
 */
export function setupIPCHandlers(): void {
  logger.info('[IPC] Setting up all handlers...')

  try {
    if (registry) {
      logger.warn('[IPC] Registry already exists; disposing old handlers first')
      registry.dispose()
    }
    registry = new IpcRegistry()

    // Step 1: 앱 핸들러 등록
    setupAppHandlers(registry)
    logger.info('[IPC] App handlers registered')

    // Step 2: 탭 핸들러 등록
    setupTabHandlers(registry)
    logger.info('[IPC] Tab handlers registered')

    // Step 3: 설정 핸들러 등록
    setupSettingsHandlers(registry)
    logger.info('[IPC] Settings handlers registered')

    // Step 3.1: 확장/기본 브라우저 핸들러 등록
    setupExtensionsHandlers(registry)
    logger.info('[IPC] Extensions handlers registered')

    setupDefaultBrowserHandlers(registry)
    logger.info('[IPC] Default browser handlers registered')

    // Step 4: View(WebContentsView) 핸들러 등록
    setupViewHandlers(registry)
    logger.info('[IPC] View handlers registered')

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
    if (registry) {
      registry.dispose()
      registry = null
    }
    logger.info('[IPC] All handlers removed (registry disposed)')
  } catch (error) {
    logger.error('[IPC] Handler removal failed:', error)
  }
}
