/**
 * Settings Handler
 * SRP: IPC 통신만 담당
 * 
 * 책임:
 * - IPC 채널 등록
 * - 요청 파라미터 검증
 * - Service 레이어로 위임
 * - 에러 응답 처리
 */

import { logger } from '@main/utils/logger'
import { ViewManager } from '@main/managers/ViewManager'
import { SettingsService } from '@main/services/SettingsService'
import type { SettingsSchema } from '@shared/types'
import { IPC_CHANNELS } from '@shared/ipc/channels'
import type { IpcRegistry } from './IpcRegistry'

const settingsService = SettingsService.getInstance()

/**
 * Settings IPC 핸들러 등록
 */
export function setupSettingsHandlers(registry: IpcRegistry): void {
  logger.info('[SettingsHandler] Registering IPC handlers')

  /**
   * Settings 페이지 열림/닫힘 상태 처리
   * IPC: view:settings-toggled
   */
  registry.handle(IPC_CHANNELS.VIEW.SETTINGS_TOGGLED, async (_event, input: unknown) => {
    try {
      const { isOpen } = input as { isOpen: boolean }
      if (isOpen) {
        ViewManager.hideActiveView()
        logger.info('[SettingsHandler] Settings page opened - view hidden')
      } else {
        ViewManager.showActiveView()
        logger.info('[SettingsHandler] Settings page closed - view shown')
      }
      return true
    } catch (error) {
      logger.error('[SettingsHandler] Failed to toggle settings:', error)
      throw error
    }
  })

  /**
   * 모든 설정값 조회
   * IPC: settings:get-all
   */
  registry.handle(IPC_CHANNELS.SETTINGS.GET_ALL, async () => {
    try {
      const settings = settingsService.getAllSettings()
      logger.info('[SettingsHandler] Settings retrieved')
      return settings
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsHandler] Failed to get settings:', { error: errorMessage })
      throw new Error(`Failed to get settings: ${errorMessage}`)
    }
  })

  /**
   * 특정 설정값 조회
   * IPC: settings:get
   */
  registry.handle(IPC_CHANNELS.SETTINGS.GET, async (_event, key: keyof SettingsSchema) => {
    try {
      if (!key) {
        throw new Error('Setting key is required')
      }
      const value = settingsService.getSetting(key)
      logger.info('[SettingsHandler] Setting retrieved', { key })
      return value
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsHandler] Failed to get setting:', { key, error: errorMessage })
      throw new Error(`Failed to get setting: ${errorMessage}`)
    }
  })

  /**
   * 설정값 업데이트
   * IPC: settings:update
   */
  registry.handle(
    IPC_CHANNELS.SETTINGS.UPDATE,
    async (
      _event,
      { key, value }: { key: keyof SettingsSchema; value: SettingsSchema[keyof SettingsSchema] }
    ) => {
      try {
        if (!key) {
          throw new Error('Setting key is required')
        }
        if (value === undefined) {
          throw new Error('Setting value is required')
        }

        const result = settingsService.updateSetting(key, value)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update setting')
        }

        logger.info('[SettingsHandler] Setting updated', { key })
        return result
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('[SettingsHandler] Failed to update setting:', { key, error: errorMessage })
        return { success: false, error: errorMessage }
      }
    }
  )

  /**
   * 여러 설정값 한 번에 업데이트
   * IPC: settings:update-multiple
   */
  registry.handle(IPC_CHANNELS.SETTINGS.UPDATE_MULTIPLE, async (_event, updates: Partial<SettingsSchema>) => {
    try {
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Updates object is required')
      }

      const result = settingsService.updateMultipleSettings(updates)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update settings')
      }

      logger.info('[SettingsHandler] Multiple settings updated')
      return result
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsHandler] Failed to update multiple settings:', {
        error: errorMessage,
      })
      return { success: false, error: errorMessage }
    }
  })

  /**
   * 모든 설정값 초기화
   * IPC: settings:reset
   */
  registry.handle(IPC_CHANNELS.SETTINGS.RESET, async () => {
    try {
      const result = settingsService.resetAllSettings()
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset settings')
      }

      logger.info('[SettingsHandler] Settings reset to defaults')
      return result
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsHandler] Failed to reset settings:', { error: errorMessage })
      return { success: false, error: errorMessage }
    }
  })

  logger.info('[SettingsHandler] IPC handlers registered successfully')
}
