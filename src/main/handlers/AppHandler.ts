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

import { ipcMain, app } from 'electron'
import { logger } from '@main/utils/Logger'
import { MainWindow } from '@main/core/Window'
import { AppState } from '@main/managers/AppState'
import { ViewManager } from '@main/managers/ViewManager'

/**
 * 앱 제어 핸들러 등록
 */
export function setupAppHandlers(): void {
  logger.info('[AppHandler] Setting up handlers...')

  // app:quit - 앱 종료
  ipcMain.handle('app:quit', async () => {
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
  ipcMain.handle('app:restart', async () => {
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
  ipcMain.handle('window:minimize', async () => {
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
  ipcMain.handle('window:maximize', async () => {
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
  ipcMain.handle('window:close', async () => {
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
  ipcMain.handle('app:state', async () => {
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

  logger.info('[AppHandler] Handlers setup completed')
}
