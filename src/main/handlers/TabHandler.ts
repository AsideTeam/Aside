/**
 * Tab Control Handler
 *
 * 책임: IPC를 통한 탭 제어 (Renderer ↔ Main)
 * - 탭 생성/닫기/전환
 * - 탭 정보 조회
 * - 탭 네비게이션
 *
 * 사용 예 (Renderer에서):
 *   ipcRenderer.invoke('tab:create', { url: 'https://example.com' })
 *   ipcRenderer.invoke('tab:close', { tabId: 'tab-123' })
 */

import { ipcMain } from 'electron'
import { logger } from '@main/utils/Logger'
import { ViewManager } from '@main/managers/ViewManager'
import { AppState } from '@main/managers/AppState'

/**
 * 탭 제어 핸들러 등록
 */
export function setupTabHandlers(): void {
  logger.info('[TabHandler] Setting up handlers...')

  // tab:create - 새 탭 생성
  ipcMain.handle('tab:create', async (_event, { url }: { url: string }) => {
    try {
      logger.info('[TabHandler] tab:create requested', { url })
      const tabId = await ViewManager.createTab(url)
      ViewManager.switchTab(tabId)
      return { success: true, tabId }
    } catch (error) {
      logger.error('[TabHandler] tab:create failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:close - 탭 닫기
  ipcMain.handle('tab:close', async (_event, { tabId }: { tabId: string }) => {
    try {
      logger.info('[TabHandler] tab:close requested', { tabId })
      ViewManager.closeTab(tabId)
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:close failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:switch - 탭 전환
  ipcMain.handle('tab:switch', async (_event, { tabId }: { tabId: string }) => {
    try {
      logger.info('[TabHandler] tab:switch requested', { tabId })
      ViewManager.switchTab(tabId)
      AppState.setLastActiveTabId(tabId)
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:switch failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:list - 탭 리스트 조회
  ipcMain.handle('tab:list', async () => {
    try {
      logger.info('[TabHandler] tab:list requested')
      const tabs = ViewManager.getTabs()
      return { success: true, tabs }
    } catch (error) {
      logger.error('[TabHandler] tab:list failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:active - 활성 탭 ID 조회
  ipcMain.handle('tab:active', async () => {
    try {
      logger.info('[TabHandler] tab:active requested')
      const tabId = ViewManager.getActiveTabId()
      return { success: true, tabId }
    } catch (error) {
      logger.error('[TabHandler] tab:active failed:', error)
      return { success: false, error: String(error) }
    }
  })

  logger.info('[TabHandler] Handlers setup completed')
}
