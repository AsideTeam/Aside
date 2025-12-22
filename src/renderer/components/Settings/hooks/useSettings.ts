/**
 * Settings State Management Hook
 * SRP: 설정 상태 관리만 담당
 */

import { useState, useEffect } from 'react'
import type { SettingsSchema } from '@shared/types'

const DEFAULT_SETTINGS: SettingsSchema = {
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
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsSchema>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 설정 로드
  useEffect(() => {
    void loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      setError(null)

      if (!window.electronAPI?.settings?.getSettings) {
        throw new Error('Settings API not available')
      }

      const loadedSettings = await window.electronAPI.settings.getSettings()
      console.log('[Settings] Loaded from electron-store:', loadedSettings)

      setSettings(prev => ({
        ...prev,
        ...loadedSettings,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
      console.error('[Settings] Load error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function updateSetting<K extends keyof SettingsSchema>(
    key: K,
    value: SettingsSchema[K]
  ): Promise<boolean> {
    try {
      if (!window.electronAPI?.settings?.updateSetting) {
        throw new Error('Settings API not available')
      }

      console.log('[Settings] Updating:', { key, value })
      await window.electronAPI.settings.updateSetting(key, value)

      setSettings(prev => ({
        ...prev,
        [key]: value,
      }))

      console.log('[Settings] Updated successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to update ${key}`
      console.error('[Settings] Update error:', errorMessage)
      setError(errorMessage)
      return false
    }
  }

  async function resetSettings(): Promise<boolean> {
    try {
      if (!window.electronAPI?.invoke) {
        throw new Error('Settings API not available')
      }

      await window.electronAPI.invoke('settings:reset')
      setSettings(DEFAULT_SETTINGS)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings'
      console.error('[Settings] Reset error:', errorMessage)
      setError(errorMessage)
      return false
    }
  }

  return {
    settings,
    loading,
    error,
    updateSetting,
    resetSettings,
    reloadSettings: loadSettings,
  }
}
