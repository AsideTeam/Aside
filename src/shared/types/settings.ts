/**
 * Settings Types
 * 
 * 프론트엔드와 백엔드 간 공유되는 설정 타입 정의
 */

/**
 * 설정 스키마 (Main Process와 동일)
 */
export interface SettingsSchema {
  theme: 'light' | 'dark' | 'system'
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'naver'
  homepage: string
  showHomeButton: boolean
  showBookmarksBar: boolean
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  customFontSize: number
  pageZoom: string
  blockThirdPartyCookies: boolean
  continueSession: boolean
  language: 'ko' | 'en' | 'ja'
  
  // Autofill
  savePasswords: boolean
  savePaymentInfo: boolean
  saveAddresses: boolean
  
  // Privacy
  doNotTrack: boolean
  blockAds: boolean

  // Downloads
  downloadDirectory: string
  downloadAskWhereToSave: boolean
  downloadOpenAfterSave: boolean

  // Accessibility
  accessibilityHighContrast: boolean
  accessibilityReduceMotion: boolean

  // System
  systemHardwareAcceleration: boolean
  systemBackgroundApps: boolean

  // Extensions
  extensionsEnabled: boolean
  extensionsDirectory: string

  // Default Browser
  defaultBrowserPromptOnStartup: boolean
}

/**
 * 설정 업데이트 결과
 */
export interface SettingsUpdateResult {
  success: boolean
  error?: string
}

/**
 * 테마 타입
 */
export type Theme = SettingsSchema['theme']

/**
 * 검색 엔진 타입
 */
export type SearchEngine = SettingsSchema['searchEngine']

/**
 * 폰트 크기 타입
 */
export type FontSize = SettingsSchema['fontSize']

/**
 * 언어 타입
 */
export type Language = SettingsSchema['language']
