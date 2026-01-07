import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'

import type { SettingsSchema } from '@shared/types'
import { logger } from '@renderer/lib/logger'

const SettingsSchemaZ = z.object({
  theme: z.enum(['light', 'dark', 'system']),
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

type UpdateResult = { success?: boolean; error?: string }

type UseAppSettingsResult = {
  settings: SettingsSchema | null
  isLoading: boolean
  refresh: () => Promise<void>
  updateSetting: <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => Promise<void>
  resetAll: () => Promise<void>
}

export function useAppSettings(): UseAppSettingsResult {
  const [settings, setSettings] = useState<SettingsSchema | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const raw: unknown = await window.electronAPI?.invoke('settings:get-all')
      const parsed = SettingsSchemaZ.safeParse(raw)
      if (!parsed.success) {
        logger.warn('[useAppSettings] Invalid settings payload from main')
        return
      }
      setSettings(parsed.data)
    } catch (error) {
      logger.error('[useAppSettings] Failed to load settings', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSetting = useCallback(
    async <K extends keyof SettingsSchema>(key: K, value: SettingsSchema[K]) => {
      try {
        const result: unknown = await window.electronAPI?.invoke('settings:update', { key, value })
        const parsed = z.object({ success: z.boolean().optional(), error: z.string().optional() }).safeParse(result)
        const ok = (parsed.success ? parsed.data.success : (result as UpdateResult | null)?.success) ?? false

        if (!ok) {
          const err = parsed.success ? parsed.data.error : undefined
          logger.warn('[useAppSettings] Update rejected', { key, error: err })
          return
        }

        setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
      } catch (error) {
        logger.error('[useAppSettings] Failed to update setting', error)
      }
    },
    []
  )

  const resetAll = useCallback(async () => {
    try {
      await window.electronAPI?.invoke('settings:reset')
    } catch (error) {
      logger.error('[useAppSettings] Failed to reset settings', error)
    } finally {
      await refresh()
    }
  }, [refresh])

  return {
    settings,
    isLoading,
    refresh,
    updateSetting,
    resetAll,
  }
}
