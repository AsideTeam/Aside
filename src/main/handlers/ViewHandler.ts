/**
 * View Handler
 *
 * 책임: Renderer(React) ↔ Main(WebContentsView) 동기화
 * - view:resize: placeholder 좌표에 맞춰 활성 WebContentsView 배치
 * - view:navigate: 활성 WebContentsView URL 이동
 */

import { ipcMain } from 'electron'
import { logger } from '@main/utils/Logger'
import { ViewManager } from '@main/managers/ViewManager'
import type { ViewBounds } from '@shared/types/view'

export function setupViewHandlers(): void {
  logger.info('[ViewHandler] Setting up handlers...')

  ipcMain.on('view:resize', (_event, bounds: ViewBounds) => {
    try {
      ViewManager.setActiveViewBounds(bounds)
    } catch (error) {
      logger.error('[ViewHandler] view:resize failed:', error)
    }
  })

  ipcMain.handle('view:navigate', async (_event, input: unknown) => {
    try {
      const payload = input as { url?: string }
      const url = payload?.url
      if (!url || typeof url !== 'string') {
        return { success: false, error: 'Invalid url' }
      }

      await ViewManager.navigate(url)
      return { success: true, url }
    } catch (error) {
      logger.error('[ViewHandler] view:navigate failed:', error)
      return { success: false, error: String(error) }
    }
  })

  logger.info('[ViewHandler] Handlers setup completed')
}
