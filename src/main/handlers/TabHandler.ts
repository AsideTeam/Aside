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

import { logger } from '@main/utils/logger'
import { ViewManager } from '@main/managers/viewManager/index'
import { AppState } from '@main/managers/AppState'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { IpcRegistry } from './IpcRegistry'
import {
  TabCreateSchema,
  TabCloseSchema,
  TabSwitchSchema,
  TabMoveSectionSchema,
  TabReorderWithinSectionSchema,
  TabReorderIconSchema,
  validateOrThrow,
} from '@shared/validation/schemas'

/**
 * 탭 제어 핸들러 등록
 */
export function setupTabHandlers(registry: IpcRegistry): void {
  logger.info('[TabHandler] Setting up handlers...')

  // tab:create - 새 탭 생성
  registry.handle(IPC_CHANNELS.TAB.CREATE, async (_event, input: unknown) => {
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
  registry.handle(IPC_CHANNELS.TAB.CLOSE, async (_event, input: unknown) => {
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
  registry.handle(IPC_CHANNELS.TAB.SWITCH, async (_event, input: unknown) => {
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
  registry.handle(IPC_CHANNELS.TAB.LIST, async () => {
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
  registry.handle(IPC_CHANNELS.TAB.ACTIVE, async () => {
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
  registry.handle(IPC_CHANNELS.TAB.NAVIGATE, async (_event, input: unknown) => {
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
  registry.handle(IPC_CHANNELS.TAB.BACK, async () => {
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
  registry.handle(IPC_CHANNELS.TAB.FORWARD, async () => {
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
  registry.handle(IPC_CHANNELS.TAB.RELOAD, async () => {
    try {
      logger.info('[TabHandler] tab:reload requested')
      ViewManager.reload()
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:reload failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:reorder - 탭 순서 변경 (드래그앤드롭)
  registry.handle(IPC_CHANNELS.TAB.REORDER, async (_event, input: unknown) => {
    try {
      const { tabId, position } = validateOrThrow(TabReorderWithinSectionSchema, input)
      logger.info('[TabHandler] tab:reorder requested', { tabId, position })
      
      ViewManager.reorderTabWithinSection(tabId, position)
      
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:reorder failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:reorder-icon - Icon 섹션의 앱 순서 변경
  registry.handle(IPC_CHANNELS.TAB.REORDER_ICON, async (_event, input: unknown) => {
    try {
      const { fromIndex, toIndex } = validateOrThrow(TabReorderIconSchema, input)
      logger.info('[TabHandler] tab:reorder-icon requested', { fromIndex, toIndex })
      
      ViewManager.reorderIcon(fromIndex, toIndex)
      
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:reorder-icon failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // tab:move-section - 탭을 다른 섹션으로 이동 (Icon/Space/Tab)
  registry.handle(IPC_CHANNELS.TAB.MOVE_SECTION, async (_event, input: unknown) => {
    try {
      const { tabId, targetType } = validateOrThrow(TabMoveSectionSchema, input)
      logger.info('[TabHandler] tab:move-section requested', { tabId, targetType })
      
      // targetType에 따라 상태 업데이트
      ViewManager.moveTabToSection(tabId, targetType)
      
      return { success: true }
    } catch (error) {
      logger.error('[TabHandler] tab:move-section failed:', error)
      return { success: false, error: String(error) }
    }
  })

  logger.info('[TabHandler] Handlers setup completed')
}
