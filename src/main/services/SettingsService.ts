/**
 * Settings Service
 * SRP: 설정 비즈니스 로직
 * 
 * 책임:
 * - 설정 CRUD 로직
 * - 설정 유효성 검증
 * - 설정 변경 이벤트 처리
 * - 다른 서비스와의 협업
 */

import { logger } from '@main/utils/Logger'
import { SettingsStore } from './SettingsStore'
import type { SettingsSchema } from '@shared/types'

/**
 * Settings Service Singleton
 */
export class SettingsService {
  private static instance: SettingsService | null = null
  private store: SettingsStore

  private constructor() {
    this.store = SettingsStore.getInstance()
    this.setupChangeListeners()
  }

  /**
   * Singleton 인스턴스 반환
   */
  static getInstance(): SettingsService {
    if (!this.instance) {
      this.instance = new SettingsService()
    }
    return this.instance
  }

  /**
   * 모든 설정값 조회
   */
  getAllSettings(): SettingsSchema {
    logger.info('[SettingsService] Getting all settings')
    return this.store.getAll()
  }

  /**
   * 특정 설정값 조회
   */
  getSetting<K extends keyof SettingsSchema>(key: K): SettingsSchema[K] {
    logger.info('[SettingsService] Getting setting', { key })
    return this.store.get(key)
  }

  /**
   * 설정값 업데이트 (검증 포함)
   */
  updateSetting<K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ): { success: boolean; error?: string } {
    try {
      // 유효성 검증
      const validationError = this.validateSetting(key, value)
      if (validationError) {
        logger.warn('[SettingsService] Validation failed', { key, error: validationError })
        return { success: false, error: validationError }
      }

      // 저장
      const success = this.store.set(key, value)
      if (!success) {
        return { success: false, error: 'Failed to save setting' }
      }

      logger.info('[SettingsService] Setting updated successfully', { key })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsService] Failed to update setting:', error, { key })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 여러 설정값 한 번에 업데이트
   */
  updateMultipleSettings(
    updates: Partial<SettingsSchema>
  ): { success: boolean; error?: string } {
    try {
      // 모든 값 검증
      for (const [key, value] of Object.entries(updates)) {
        const validationError = this.validateSetting(
          key as keyof SettingsSchema,
          value as SettingsSchema[keyof SettingsSchema]
        )
        if (validationError) {
          return { success: false, error: `${key}: ${validationError}` }
        }
      }

      // 저장
      const success = this.store.setMultiple(updates)
      if (!success) {
        return { success: false, error: 'Failed to save settings' }
      }

      logger.info('[SettingsService] Multiple settings updated successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsService] Failed to update multiple settings:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 설정값 삭제
   */
  deleteSetting<K extends keyof SettingsSchema>(key: K): { success: boolean; error?: string } {
    try {
      const success = this.store.delete(key)
      if (!success) {
        return { success: false, error: 'Failed to delete setting' }
      }

      logger.info('[SettingsService] Setting deleted', { key })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsService] Failed to delete setting:', error, { key })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 모든 설정값 초기화
   */
  resetAllSettings(): { success: boolean; error?: string } {
    try {
      const success = this.store.reset()
      if (!success) {
        return { success: false, error: 'Failed to reset settings' }
      }

      logger.info('[SettingsService] All settings reset')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('[SettingsService] Failed to reset settings:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 설정 파일 경로 반환
   */
  getSettingsPath(): string {
    return this.store.getPath()
  }

  /**
   * 설정값 유효성 검증
   */
  private validateSetting<K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ): string | null {
    // 타입 체크
    if (value === undefined || value === null) {
      return 'Value cannot be undefined or null'
    }

    // 각 설정별 커스텀 검증
    switch (key) {
      case 'homepage':
        if (typeof value === 'string') {
          try {
            new URL(value)
          } catch {
            return 'Invalid URL format'
          }
        }
        break

      case 'pageZoom':
        if (typeof value === 'string') {
          const zoom = parseInt(value, 10)
          if (isNaN(zoom) || zoom < 25 || zoom > 500) {
            return 'Page zoom must be between 25% and 500%'
          }
        }
        break

      case 'theme':
        if (!['light', 'dark', 'system'].includes(value as string)) {
          return 'Invalid theme value'
        }
        break

      case 'searchEngine':
        if (!['google', 'bing', 'duckduckgo', 'naver'].includes(value as string)) {
          return 'Invalid search engine'
        }
        break

      case 'fontSize':
        if (!['small', 'medium', 'large'].includes(value as string)) {
          return 'Invalid font size'
        }
        break

      case 'language':
        if (!['ko', 'en', 'ja'].includes(value as string)) {
          return 'Invalid language'
        }
        break
    }

    return null
  }

  /**
   * 설정 변경 리스너 설정
   */
  private setupChangeListeners(): void {
    // 모든 설정 변경 감지
    this.store.onAnyChange((newValue, oldValue) => {
      if (!newValue || !oldValue) return
      logger.info('[SettingsService] Settings changed', {
        changes: this.getChangedKeys(oldValue, newValue),
      })
    })

    // 특정 설정 변경 감지 예시
    this.store.onChange('theme', (newTheme) => {
      logger.info('[SettingsService] Theme changed', { theme: newTheme })
      // 테마 변경 시 추가 로직 (예: UI 업데이트 이벤트 발행)
    })
  }

  /**
   * 변경된 키 목록 반환
   */
  private getChangedKeys(
    oldValue: SettingsSchema,
    newValue: SettingsSchema
  ): Array<keyof SettingsSchema> {
    const changed: Array<keyof SettingsSchema> = []
    for (const key in newValue) {
      if (oldValue[key as keyof SettingsSchema] !== newValue[key as keyof SettingsSchema]) {
        changed.push(key as keyof SettingsSchema)
      }
    }
    return changed
  }
}
