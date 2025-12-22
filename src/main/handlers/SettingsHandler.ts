/**
 * Settings Handler
 * 설정 페이지 관련 IPC 요청 처리
 */

import { ipcMain } from 'electron'
import { logger } from '@main/utils/Logger'
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
  },
})

/**
 * Settings IPC 핸들러 등록
 */
export function setupSettingsHandlers(): void {
  logger.info('[IPC] Registering settings handlers...')

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
  ipcMain.handle('settings:get', async (event, key: string) => {
    try {
      const value = store.get(key)
      logger.info('[IPC] Setting retrieved', { key, value })
      return value
    } catch (error) {
      logger.error('[IPC] Failed to get setting:', { key }, error)
      throw error
    }
  })

  /**
   * 설정값 업데이트
   * IPC: settings:update
   */
  ipcMain.handle('settings:update', async (event, key: string, value: any) => {
    try {
      store.set(key, value)
      logger.info('[IPC] Setting updated', { key, value })
      return true
    } catch (error) {
      logger.error('[IPC] Failed to update setting:', { key, value }, error)
      throw error
    }
  })

  /**
   * 여러 설정값 한 번에 업데이트
   * IPC: settings:update-multiple
   */
  ipcMain.handle('settings:update-multiple', async (event, updates: Record<string, any>) => {
    try {
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
