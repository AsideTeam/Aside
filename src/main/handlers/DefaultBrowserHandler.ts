import { logger } from '@main/utils/logger'
import { DefaultBrowserService } from '@main/services/DefaultBrowserService'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { IpcRegistry } from './IpcRegistry'

const defaultBrowserService = DefaultBrowserService.getInstance()

export function setupDefaultBrowserHandlers(registry: IpcRegistry): void {
  logger.info('[DefaultBrowserHandler] Registering IPC handlers')

  registry.handle(IPC_CHANNELS.DEFAULT_BROWSER.GET_STATUS, async () => {
    try {
      const status = defaultBrowserService.getStatus()
      return { success: true, status }
    } catch (error) {
      logger.error('[DefaultBrowserHandler] get-status failed', error)
      return { success: false, error: String(error) }
    }
  })

  registry.handle(IPC_CHANNELS.DEFAULT_BROWSER.SET_DEFAULT, async () => {
    return defaultBrowserService.setDefault()
  })

  registry.handle(IPC_CHANNELS.DEFAULT_BROWSER.OPEN_SYSTEM_SETTINGS, async () => {
    return await defaultBrowserService.openSystemSettings()
  })
}
