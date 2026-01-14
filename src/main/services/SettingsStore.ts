/**
 * Settings Store
 * SRP: electron-store 추상화 계층
 * 
 * 책임:
 * - 설정 데이터 저장/로드
 * - 기본값 관리
 * - 마이그레이션 처리
 */

import Store from 'electron-store'
import { logger } from '@main/utils/logger'
import type { SettingsSchema } from '@shared/types'

const DEFAULT_SETTINGS: SettingsSchema = {
  theme: 'dark',
  layoutMode: 'zen',
  searchEngine: 'google',
  homepage: 'https://www.google.com',
  showHomeButton: true,
  showBookmarksBar: false,
  fontSize: 'medium',
  customFontSize: 14,
  pageZoom: '100',
  blockThirdPartyCookies: true,
  continueSession: true,
  language: 'ko',
  savePasswords: false,
  savePaymentInfo: false,
  saveAddresses: false,
  doNotTrack: true,
  blockAds: false,

  // Downloads
  downloadDirectory: '',
  downloadAskWhereToSave: false,
  downloadOpenAfterSave: false,

  // Accessibility
  accessibilityHighContrast: false,
  accessibilityReduceMotion: false,

  // System
  systemHardwareAcceleration: true,
  systemBackgroundApps: false,
  // Extensions
  extensionsEnabled: false,
  extensionsDirectory: '',

  // Default Browser
  defaultBrowserPromptOnStartup: true,
}

/**
 * Settings Store Singleton
 */
export class SettingsStore {
  private static instance: SettingsStore | null = null
  private store: Store<SettingsSchema>

  private constructor() {
    this.store = new Store<SettingsSchema>({
      name: 'settings',
      defaults: DEFAULT_SETTINGS,
      // Schema validation
      schema: {
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'system'],
          default: 'dark',
        },
        layoutMode: {
          type: 'string',
          enum: ['zen', 'chrome'],
          default: 'zen',
        },
        searchEngine: {
          type: 'string',
          enum: ['google', 'bing', 'duckduckgo', 'naver'],
          default: 'google',
        },
        homepage: {
          type: 'string',
          format: 'uri',
          default: 'https://www.google.com',
        },
        showHomeButton: {
          type: 'boolean',
          default: true,
        },
        showBookmarksBar: {
          type: 'boolean',
          default: false,
        },
        fontSize: {
          type: 'string',
          enum: ['small', 'medium', 'large', 'xlarge'],
          default: 'medium',
        },
        customFontSize: {
          type: 'number',
          minimum: 8,
          maximum: 24,
          default: 14,
        },
        pageZoom: {
          type: 'string',
          default: '100',
        },
        blockThirdPartyCookies: {
          type: 'boolean',
          default: true,
        },
        continueSession: {
          type: 'boolean',
          default: true,
        },
        language: {
          type: 'string',
          enum: ['ko', 'en', 'ja'],
          default: 'ko',
        },
        savePasswords: {
          type: 'boolean',
          default: false,
        },
        savePaymentInfo: {
          type: 'boolean',
          default: false,
        },
        saveAddresses: {
          type: 'boolean',
          default: false,
        },
        doNotTrack: {
          type: 'boolean',
          default: true,
        },
        blockAds: {
          type: 'boolean',
          default: false,
        },

        // Downloads
        downloadDirectory: {
          type: 'string',
          default: '',
        },
        downloadAskWhereToSave: {
          type: 'boolean',
          default: false,
        },
        downloadOpenAfterSave: {
          type: 'boolean',
          default: false,
        },

        // Accessibility
        accessibilityHighContrast: {
          type: 'boolean',
          default: false,
        },
        accessibilityReduceMotion: {
          type: 'boolean',
          default: false,
        },

        // System
        systemHardwareAcceleration: {
          type: 'boolean',
          default: true,
        },
        systemBackgroundApps: {
          type: 'boolean',
          default: false,
        },
        // Extensions
        extensionsEnabled: {
          type: 'boolean',
          default: false,
        },
        extensionsDirectory: {
          type: 'string',
          default: '',
        },

        // Default Browser
        defaultBrowserPromptOnStartup: {
          type: 'boolean',
          default: true,
        },
      },
      // Migrations for version upgrades
      migrations: {
        '>=0.1.0': (store) => {
          // v0.1.0에서 language 필드 추가
          if (!store.has('language')) {
            store.set('language', 'ko')
          }
        },
      },
      // Migration 로그
      beforeEachMigration: (_store, context) => {
        logger.info(
          `[SettingsStore] Migrating from ${context.fromVersion} → ${context.toVersion}`
        )
      },
    })

    logger.info('[SettingsStore] Initialized', {
      path: this.store.path,
    })
  }

  /**
   * Singleton 인스턴스 반환
   */
  static getInstance(): SettingsStore {
    if (!this.instance) {
      this.instance = new SettingsStore()
    }
    return this.instance
  }

  /**
   * 모든 설정값 조회
   */
  getAll(): SettingsSchema {
    try {
      return this.store.store
    } catch (error) {
      logger.error('[SettingsStore] Failed to get all settings:', error)
      return DEFAULT_SETTINGS
    }
  }

  /**
   * 특정 설정값 조회
   */
  get<K extends keyof SettingsSchema>(key: K): SettingsSchema[K] {
    try {
      return this.store.get(key)
    } catch (error: unknown) {
      logger.error('[SettingsStore] Failed to get setting:', error, { key })
      return DEFAULT_SETTINGS[key]
    }
  }

  /**
   * 설정값 업데이트
   */
  set<K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]): boolean {
    try {
      this.store.set(key, value)
      logger.info('[SettingsStore] Setting updated', { key, value })
      return true
    } catch (error: unknown) {
      logger.error('[SettingsStore] Failed to set setting:', error, { key, value })
      return false
    }
  }

  /**
   * 여러 설정값 한 번에 업데이트
   */
  setMultiple(updates: Partial<SettingsSchema>): boolean {
    try {
      Object.entries(updates).forEach(([key, value]) => {
        this.store.set(key as keyof SettingsSchema, value)
      })
      logger.info('[SettingsStore] Multiple settings updated', {
        count: Object.keys(updates).length,
      })
      return true
    } catch (error) {
      logger.error('[SettingsStore] Failed to set multiple settings:', error)
      return false
    }
  }

  /**
   * 설정값 삭제
   */
  delete<K extends keyof SettingsSchema>(key: K): boolean {
    try {
      this.store.delete(key)
      logger.info('[SettingsStore] Setting deleted', { key })
      return true
    } catch (error: unknown) {
      logger.error('[SettingsStore] Failed to delete setting:', error, { key })
      return false
    }
  }

  /**
   * 모든 설정값 초기화
   */
  reset(): boolean {
    try {
      this.store.clear()
      logger.info('[SettingsStore] All settings reset to defaults')
      return true
    } catch (error) {
      logger.error('[SettingsStore] Failed to reset settings:', error)
      return false
    }
  }

  /**
   * 설정 파일 경로 반환
   */
  getPath(): string {
    return this.store.path
  }

  /**
   * 설정값 변경 감지
   */
  onChange<K extends keyof SettingsSchema>(
    key: K,
    callback: (newValue: SettingsSchema[K] | undefined, oldValue: SettingsSchema[K] | undefined) => void
  ): () => void {
    return this.store.onDidChange(key, callback)
  }

  /**
   * 모든 설정값 변경 감지
   */
  onAnyChange(
    callback: (newValue: SettingsSchema | undefined, oldValue: SettingsSchema | undefined) => void
  ): () => void {
    return this.store.onDidAnyChange(callback)
  }
}
