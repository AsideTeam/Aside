/**
 * Settings Handler
 * 설정 페이지 관련 IPC 요청 처리
 */

import { ipcMain } from 'electron'
import { logger } from '@main/utils/Logger'
import { ViewManager } from '@main/managers/ViewManager'
import Store from 'electron-store'

// 설정 저장소 초기화
const store = new Store({
  defaults: {
    theme: 'dark',
    searchEngine: 'google',
    homepage: 'https://www.google.com',
    showHomeButton: true,
    showBookmarksBar: false,
    fontSize: 'medium',
    pageZoom: '100',
    blockThirdPartyCookies: true,
    continueSession: true,
    language: 'ko',
  },
})

/**
 * Settings IPC 핸들러 등록
 */
export function setupSettingsHandlers(): void {
  logger.info('[IPC] Registering settings handlers...')

  /**
   * Settings 페이지 열림/닫힘 상태 처리
   * IPC: view:settings-toggled
   */
  ipcMain.handle('view:settings-toggled', async (_event, input: unknown) => {
    try {
      const { isOpen } = input as { isOpen: boolean }
      if (isOpen) {
        // Settings 페이지가 열렸을 때: WebContentsView 숨기기
        ViewManager.hideActiveView()
        logger.info('[IPC] Settings page opened - view hidden')
      } else {
        // Settings 페이지가 닫혔을 때: WebContentsView 다시 보여주기
        ViewManager.showActiveView()
        logger.info('[IPC] Settings page closed - view shown')
      }
      return true
    } catch (error) {
      logger.error('[IPC] Failed to toggle settings:', error)
      throw error
    }
  })

  /**
   * 모든 설정값 조회
   * IPC: settings:get-all
   */
  ipcMain.handle('settings:get-all', async () => {
    try {
      const settings = store.store
      logger.info('[IPC] Settings retrieved', { keys: Object.keys(settings) })
      return settings
    } catch (error) {
      logger.error('[IPC] Failed to get settings:', error)
      throw error
    }
  })

  /**
   * 특정 설정값 조회
   * IPC: settings:get
   */
  ipcMain.handle('settings:get', async (_event, input: unknown) => {
    try {
      const key = input as string
      const value = store.get(key)
      logger.info('[IPC] Setting retrieved', { key, value })
      return value
    } catch (error) {
      logger.error('[IPC] Failed to get setting:', error)
      throw error
    }
  })

  /**
   * 설정값 업데이트
   * IPC: settings:update
   */
  ipcMain.handle('settings:update', async (_event, input: unknown) => {
    try {
      const { key, value } = input as { key: string; value: unknown }
      store.set(key, value)
      logger.info('[IPC] Setting updated', { key })
      return true
    } catch (error) {
      logger.error('[IPC] Failed to update setting:', error)
      throw error
    }
  })

  /**
   * 여러 설정값 한 번에 업데이트
   * IPC: settings:update-multiple
   */
  ipcMain.handle('settings:update-multiple', async (_event, input: unknown) => {
    try {
      const updates = input as Record<string, unknown>
      Object.entries(updates).forEach(([key, value]) => {
        store.set(key, value)
      })
      logger.info('[IPC] Multiple settings updated', { count: Object.keys(updates).length })
      return true
    } catch (error) {
      logger.error('[IPC] Failed to update multiple settings:', error)
      throw error
    }
  })

  /**
   * 모든 설정값 초기화
   * IPC: settings:reset
   */
  ipcMain.handle('settings:reset', async () => {
    try {
      store.clear()
      logger.info('[IPC] Settings reset to defaults')
      return true
    } catch (error) {
      logger.error('[IPC] Failed to reset settings:', error)
      throw error
    }
  })

  logger.info('[IPC] Settings handlers registered')
}
