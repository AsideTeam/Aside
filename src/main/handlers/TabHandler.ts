/**
 * Tab Control Handler
 *
 * 책임: IPC를 통한 탭 제어 (Renderer ↔ Main)
 * - 탭 생성/닫기/전환
 * - 탭 정보 조회
 * - 탭 네비게이션
 *
 * 보안: Zod 런타임 검증으로 악성 데이터 차단
 *
 * 사용 예 (Renderer에서):
 *   ipcRenderer.invoke('tab:create', { url: 'https://example.com' })
 *   ipcRenderer.invoke('tab:close', { tabId: 'tab-123' })
 */

import { ipcMain } from 'electron'
import { logger } from '@main/utils/Logger'
import { ViewManager } from '@main/managers/ViewManager'
import { AppState } from '@main/managers/AppState'
import {
  TabCreateSchema,
  TabCloseSchema,
  TabSwitchSchema,
  validateOrThrow,
} from '@shared/validation/schemas'

/**
 * 탭 제어 핸들러 등록
 */
export function setupTabHandlers(): void {
  logger.info('[TabHandler] Setting up handlers...')

  // tab:create - 새 탭 생성
  ipcMain.handle('tab:create', async (_event, input: unknown) => {
    try {
      // ✅ Step 1: 런타임 검증 (악성 데이터 차단)
      const { url } = validateOrThrow(TabCreateSchema, input)

      logger.info('[TabHandler] tab:create requested', { url })

      // Step 2: 탭 생성
      const tabId = await ViewManager.createTab(url)
      ViewManager.switchTab(tabId)

      logger.info('[TabHandler] tab:create success', { tabId })
      return { success: true, tabId }
    } catch (error) {
      logger.error('[TabHandler] tab:create failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:close - 탭 닫기
  ipcMain.handle('tab:close', async (_event, input: unknown) => {
    try {
      // ✅ 런타임 검증
      const { tabId } = validateOrThrow(TabCloseSchema, input)

      logger.info('[TabHandler] tab:close requested', { tabId })
      ViewManager.closeTab(tabId)

      logger.info('[TabHandler] tab:close success', { tabId })
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:close failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:switch - 탭 전환
  ipcMain.handle('tab:switch', async (_event, input: unknown) => {
    try {
      // ✅ 런타임 검증
      const { tabId } = validateOrThrow(TabSwitchSchema, input)

      logger.info('[TabHandler] tab:switch requested', { tabId })
      ViewManager.switchTab(tabId)
      AppState.setLastActiveTabId(tabId)

      logger.info('[TabHandler] tab:switch success', { tabId })
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

  // tab:navigate - 현재 탭에서 URL 이동
  ipcMain.handle('tab:navigate', async (_event, input: unknown) => {
    try {
      const { url } = validateOrThrow(TabCreateSchema, input)
      logger.info('[TabHandler] tab:navigate requested', { url })
      
      await ViewManager.navigate(url)
      
      logger.info('[TabHandler] tab:navigate success', { url })
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:navigate failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:back - 뒤로 가기
  ipcMain.handle('tab:back', async () => {
    try {
      logger.info('[TabHandler] tab:back requested')
      ViewManager.goBack()
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:back failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:forward - 앞으로 가기
  ipcMain.handle('tab:forward', async () => {
    try {
      logger.info('[TabHandler] tab:forward requested')
      ViewManager.goForward()
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:forward failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:reload - 새로고침
  ipcMain.handle('tab:reload', async () => {
    try {
      logger.info('[TabHandler] tab:reload requested')
      ViewManager.reload()
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:reload failed:', error)
      return { success: false, error: String(error) }
    }
  })

  logger.info('[TabHandler] Handlers setup completed')
}
