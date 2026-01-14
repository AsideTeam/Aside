/**
 * View Handler
 *
 * 책임: Renderer(React) ↔ Main(WebContentsView) 동기화
 * - view:resize: placeholder 좌표에 맞춰 활성 WebContentsView 배치
 * - view:navigate: 활성 WebContentsView URL 이동
 */

import { logger } from '@main/utils/logger'
import { ViewManager } from '@main/managers/viewManager/index'
import type { ViewBounds } from '@shared/types/view'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import { ViewNavigateSchema, ViewResizeSchema } from '@shared/validation/schemas'
import type { IpcRegistry } from './IpcRegistry'

export function setupViewHandlers(registry: IpcRegistry): void {
  logger.info('[ViewHandler] Setting up handlers...')

  const RESIZE_BATCH_MS = 16
  let pendingBounds: ViewBounds | null = null
  let lastAppliedBounds: ViewBounds | null = null
  let resizeTimer: ReturnType<typeof setTimeout> | null = null

  const sameBounds = (a: ViewBounds | null, b: ViewBounds | null): boolean => {
    if (!a || !b) return false
    return a.left === b.left && a.top === b.top
  }

  const flushResize = () => {
    resizeTimer = null
    const next = pendingBounds
    pendingBounds = null
    if (!next) return

    if (sameBounds(lastAppliedBounds, next)) return
    lastAppliedBounds = next

    try {
      ViewManager.setActiveViewBounds(next)
    } catch (error) {
      logger.error('[ViewHandler] view:resize flush failed:', error)
    }
  }

  registry.on(IPC_CHANNELS.VIEW.RESIZE, (_event, bounds: ViewBounds) => {
    try {
      const parsed = ViewResizeSchema.safeParse(bounds)
      if (!parsed.success) {
        logger.warn('[ViewHandler] VIEW.RESIZE validation failed:', { error: parsed.error })
        return
      }

      // Batch to ~1 frame and drop duplicates.
      if (sameBounds(pendingBounds, bounds) || sameBounds(lastAppliedBounds, bounds)) return
      pendingBounds = bounds
      if (!resizeTimer) {
        resizeTimer = setTimeout(flushResize, RESIZE_BATCH_MS)
      }
    } catch (error) {
      logger.error('[ViewHandler] view:resize failed:', error)
    }
  })

  registry.handle(IPC_CHANNELS.VIEW.NAVIGATE, async (_event, input: unknown) => {
    try {
      const parsed = ViewNavigateSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: 'Invalid url' }
      const { url } = parsed.data

      await ViewManager.navigate(url)
      return { success: true, url }
    } catch (error) {
      logger.error('[ViewHandler] view:navigate failed:', error)
      return { success: false, error: String(error) }
    }
  })



  logger.info('[ViewHandler] Handlers setup completed')
}
