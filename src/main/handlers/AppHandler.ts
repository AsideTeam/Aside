/**
 * App Control Handler
 *
 * 책임: IPC를 통한 앱 제어 (Renderer ↔ Main)
 * - 앱 종료/재시작
 * - 창 최소화/최대화/닫기
 * - 앱 상태 조회
 *
 * 사용 예 (Renderer에서):
 *   ipcRenderer.invoke('app:quit')
 *   ipcRenderer.invoke('window:minimize')
 */

import { app } from 'electron'
import { logger } from '@main/utils/logger'
import { MainWindow } from '@main/core/window'
import { OverlayController } from '@main/core/OverlayController'
import { AppState } from '@main/managers/AppState'
import { ViewManager } from '@main/managers/ViewManager'
import { Env } from '@main/config/env'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { IpcRegistry } from './IpcRegistry'
import { OverlayHoverMetricsSchema } from '@shared/validation/schemas'
import { z } from 'zod'
import { overlayStore } from '@main/state/overlayStore'

/**
 * 앱 제어 핸들러 등록
 */
export function setupAppHandlers(registry: IpcRegistry): void {
  logger.info('[AppHandler] Setting up handlers...')

  // app:quit - 앱 종료
  registry.handle(IPC_CHANNELS.APP.QUIT, async () => {
    try {
      logger.info('[AppHandler] app:quit requested')
      app.quit()
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] app:quit failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // app:restart - 앱 재시작
  registry.handle(IPC_CHANNELS.APP.RESTART, async () => {
    try {
      logger.info('[AppHandler] app:restart requested')
      app.relaunch()
      app.quit()
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] app:restart failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // window:minimize - 창 최소화
  registry.handle(IPC_CHANNELS.WINDOW.MINIMIZE, async () => {
    try {
      logger.info('[AppHandler] window:minimize requested')
      const window = MainWindow.getWindow()
      if (!window) {
        throw new Error('Window not found')
      }
      window.minimize()
      AppState.setIsWindowMinimized(true)
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] window:minimize failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // window:maximize - 창 최대화
  registry.handle(IPC_CHANNELS.WINDOW.MAXIMIZE, async () => {
    try {
      logger.info('[AppHandler] window:maximize requested')
      const window = MainWindow.getWindow()
      if (!window) {
        throw new Error('Window not found')
      }
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
      AppState.setIsWindowMaximized(!AppState.getIsWindowMaximized())
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] window:maximize failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // window:close - 창 닫기
  registry.handle(IPC_CHANNELS.WINDOW.CLOSE, async () => {
    try {
      logger.info('[AppHandler] window:close requested')
      const window = MainWindow.getWindow()
      if (!window) {
        throw new Error('Window not found')
      }
      window.close()
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] window:close failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // app:state - 앱 상태 조회 (탭 정보 포함)
  registry.handle(IPC_CHANNELS.APP.STATE, async () => {
    try {
      logger.info('[AppHandler] app:state requested')
      
      // AppState + ViewManager 탭 정보를 합쳐서 반환
      const appState = AppState.getState()
      const tabs = ViewManager.getTabs()
      const activeTabId = ViewManager.getActiveTabId()
      
      const state = {
        ...appState,
        tabs,
        activeTabId,
      }
      
      return { success: true, state }
    } catch (error) {
      logger.error('[AppHandler] app:state failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // app:get-info - 앱 메타데이터 조회
  registry.handle(IPC_CHANNELS.APP.GET_INFO, async () => {
    try {
      const info = {
        name: Env.appName,
        version: Env.appVersion,
        userDataDir: Env.dataDir,
      }
      return { success: true, info }
    } catch (error) {
      logger.error('[AppHandler] app:get-info failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // ===== Overlay toggles (UI / Keyboard parity) =====
  registry.handle(IPC_CHANNELS.OVERLAY.TOGGLE_HEADER_LATCH, async () => {
    try {
      const latched = OverlayController.toggleHeaderLatched()
      return { success: true, latched }
    } catch (error) {
      logger.error('[AppHandler] overlay:toggle-header-latch failed:', error)
      return { success: false, error: String(error) }
    }
  })

  registry.handle(IPC_CHANNELS.OVERLAY.TOGGLE_SIDEBAR_LATCH, async () => {
    try {
      const latched = OverlayController.toggleSidebarLatched()
      return { success: true, latched }
    } catch (error) {
      logger.error('[AppHandler] overlay:toggle-sidebar-latch failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // ⭐ 드래그 상태 관리: 드래그 중에는 레이아웃 계산 차단
  registry.handle(IPC_CHANNELS.OVERLAY.SET_INTERACTIVE, async (_event, payload: unknown) => {
    try {
      const parsed = z.object({ interactive: z.boolean() }).safeParse(payload)
      if (!parsed.success) {
        return { success: false, error: 'Invalid payload' }
      }
      
      // 드래그 중이면 interactive=false, 드래그 종료면 interactive=true
      const isDragging = !parsed.data.interactive
      overlayStore.getState().setDragging(isDragging)
      
      logger.debug('[AppHandler] overlay:set-interactive', { interactive: parsed.data.interactive, isDragging })
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] overlay:set-interactive failed:', error)
      return { success: false, error: String(error) }
    }
  })

  registry.handle(IPC_CHANNELS.OVERLAY.DEBUG, async (_event, payload: unknown) => {
    try {
      logger.debug('[OverlayDebug]', { payload })
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] overlay:debug failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // Renderer 실측 기반 hover metrics 업데이트
  registry.handle(IPC_CHANNELS.OVERLAY.UPDATE_HOVER_METRICS, async (_event, payload: unknown) => {
    try {
      const parsed = OverlayHoverMetricsSchema.safeParse(payload)
      if (!parsed.success) {
        logger.warn('[AppHandler] ❌ Zod validation failed for hover metrics', { error: parsed.error.message, payload })
        return { success: false, error: parsed.error.message }
      }

      OverlayController.updateHoverMetrics(parsed.data)
      return { success: true }
    } catch (error) {
      logger.error('[AppHandler] overlay:update-hover-metrics failed:', error)
      return { success: false, error: String(error) }
    }
  })

  logger.info('[AppHandler] Handlers setup completed')
}
