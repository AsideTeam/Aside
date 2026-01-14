import { z } from 'zod'

/**
 * Settings schema (runtime)
 * - Renderer/Main에서 동일한 검증 계약을 공유하기 위한 스키마
 */
export const SettingsSchemaZ = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  layoutMode: z.enum(['zen', 'chrome']),
  searchEngine: z.enum(['google', 'bing', 'duckduckgo', 'naver']),
  homepage: z.string(),
  showHomeButton: z.boolean(),
  showBookmarksBar: z.boolean(),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  customFontSize: z.number(),
  pageZoom: z.string(),
  blockThirdPartyCookies: z.boolean(),
  continueSession: z.boolean(),
  language: z.enum(['ko', 'en', 'ja']),
  savePasswords: z.boolean(),
  savePaymentInfo: z.boolean(),
  saveAddresses: z.boolean(),
  doNotTrack: z.boolean(),
  blockAds: z.boolean(),

  downloadDirectory: z.string(),
  downloadAskWhereToSave: z.boolean(),
  downloadOpenAfterSave: z.boolean(),

  accessibilityHighContrast: z.boolean(),
  accessibilityReduceMotion: z.boolean(),

  systemHardwareAcceleration: z.boolean(),
  systemBackgroundApps: z.boolean(),

  extensionsEnabled: z.boolean(),
  extensionsDirectory: z.string(),

  defaultBrowserPromptOnStartup: z.boolean(),
})
