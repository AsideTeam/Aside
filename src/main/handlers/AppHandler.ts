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

/**
 * 앱 제어 핸들러 등록
 */
export function setupAppHandlers(): void {
  logger.info('[AppHandler] Setting up handlers...')

  // app:quit - 앱 종료
  ipcMain.handle('app:quit', async () => {
    logger.info('[AppHandler] app:quit requested')
    app.quit()
    return { success: true }
  })

  // app:restart - 앱 재시작
  ipcMain.handle('app:restart', async () => {
    logger.info('[AppHandler] app:restart requested')
    app.relaunch()
    app.quit()
    return { success: true }
  })

  // window:minimize - 창 최소화
  ipcMain.handle('window:minimize', async () => {
    logger.info('[AppHandler] window:minimize requested')
    const window = MainWindow.getWindow()
    if (window) {
      window.minimize()
      AppState.setIsWindowMinimized(true)
      return { success: true }
    }
    return { success: false, error: 'Window not found' }
  })

  // window:maximize - 창 최대화
  ipcMain.handle('window:maximize', async () => {
    logger.info('[AppHandler] window:maximize requested')
    const window = MainWindow.getWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
      AppState.setIsWindowMaximized(!AppState.getIsWindowMaximized())
      return { success: true }
    }
    return { success: false, error: 'Window not found' }
  })

  // window:close - 창 닫기
  ipcMain.handle('window:close', async () => {
    logger.info('[AppHandler] window:close requested')
    const window = MainWindow.getWindow()
    if (window) {
      window.close()
      return { success: true }
    }
    return { success: false, error: 'Window not found' }
  })

  // app:state - 앱 상태 조회
  ipcMain.handle('app:state', async () => {
    logger.info('[AppHandler] app:state requested')
    const state = AppState.getState()
    return { success: true, state }
  })

  logger.info('[AppHandler] Handlers setup completed')
}
