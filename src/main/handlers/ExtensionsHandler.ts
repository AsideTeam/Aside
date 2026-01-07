import { logger } from '@main/utils/logger'
import { ExtensionsService } from '@main/services/ExtensionsService'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { IpcRegistry } from './IpcRegistry'

const extensionsService = ExtensionsService.getInstance()

export function setupExtensionsHandlers(registry: IpcRegistry): void {
  logger.info('[ExtensionsHandler] Registering IPC handlers')

  registry.handle(IPC_CHANNELS.EXTENSIONS.GET_STATUS, async () => {
    try {
      const status = await extensionsService.getStatus()
      return { success: true, status }
    } catch (error) {
      logger.error('[ExtensionsHandler] get-status failed', error)
      return { success: false, error: String(error) }
    }
  })

  registry.handle(IPC_CHANNELS.EXTENSIONS.RELOAD, async () => {
    return await extensionsService.reload()
  })
}
